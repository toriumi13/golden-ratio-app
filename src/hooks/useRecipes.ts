import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { Recipe, PresetRecipe } from '../types';
import { 
    getRecipes, 
    createRecipe, 
    deleteRecipe, 
    addSection, 
    addIngredient, 
    addStep 
} from '../store/repository';
import { seedOfficialRecipes } from '../store/seed';

export const useRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isSeedingOfficial, setIsSeedingOfficial] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadRecipes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRecipes();
            setRecipes(data);
        } catch (e: any) {
            console.error("[useRecipes] loadRecipes error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAddRecipe = async () => {
        try {
            const newRecipeName = `新規レシピ ${recipes.length + 1}`;
            const newRecipe = await createRecipe(newRecipeName);
            await loadRecipes();
            return newRecipe;
        } catch (error: any) {
            throw error; // Let the screen handle paywall logic
        }
    };

    const handleDeleteRecipe = async (id: string, name: string) => {
        const message = `「${name}」を削除してもよろしいですか？この操作は取り消せません。`;

        const performDelete = async () => {
            try {
                await deleteRecipe(id);
                await loadRecipes();
            } catch (err: any) {
                Alert.alert('エラー', '削除に失敗しました');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                await performDelete();
            }
            return;
        }

        Alert.alert(
            'レシピの削除',
            message,
            [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: performDelete },
            ]
        );
    };

    const handleSeedOfficial = async () => {
        setIsSeedingOfficial(true);
        try {
            await seedOfficialRecipes();
            await loadRecipes();
            Alert.alert("成功", "公式レシピ（画像付き）の一括登録が完了しました！");
        } catch (error: any) {
            Alert.alert("エラー", "登録に失敗しました: " + error.message);
        } finally {
            setIsSeedingOfficial(false);
        }
    };

    const handleImportPreset = async (preset: PresetRecipe) => {
        setIsImporting(true);
        try {
            const recipe = await createRecipe(preset.name, `preset_${preset.id}`, preset.baseServings);
            const recipeId = recipe.id;
            const versionId = recipe.currentVersionId!;

            for (let i = 0; i < preset.sections.length; i++) {
                const s = preset.sections[i];
                const sectionId = await addSection(recipeId, versionId, s.name, i);
                for (const ing of s.ingredients) {
                    await addIngredient(recipeId, versionId, sectionId, ing.name, ing.quantity, ing.unit);
                }
            }

            for (let i = 0; i < preset.steps.length; i++) {
                await addStep(recipeId, versionId, preset.steps[i], i);
            }

            await loadRecipes();
            return recipeId;
        } catch (error: any) {
            Alert.alert("エラー", "インポートに失敗しました: " + error.message);
            throw error;
        } finally {
            setIsImporting(false);
        }
    };

    const filteredRecipes = recipes.filter(recipe => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            recipe.name.toLowerCase().includes(query) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });

    return {
        recipes,
        filteredRecipes,
        loading,
        isSeeding,
        setIsSeeding,
        isSeedingOfficial,
        isImporting,
        searchQuery,
        setSearchQuery,
        loadRecipes,
        handleAddRecipe,
        handleDeleteRecipe,
        handleSeedOfficial,
        handleImportPreset
    };
};
