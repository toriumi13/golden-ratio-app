import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    orderBy,
    deleteDoc,
    Timestamp,
    addDoc,
    where,
    increment,
    runTransaction
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './firebase';
import { Recipe, Version, Section, Step, Ingredient } from '../types';
import { checkSubscriptionStatus } from './subscription';
import { Platform } from 'react-native';

const ADMIN_EMAILS = ['katsushige2823@gmail.com'];

export const isAdmin = (): boolean => {
    return auth.currentUser?.email ? ADMIN_EMAILS.includes(auth.currentUser.email) : false;
};

// ---- Image Upload (Base64 for Free Tier) ----
export const uploadRecipeImage = async (recipeId: string, base64Uri: string): Promise<string> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Not authenticated");

    // Save Base64 string directly to recipe document
    const recipeDocRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeDocRef, { imageUrl: base64Uri });

    return base64Uri;
};

export const deleteRecipeImage = async (recipeId: string): Promise<void> => {
    const recipeDocRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeDocRef, { imageUrl: null });
};

/**
 * FIRESTORE REPOSITORY
 * Hierarchical Structure:
 * recipes/{recipeId}
 * recipes/{recipeId}/versions/{versionId}
 * 
 * To optimize reads, we store sections and steps directly inside the Version document.
 */

// --- Subscription Utilities ---

export type UserPlan = 'free' | 'standard';

export interface UserProfile {
    uid: string;
    plan: UserPlan;
    isPremium: boolean;
}

/**
 * Gets the current user's plan.
 * Default is 'free' if no profile exists.
 */
export const getUserProfile = async (): Promise<UserProfile> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Not authenticated");

    // 1. Check RevenueCat status for Mobile
    let isPremium = false;
    if (Platform.OS !== 'web') {
        isPremium = await checkSubscriptionStatus();
    }

    // 2. Check Firestore profile
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Merge with RevenueCat status - if either says premium, it's premium
        return {
            ...data,
            plan: (isPremium || data.plan === 'standard') ? 'standard' : 'free',
            isPremium: isPremium || data.isPremium
        };
    }

    // Default for new/existing users without profile, but with RevenueCat check
    return {
        uid: userId,
        plan: isPremium ? 'standard' : 'free',
        isPremium: isPremium
    };
};


export const getRecipeCount = async (): Promise<number> => {
    const recipes = await getRecipes();
    return recipes.length;
};


export const createRecipe = async (name: string, originRecipeId?: string, baseServings: number = 1): Promise<Recipe> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User must be logged in to create a recipe");

    // --- Subscription Check ---
    const profile = await getUserProfile();
    if (profile.plan === 'free' && !isAdmin()) {
        const count = await getRecipeCount();
        if (count >= 5) {
            throw new Error("レシピの保存上限（5個）に達しました。無制限に保存するにはスタンダードプランを検討してください。");
        }
    }


    const recipeId = uuidv4();
    const now = new Date().toISOString();
    const versionId = uuidv4();

    const recipeRef = doc(db, 'recipes', recipeId);
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);

    const recipeData: Recipe = {
        id: recipeId,
        userId: userId,
        name,
        originRecipeId: originRecipeId || null,
        createdAt: now,
        currentVersionId: versionId,
        latestVersionNumber: '1.0',
        latestVersionDate: now,
        tags: []
    };

    // 1. Create Recipe
    await setDoc(recipeRef, recipeData);

    // 2. Create Initial Version (1.0)
    await setDoc(versionRef, {
        id: versionId,
        recipeId: recipeId,
        versionNumber: '1.0',
        createdAt: now,
        isPublic: false,
        baseServings,
        sections: [],
        steps: []
    });

    return recipeData;
};

export const getRecipes = async (): Promise<Recipe[]> => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            return [];
        }

        const recipesCol = collection(db, 'recipes');
        const q = query(
            recipesCol,
            where("userId", "==", userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Recipe);
    } catch (e: any) {
        console.error("[REPO] getRecipes error:", e);
        throw e;
    }
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Not authenticated");

    // 1. Delete all versions first
    const versionsCol = collection(db, 'recipes', recipeId, 'versions');
    const versionsSnap = await getDocs(versionsCol);
    for (const vDoc of versionsSnap.docs) {
        await deleteDoc(vDoc.ref);
    }

    // 2. Delete the recipe document
    const recipeRef = doc(db, 'recipes', recipeId);
    await deleteDoc(recipeRef);
};

export const getRecipeDetails = async (recipeId: string): Promise<Recipe | null> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    const recipeSnap = await getDoc(recipeRef);

    if (!recipeSnap.exists()) return null;

    const recipe = recipeSnap.data() as Recipe;

    // Safety check: ensure current user owns this recipe OR it is a public recipe
    if (recipe.userId !== auth.currentUser?.uid && !recipe.isPublic) {
        throw new Error("Permission denied");
    }

    // Fetch versions
    const versionsCol = collection(db, 'recipes', recipeId, 'versions');
    // Temporarily remove orderBy to avoid composite index requirement
    const vQuery = query(versionsCol);
    
    const vSnap = await getDocs(vQuery);

    // Sort in memory DESC by createdAt
    recipe.versions = vSnap.docs
        .map(vDoc => vDoc.data() as Version)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return recipe;
};

/**
 * Fetches a public recipe and its specified version.
 * Does not check for ownership, only if isPublic is true.
 */
export const getPublicRecipeDetails = async (recipeId: string, versionId?: string): Promise<Version | null> => {
    // 1. Fetch recipe first to check public status and current version
    const recipeRef = doc(db, 'recipes', recipeId);
    const rSnap = await getDoc(recipeRef);
    if (!rSnap.exists()) {
        throw new Error("レシピが見つかりません。削除された可能性があります。");
    }
    const recipeData = rSnap.data() as Recipe;

    // 2. Determine which version to fetch
    const effectiveVersionId = versionId || recipeData.currentVersionId;
    if (!effectiveVersionId) return null;

    const versionRef = doc(db, 'recipes', recipeId, 'versions', effectiveVersionId);
    const vSnap = await getDoc(versionRef);
    if (!vSnap.exists()) return null;

    const version = vSnap.data() as Version;

    // 3. Relaxed Public Check: Allow if either recipe or version is public
    // This handles cases where version is shared directly or recipe is marked public
    if (!recipeData.isPublic && !version.isPublic) {
        throw new Error("このレシピは非公開設定になっています。");
    }

    return version;
};

export const setRecipePublicStatus = async (recipeId: string, versionId: string, isPublic: boolean): Promise<void> => {
    try {
        const recipeRef = doc(db, 'recipes', recipeId);
        const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);

        await updateDoc(recipeRef, { isPublic });
        await updateDoc(versionRef, { isPublic });
    } catch (e: any) {
        console.error("[REPO] setRecipePublicStatus error:", e);
        throw e;
    }
};

export const toggleShowcaseStatus = async (recipeId: string, versionId: string, isShowcase: boolean): Promise<void> => {
    if (!isAdmin()) throw new Error("Permission denied");
    const recipeRef = doc(db, 'recipes', recipeId);
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);
    await updateDoc(recipeRef, { isPublic: isShowcase });
    if (versionId) {
        await updateDoc(versionRef, { isPublic: isShowcase });
    }
};

/**
 * Fetches all recipes that are marked as public.
 * Used for sitemap generation and public showcase.
 */
export const getAllPublicRecipes = async (): Promise<Recipe[]> => {
    const recipesCol = collection(db, 'recipes');
    const q = query(
        recipesCol,
        where("isPublic", "==", true)
    );
    const snapshot = await getDocs(q);
    // Sort and filter in memory to handle missing fields correctly
    return snapshot.docs
        .map(doc => doc.data() as Recipe)
        .filter(r => !r.originRecipeId || r.originRecipeId.startsWith('official_')) // Only show original creations or official seeds
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateRecipeName = async (recipeId: string, newName: string): Promise<void> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, { name: newName });
};

export const updateRecipeTags = async (recipeId: string, tags: string[]): Promise<void> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, { tags });
};

export const updateRecipeCategory = async (recipeId: string, category: string): Promise<void> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, { category });
};

export const updateBaseServings = async (recipeId: string, versionId: string, baseServings: number): Promise<void> => {
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);
    await updateDoc(versionRef, { baseServings });
};

// --- Section/Ingredient/Step Helpers ---
export const saveVersion = async (recipeId: string, versionId: string, versionData: Version): Promise<void> => {
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);
    await setDoc(versionRef, versionData);
};

const updateVersionData = async (recipeId: string, versionId: string, updateFn: (v: Version) => Version) => {
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);
    const vSnap = await getDoc(versionRef);
    if (!vSnap.exists()) return;

    const currentData = vSnap.data() as Version;
    const newData = updateFn(currentData);
    await setDoc(versionRef, newData);
};

export const addSection = async (recipeId: string, versionId: string, name: string, orderIndex: number): Promise<string> => {
    const sectionId = uuidv4();
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = v.sections || [];
        return { ...v, sections: [...sections, { id: sectionId, versionId, name, orderIndex, ingredients: [] }] };
    });
    return sectionId;
};

export const updateSection = async (recipeId: string, versionId: string, sectionId: string, name: string): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = (v.sections || []).map(s => s.id === sectionId ? { ...s, name } : s);
        return { ...v, sections };
    });
};

export const deleteSection = async (recipeId: string, versionId: string, sectionId: string): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = (v.sections || []).filter(s => s.id !== sectionId);
        const steps = (v.steps || []).map(st => ({
            ...st,
            stepSections: st.stepSections?.filter(ss => ss.sectionId !== sectionId)
        }));
        return { ...v, sections, steps };
    });
};

export const addIngredient = async (recipeId: string, versionId: string, sectionId: string, name: string, quantity: number, unit: string): Promise<string> => {
    const id = uuidv4();
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = (v.sections || []).map(s => {
            if (s.id === sectionId) {
                return { ...s, ingredients: [...(s.ingredients || []), { id, sectionId, name, quantity, unit }] };
            }
            return s;
        });
        return { ...v, sections };
    });
    return id;
};

export const updateIngredient = async (recipeId: string, versionId: string, ingredientId: string, name: string, quantity: number, unit: string): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = (v.sections || []).map(s => ({
            ...s,
            ingredients: (s.ingredients || []).map(i => i.id === ingredientId ? { ...i, name, quantity, unit } : i)
        }));
        return { ...v, sections };
    });
};

export const deleteIngredient = async (recipeId: string, versionId: string, ingredientId: string): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const sections = (v.sections || []).map(s => ({
            ...s,
            ingredients: (s.ingredients || []).filter(i => i.id !== ingredientId)
        }));
        return { ...v, sections };
    });
};

export const addStep = async (recipeId: string, versionId: string, description: string, orderIndex: number, sectionIds: string[] = []): Promise<string> => {
    const stepId = uuidv4();
    await updateVersionData(recipeId, versionId, (v) => {
        const steps = v.steps || [];
        const newStep: Step = {
            id: stepId,
            versionId,
            description,
            orderIndex,
            stepSections: sectionIds.map(sid => ({ id: uuidv4(), stepId, sectionId: sid }))
        };
        return { ...v, steps: [...steps, newStep] };
    });
    return stepId;
};

export const updateStep = async (recipeId: string, versionId: string, stepId: string, description: string, sectionIds: string[] = []): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const steps = (v.steps || []).map(st => {
            if (st.id === stepId) {
                return {
                    ...st,
                    description,
                    stepSections: sectionIds.map(sid => ({ id: uuidv4(), stepId, sectionId: sid }))
                };
            }
            return st;
        });
        return { ...v, steps };
    });
};

export const deleteStep = async (recipeId: string, versionId: string, stepId: string): Promise<void> => {
    await updateVersionData(recipeId, versionId, (v) => {
        const steps = (v.steps || []).filter(st => st.id !== stepId);
        return { ...v, steps };
    });
};

export const createNewVersionFromExisting = async (
    recipeId: string,
    sourceVersionId: string,
    notes?: string,
    type: 'minor' | 'major' = 'minor'
): Promise<string> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User must be logged in");

    // --- Subscription Check ---
    const profile = await getUserProfile();
    if (profile.plan === 'free' && !isAdmin()) {
        const countSnap = await getDocs(collection(db, 'recipes', recipeId, 'versions'));
        if (countSnap.size >= 10) {
            throw new Error("このレシピのバージョン管理上限（10個）に達しました。研究を続けるにはスタンダードプランを検討してください。");
        }
    }

    const recipeRef = doc(db, 'recipes', recipeId);
    const sourceVersionRef = doc(db, 'recipes', recipeId, 'versions', sourceVersionId);

    const sourceSnap = await getDoc(sourceVersionRef);
    if (!sourceSnap.exists()) throw new Error("Source version not found");
    const sourceData = sourceSnap.data() as Version;

    const versionsCol = collection(db, 'recipes', recipeId, 'versions');
    const vSnap = await getDocs(versionsCol);
    const existingVersions = vSnap.docs.map(d => d.data() as Version);

    const baseNumber = parseFloat(sourceData.versionNumber) || 1.0;
    let newVersionNumber: string;
    if (type === 'major') {
        newVersionNumber = (Math.floor(baseNumber) + 1).toFixed(1);
    } else {
        newVersionNumber = (baseNumber + 0.1).toFixed(1);
    }

    const existingNumbers = new Set(existingVersions.map(v => parseFloat(v.versionNumber).toFixed(1)));
    while (existingNumbers.has(newVersionNumber)) {
        newVersionNumber = (parseFloat(newVersionNumber) + (type === 'major' ? 1.0 : 0.1)).toFixed(1);
    }

    const newVersionId = uuidv4();
    const now = new Date().toISOString();

    const newVersion: Version = {
        ...sourceData,
        id: newVersionId,
        parentVersionId: sourceVersionId,
        versionNumber: newVersionNumber,
        notes: notes || '',
        createdAt: now,
        baseServings: sourceData.baseServings || 1
    };

    const newVersionRef = doc(db, 'recipes', recipeId, 'versions', newVersionId);
    await setDoc(newVersionRef, newVersion);

    await updateDoc(recipeRef, {
        currentVersionId: newVersionId,
        latestVersionNumber: newVersionNumber,
        latestVersionDate: now
    });

    return newVersionId;
};

/**
 * LIKES FUNCTIONALITY
 */
export const toggleLike = async (recipeId: string): Promise<boolean> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User must be logged in to like a recipe");

    const recipeRef = doc(db, 'recipes', recipeId);
    const likeRef = doc(db, 'recipes', recipeId, 'likes', userId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const likeSnap = await transaction.get(likeRef);
            const isLiked = likeSnap.exists();

            if (isLiked) {
                // Remove like
                transaction.delete(likeRef);
                transaction.update(recipeRef, {
                    likeCount: increment(-1)
                });
                return false;
            } else {
                // Add like
                transaction.set(likeRef, { userId, createdAt: new Date().toISOString() });
                transaction.update(recipeRef, {
                    likeCount: increment(1)
                });
                return true;
            }
        });
        return result;
    } catch (e: any) {
        console.error("[REPO] toggleLike error:", e);
        throw e;
    }
};

export const getLikeStatus = async (recipeId: string): Promise<boolean> => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;

    const likeRef = doc(db, 'recipes', recipeId, 'likes', userId);
    try {
        const snap = await getDoc(likeRef);
        return snap.exists();
    } catch (e: any) {
        console.error("[REPO] getLikeStatus error:", e);
        return false;
    }
};
