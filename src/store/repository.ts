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
    where
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './firebase';
import { Recipe, Version, Section, Step, Ingredient } from '../types';
import { checkSubscriptionStatus } from './subscription';
import { Platform } from 'react-native';

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


export const createRecipe = async (name: string): Promise<Recipe> => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User must be logged in to create a recipe");

    // --- Subscription Check ---
    const profile = await getUserProfile();
    if (profile.plan === 'free') {
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
        createdAt: now,
        currentVersionId: versionId,
        latestVersionNumber: '1.0',
        latestVersionDate: now
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
        baseServings: 2, // Default to 2 for new recipes
        sections: [],
        steps: []
    });

    return recipeData;
};

export const getRecipes = async (): Promise<Recipe[]> => {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const recipesCol = collection(db, 'recipes');
    const q = query(
        recipesCol,
        where("userId", "==", userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as Recipe);
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

    // Safety check: ensure current user owns this recipe
    if (recipe.userId !== auth.currentUser?.uid) {
        throw new Error("Permission denied");
    }

    // Fetch versions
    const versionsCol = collection(db, 'recipes', recipeId, 'versions');
    const vQuery = query(versionsCol, orderBy('createdAt', 'desc'));
    const vSnap = await getDocs(vQuery);

    recipe.versions = vSnap.docs.map(vDoc => vDoc.data() as Version);

    return recipe;
};

/**
 * Fetches a public recipe and its specified version.
 * Does not check for ownership, only if isPublic is true.
 */
export const getPublicRecipeDetails = async (recipeId: string, versionId: string): Promise<Version | null> => {
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);
    const vSnap = await getDoc(versionRef);

    if (!vSnap.exists()) return null;

    const version = vSnap.data() as Version;

    // Check if the recipe itself is public
    const recipeRef = doc(db, 'recipes', recipeId);
    const rSnap = await getDoc(recipeRef);
    const recipeData = rSnap.data() as Recipe;

    if (!recipeData?.isPublic && !version.isPublic) {
        throw new Error("このレシピは非公開設定になっています。");
    }

    return version;
};

export const setRecipePublicStatus = async (recipeId: string, versionId: string, isPublic: boolean): Promise<void> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    const versionRef = doc(db, 'recipes', recipeId, 'versions', versionId);

    await updateDoc(recipeRef, { isPublic });
    await updateDoc(versionRef, { isPublic });
};

export const updateRecipeName = async (recipeId: string, newName: string): Promise<void> => {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, { name: newName });
};

// --- Section/Ingredient/Step Helpers ---
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
    if (profile.plan === 'free') {
        const versionsCol = collection(db, 'recipes', recipeId, 'versions');
        const countSnap = await getDocs(versionsCol);
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
        baseServings: sourceData.baseServings || 2
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
