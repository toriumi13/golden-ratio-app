import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput as RNTextInput, Platform } from 'react-native';
import { Appbar, Text, Button, Card, IconButton, useTheme, Divider, Portal, Dialog, Checkbox, Surface, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Recipe, Section, Step, Ingredient } from '../types';
import {
    getRecipeDetails, updateRecipeName,
    addSection, updateSection, deleteSection,
    addIngredient, updateIngredient, deleteIngredient,
    addStep, updateStep, deleteStep, updateRecipeTags, updateRecipeCategory, updateBaseServings
} from '../store/repository';
import { getVirtualWeight, getRatioWidth } from '../utils/ratio';
import { CATEGORIES } from '../constants/categories';

export default function EditRecipeScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { recipeId, versionId } = route.params;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [recipeName, setRecipeName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [baseServings, setBaseServings] = useState('1');
    const [loading, setLoading] = useState(true);

    // Dialog & Editing States
    const [showSectionDialog, setShowSectionDialog] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [sectionName, setSectionName] = useState('');

    const [showIngredientDialog, setShowIngredientDialog] = useState(false);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
    const [ingredientName, setIngredientName] = useState('');
    const [ingredientQuantity, setIngredientQuantity] = useState('');
    const [ingredientUnit, setIngredientUnit] = useState('');

    const [showStepDialog, setShowStepDialog] = useState(false);
    const [editingStepId, setEditingStepId] = useState<string | null>(null);
    const [stepDescription, setStepDescription] = useState('');
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

    // Magic Import States
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Counter to force TextInput remount (fixes Japanese IME issues)
    const [dialogKey, setDialogKey] = useState(0);

    const loadData = async () => {
        const data = await getRecipeDetails(recipeId);
        setRecipe(data);
        setRecipeName(data?.name || '');

        // Get baseServings from current version
        const vId = versionId || data?.currentVersionId;
        const currentV = data?.versions?.find((v: any) => v.id === vId) || data?.versions?.[0];
        setBaseServings(currentV?.baseServings?.toString() || '1');

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [recipeId]);

    const currentVersion = recipe?.versions?.find((v: any) => v.id === versionId) || recipe?.versions?.[0];

    const handleSaveRecipeName = async () => {
        if (recipeName.trim() && recipe) {
            await updateRecipeName(recipe.id, recipeName.trim());
            Alert.alert('成功', 'レシピ名を更新しました');
        }
    };

    const handleAddTag = async () => {
        if (!tagInput.trim() || !recipe) return;
        const currentTags = recipe.tags || [];
        if (currentTags.length >= 3) {
            Alert.alert('制限', 'タグは最大3つまで登録できます。');
            return;
        }
        if (currentTags.includes(tagInput.trim())) {
            setTagInput('');
            return;
        }
        const newTags = [...currentTags, tagInput.trim()];
        await updateRecipeTags(recipe.id, newTags);
        setTagInput('');
        loadData();
    };

    const handleSelectCategory = async (categoryId: string) => {
        if (!recipe) return;
        await updateRecipeCategory(recipe.id, categoryId);
        loadData();
    };

    const handleDeleteTag = async (tagToDelete: string) => {
        if (!recipe) return;
        const newTags = (recipe.tags || []).filter(t => t !== tagToDelete);
        await updateRecipeTags(recipe.id, newTags);
        loadData();
    };

    const handleSaveBaseServings = async () => {
        if (!recipe || !currentVersion) return;
        const val = parseInt(baseServings);
        if (isNaN(val) || val < 1) {
            Alert.alert('エラー', '基本人数は1以上の数値で入力してください');
            return;
        }
        await updateBaseServings(recipe.id, currentVersion.id, val);
        Alert.alert('成功', '基本人数を更新しました');
        loadData();
    };

    // --- Section Handlers ---
    const openSectionDialog = (section?: Section) => {
        if (section) {
            setEditingSectionId(section.id);
            setSectionName(section.name);
        } else {
            setEditingSectionId(null);
            setSectionName('');
        }
        setDialogKey(k => k + 1);
        setShowSectionDialog(true);
    };

    const handleSaveSection = async () => {
        if (!sectionName.trim() || !currentVersion) return;
        if (editingSectionId) {
            await updateSection(recipeId, currentVersion.id, editingSectionId, sectionName.trim());
        } else {
            const nextIndex = currentVersion.sections?.length || 0;
            await addSection(recipeId, currentVersion.id, sectionName.trim(), nextIndex);
        }
        setShowSectionDialog(false);
        loadData();
    };

    // --- Ingredient Handlers ---
    const openIngredientDialog = (sectionId: string, ingredient?: Ingredient) => {
        setCurrentSectionId(sectionId);
        if (ingredient) {
            setEditingIngredientId(ingredient.id);
            setIngredientName(ingredient.name);
            setIngredientQuantity(ingredient.quantity.toString());
            setIngredientUnit(ingredient.unit);
        } else {
            setEditingIngredientId(null);
            setIngredientName('');
            setIngredientQuantity('');
            setIngredientUnit('g');
        }
        setDialogKey(k => k + 1);
        setShowIngredientDialog(true);
    };

    const handleSaveIngredient = async () => {
        if (!currentSectionId || !ingredientName.trim()) return;
        const quantityStr = ingredientQuantity.trim() === '' ? '0' : ingredientQuantity;
        const quantity = parseFloat(quantityStr);
        if (isNaN(quantity)) {
            Alert.alert('エラー', '分量は数値で入力してください');
            return;
        }
        if (editingIngredientId && currentVersion) {
            await updateIngredient(recipeId, currentVersion.id, editingIngredientId, ingredientName.trim(), quantity, ingredientUnit.trim() || 'g');
        } else if (currentVersion) {
            await addIngredient(recipeId, currentVersion.id, currentSectionId, ingredientName.trim(), quantity, ingredientUnit.trim() || 'g');
        }
        setShowIngredientDialog(false);
        loadData();
    };

    const handleInlineUpdateIngredient = async (ing: Ingredient, field: 'name' | 'quantity' | 'unit', value: string) => {
        if (!currentVersion) return;

        let newName = ing.name;
        let newQty = ing.quantity;
        let newUnit = ing.unit;

        if (field === 'name') newName = value;
        if (field === 'unit') newUnit = value;
        if (field === 'quantity') {
            const qtyStr = value.trim() === '' ? '0' : value;
            const parsed = parseFloat(qtyStr);
            if (isNaN(parsed)) return;
            newQty = parsed;
        }

        if (newName === ing.name && newQty === ing.quantity && newUnit === ing.unit) return;

        await updateIngredient(recipeId, currentVersion.id, ing.id, newName.trim(), newQty, newUnit.trim());
        // For inline editing, we might not want to reload the whole data immediately to avoid scroll jump/focus loss,
        // but here we do it to update the ratio bars.
        loadData();
    };

    // --- Step Handlers ---
    const openStepDialog = (step?: Step) => {
        if (step) {
            setEditingStepId(step.id);
            setStepDescription(step.description);
            setSelectedSectionIds(step.stepSections?.map(ss => ss.sectionId) || []);
        } else {
            setEditingStepId(null);
            setStepDescription('');
            setSelectedSectionIds([]);
        }
        setDialogKey(k => k + 1);
        setShowStepDialog(true);
    };

    const handleSaveStep = async () => {
        if (!stepDescription.trim() || !currentVersion) return;
        if (editingStepId) {
            await updateStep(recipeId, currentVersion.id, editingStepId, stepDescription.trim(), selectedSectionIds);
        } else {
            const nextIndex = currentVersion.steps?.length || 0;
            await addStep(recipeId, currentVersion.id, stepDescription.trim(), nextIndex, selectedSectionIds);
        }
        setShowStepDialog(false);
        loadData();
    };

    // --- Delete Handlers ---
    const handleDeleteSection = async (sectionId: string, name: string) => {
        const message = `「${name}」を削除しますか？材料も削除されます。`;
        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                if (currentVersion) await deleteSection(recipeId, currentVersion.id, sectionId);
                loadData();
            }
            return;
        }
        Alert.alert('確認', message, [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: async () => { if (currentVersion) await deleteSection(recipeId, currentVersion.id, sectionId); loadData(); } }
        ]);
    };

    const handleDeleteIngredient = async (ingredientId: string, name: string) => {
        const message = `「${name}」を削除しますか？`;
        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                if (currentVersion) await deleteIngredient(recipeId, currentVersion.id, ingredientId);
                loadData();
            }
            return;
        }
        Alert.alert('確認', message, [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: async () => { if (currentVersion) await deleteIngredient(recipeId, currentVersion.id, ingredientId); loadData(); } }
        ]);
    };

    const handleDeleteStep = async (stepId: string, desc: string) => {
        const message = `この工程を削除しますか？`;
        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                if (currentVersion) await deleteStep(recipeId, currentVersion.id, stepId);
                loadData();
            }
            return;
        }
        Alert.alert('確認', message, [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: async () => { if (currentVersion) await deleteStep(recipeId, currentVersion.id, stepId); loadData(); } }
        ]);
    };

    const toggleSectionSelection = (sectionId: string) => {
        setSelectedSectionIds(prev => prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]);
    };


    return (
        <View style={styles.container}>
            <Appbar.Header elevated style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content
                    title={`編集 Ver ${currentVersion?.versionNumber}`}
                    subtitle={recipe?.name}
                    titleStyle={styles.appbarTitle}
                    subtitleStyle={styles.appbarSubtitle}
                />
                <Appbar.Action icon="check" onPress={() => navigation.goBack()} color={theme.colors.primary} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card} elevation={1}>
                    <Card.Content>
                        <View style={styles.cardInfoRow}>
                            <IconButton icon="rename-box" size={20} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                            <Text style={styles.cardLabel}>レシピ名</Text>
                        </View>
                        <View style={styles.inputActionRow}>
                            <RNTextInput
                                key={`recipe-name-${recipe?.id}`}
                                defaultValue={recipeName}
                                onChangeText={(text) => setRecipeName(text)}
                                placeholder="例: 我が家のハンバーグ"
                                style={[styles.nativeInput, { flex: 1 }]}
                                returnKeyType="done"
                            />
                            <Button mode="contained" onPress={handleSaveRecipeName} style={styles.inlineActionBtn} compact>更新</Button>
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        <View style={styles.cardInfoRow}>
                            <IconButton icon="tag-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                            <Text style={styles.cardLabel}>タグ (最大3つ)</Text>
                        </View>
                        <View style={styles.tagInputRow}>
                            <RNTextInput
                                value={tagInput}
                                onChangeText={setTagInput}
                                placeholder="例: 夕食"
                                style={[styles.nativeInput, { flex: 1 }]}
                                onSubmitEditing={handleAddTag}
                            />
                            <Button
                                mode="outlined"
                                onPress={handleAddTag}
                                style={[styles.inlineActionBtn, { borderColor: theme.colors.primary }]}
                                compact
                                disabled={(recipe?.tags?.length || 0) >= 3}
                            >
                                追加
                            </Button>
                        </View>
                        <View style={styles.editTagRow}>
                            {recipe?.tags?.map(tag => (
                                <Chip
                                    key={tag}
                                    onClose={() => handleDeleteTag(tag)}
                                    style={styles.editTagChip}
                                    textStyle={{ fontSize: 12 }}
                                >
                                    #{tag}
                                </Chip>
                            ))}
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        <View style={styles.cardInfoRow}>
                            <IconButton icon="account-group-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                            <Text style={styles.cardLabel}>基本の人数（レシピの基準）</Text>
                        </View>
                        <View style={styles.inputActionRow}>
                            <RNTextInput
                                value={baseServings}
                                onChangeText={setBaseServings}
                                keyboardType="numeric"
                                placeholder="1"
                                style={[styles.nativeInput, { flex: 1 }]}
                            />
                            <Button mode="contained" onPress={handleSaveBaseServings} style={styles.inlineActionBtn} compact>更新</Button>
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        <View style={styles.cardInfoRow}>
                            <IconButton icon="folder-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                            <Text style={styles.cardLabel}>カテゴリー (フォルダ分け)</Text>
                        </View>
                        <View style={styles.categoryChipRow}>
                            {CATEGORIES.map(cat => {
                                const isSelected = recipe?.category === cat.id;
                                return (
                                    <Chip
                                        key={cat.id}
                                        selected={isSelected}
                                        onPress={() => handleSelectCategory(cat.id)}
                                        style={[
                                            styles.categoryChip,
                                            isSelected && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }
                                        ]}
                                        textStyle={[isSelected && { color: theme.colors.primary, fontWeight: 'bold' }]}
                                        icon={isSelected ? 'check' : cat.icon}
                                        mode="outlined"
                                        compact
                                    >
                                        {cat.name}
                                    </Chip>
                                );
                            })}
                        </View>
                    </Card.Content>
                </Card>

                <Text style={styles.mainSectionTitle}>材料・グループ</Text>
                {currentVersion?.sections?.map((section) => {
                    const maxWeight = Math.max(...(section.ingredients?.map(i => getVirtualWeight(i.quantity, i.unit)) || [1]));
                    return (
                        <Card key={section.id} style={styles.sectionCard} elevation={1}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionTitleBlock}>
                                    <Text style={styles.sectionBadge}>GROUP</Text>
                                    <Text variant="titleMedium" style={styles.sectionNameText}>{section.name}</Text>
                                    <IconButton icon="pencil" size={16} iconColor="#999" onPress={() => openSectionDialog(section)} />
                                </View>
                                <View style={styles.actionRow}>
                                    <IconButton icon="plus" size={24} iconColor={theme.colors.primary} onPress={() => openIngredientDialog(section.id)} />
                                    <IconButton icon="delete-outline" size={24} iconColor="#FFAB91" onPress={() => handleDeleteSection(section.id, section.name)} />
                                </View>
                            </View>
                            <Divider style={styles.divider} />
                            <View style={styles.ingredientsList}>
                                {section.ingredients?.map((ing) => (
                                    <View key={ing.id} style={styles.ingItemContainer}>
                                        <View style={styles.ingMainRow}>
                                            <View style={styles.ingInfo}>
                                                <RNTextInput
                                                    defaultValue={ing.name}
                                                    style={styles.inlineIngNameInput}
                                                    onEndEditing={(e) => handleInlineUpdateIngredient(ing, 'name', e.nativeEvent.text)}
                                                />
                                                <RNTextInput
                                                    defaultValue={ing.quantity.toString()}
                                                    style={styles.inlineIngQtyInput}
                                                    keyboardType="decimal-pad"
                                                    onEndEditing={(e) => handleInlineUpdateIngredient(ing, 'quantity', e.nativeEvent.text)}
                                                />
                                                <RNTextInput
                                                    defaultValue={ing.unit}
                                                    style={styles.inlineIngUnitInput}
                                                    onEndEditing={(e) => handleInlineUpdateIngredient(ing, 'unit', e.nativeEvent.text)}
                                                />
                                            </View>
                                            <View style={styles.ingActions}>
                                                <IconButton icon="pencil" size={18} iconColor="#999" onPress={() => openIngredientDialog(section.id, ing)} />
                                                <IconButton icon="close" size={18} iconColor="#FF5252" onPress={() => handleDeleteIngredient(ing.id, ing.name)} />
                                            </View>
                                        </View>
                                        <View style={styles.ratioBarBg}>
                                            <View style={[styles.ratioBarFill, { width: getRatioWidth(ing.quantity, ing.unit, maxWeight) as any }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    );
                })}
                <Button mode="outlined" icon="plus" onPress={() => openSectionDialog()} style={styles.addSectionBtn} textColor={theme.colors.primary}>セクションを追加</Button>

                <Text style={styles.mainSectionTitle}>調理工程</Text>
                <Card style={[styles.card, { paddingBottom: 8 }]} elevation={1}>
                    {currentVersion?.steps?.map((step, index) => (
                        <View key={step.id}>
                            <View style={styles.stepEditItem}>
                                <View style={styles.stepIndexCircle}><Text style={styles.stepIndexText}>{index + 1}</Text></View>
                                <View style={styles.stepBody}>
                                    <Text style={styles.stepDescText}>{step.description}</Text>
                                    {step.stepSections && step.stepSections.length > 0 && (
                                        <View style={styles.stepTagContainer}>
                                            {step.stepSections.map(ss => (
                                                <Surface key={ss.id} style={styles.stepTag} elevation={0}>
                                                    <Text style={styles.stepTagText}>{currentVersion?.sections?.find(s => s.id === ss.sectionId)?.name}</Text>
                                                </Surface>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <View style={styles.stepActions}>
                                    <IconButton icon="pencil" size={20} iconColor="#999" onPress={() => openStepDialog(step)} />
                                    <IconButton icon="delete-outline" size={20} iconColor="#FFAB91" onPress={() => handleDeleteStep(step.id, step.description)} />
                                </View>
                            </View>
                            {index < (currentVersion.steps?.length || 0) - 1 && <Divider style={styles.stepDivider} />}
                        </View>
                    ))}
                    <Button mode="text" icon="plus" onPress={() => openStepDialog()} style={{ marginTop: 8 }}>工程を追加</Button>
                </Card>
            </ScrollView>

            {/* Dialogs */}
            <Portal>
                <Dialog visible={showSectionDialog} onDismiss={() => setShowSectionDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>{editingSectionId ? 'グループ名を編集' : '新しいグループ'}</Dialog.Title>
                    <Dialog.Content>
                        <RNTextInput
                            key={`section-${dialogKey}`}
                            defaultValue={sectionName}
                            onChangeText={(text) => setSectionName(text)}
                            placeholder="例: タネ、ソース"
                            style={styles.dialogInput}
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowSectionDialog(false)} textColor="#888">キャンセル</Button>
                        <Button onPress={handleSaveSection} mode="contained">保存</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={showIngredientDialog} onDismiss={() => setShowIngredientDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>{editingIngredientId ? '材料を編集' : '材料を追加'}</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.inputLabel}>名前</Text>
                        <RNTextInput
                            key={`ing-name-${dialogKey}`}
                            defaultValue={ingredientName}
                            onChangeText={(text) => setIngredientName(text)}
                            style={styles.dialogInput}
                            autoFocus
                        />
                        <View style={styles.dialogInputRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>分量</Text>
                                <RNTextInput
                                    key={`ing-qty-${dialogKey}`}
                                    defaultValue={ingredientQuantity}
                                    onChangeText={(text) => setIngredientQuantity(text)}
                                    keyboardType="decimal-pad"
                                    style={styles.dialogInput}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>単位</Text>
                                <RNTextInput
                                    key={`ing-unit-${dialogKey}`}
                                    defaultValue={ingredientUnit}
                                    onChangeText={(text) => setIngredientUnit(text)}
                                    style={styles.dialogInput}
                                />
                            </View>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowIngredientDialog(false)} textColor="#888">キャンセル</Button>
                        <Button onPress={handleSaveIngredient} mode="contained">保存</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={showStepDialog} onDismiss={() => setShowStepDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>{editingStepId ? '工程を編集' : '工程を追加'}</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.inputLabel}>手順の説明</Text>
                        <RNTextInput
                            key={`step-${dialogKey}`}
                            defaultValue={stepDescription}
                            onChangeText={(text) => setStepDescription(text)}
                            multiline
                            style={[styles.dialogInput, { minHeight: 80 }]}
                            autoFocus
                        />
                        <Text style={[styles.inputLabel, { marginTop: 12 }]}>使うグループ</Text>
                        {currentVersion?.sections?.map(section => (
                            <View key={section.id} style={styles.checkboxRow}>
                                <Checkbox
                                    status={selectedSectionIds.includes(section.id) ? 'checked' : 'unchecked'}
                                    onPress={() => toggleSectionSelection(section.id)}
                                />
                                <Text onPress={() => toggleSectionSelection(section.id)}>{section.name}</Text>
                            </View>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowStepDialog(false)} textColor="#888">キャンセル</Button>
                        <Button onPress={handleSaveStep} mode="contained">保存</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    appbar: { backgroundColor: '#FFF' },
    appbarTitle: { fontWeight: 'bold', color: '#4E342E' },
    appbarSubtitle: { color: '#999' },
    scrollContent: { padding: 16, paddingBottom: 60 },
    card: { marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
    sectionCard: { marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
    cardInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardLabel: { fontSize: 13, fontWeight: 'bold', color: '#8C7853', marginLeft: 4 },
    inputActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nativeInput: { backgroundColor: '#F8F8F8', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
    inlineActionBtn: { borderRadius: 8 },
    mainSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#8C7853', marginTop: 24, marginBottom: 12, marginLeft: 4 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    sectionTitleBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    sectionBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#EFEBE9', color: '#8C7853', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    sectionNameText: { fontWeight: 'bold', color: '#4E342E' },
    actionRow: { flexDirection: 'row' },
    divider: { backgroundColor: '#F5F5F5' },
    ingredientsList: { padding: 16 },
    ingItemContainer: { marginBottom: 12 },
    ingMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    ingInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flex: 1 },
    ingNameText: { fontSize: 15, color: '#333' },
    ingQtyText: { fontSize: 14, fontWeight: 'bold', color: '#B8860B' },
    ingActions: { flexDirection: 'row' },
    ratioBarBg: { height: 3, backgroundColor: '#F0F0F0', borderRadius: 1.5, overflow: 'hidden' },
    ratioBarFill: { height: '100%', backgroundColor: '#B8860B', borderRadius: 1.5 },
    addSectionBtn: { marginBottom: 24, borderColor: '#B8860B', borderStyle: 'dashed', borderRadius: 12 },
    stepEditItem: { flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
    stepIndexCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    stepIndexText: { fontSize: 12, fontWeight: 'bold', color: '#888' },
    stepBody: { flex: 1 },
    stepDescText: { fontSize: 14, lineHeight: 20, color: '#444' },
    stepTagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
    stepTag: { backgroundColor: '#FBFBFB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#F0F0F0' },
    stepTagText: { fontSize: 10, color: '#888' },
    stepActions: { flexDirection: 'row', marginLeft: 8 },
    stepDivider: { marginHorizontal: 16, backgroundColor: '#F9F9F9' },
    dialog: { borderRadius: 20, backgroundColor: '#FFF' },
    dialogTitle: { fontWeight: 'bold', color: '#4E342E', fontSize: 18 },
    dialogInput: { backgroundColor: '#F8F8F8', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
    dialogInputRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#8C7853', marginBottom: 6, marginLeft: 4 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    tabRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 4 },
    tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    editTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    editTagChip: { backgroundColor: '#F9F7F2', borderColor: '#F2EFE9', borderWidth: 1 },
    categoryChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    categoryChip: { marginVertical: 2 },
    inlineIngNameInput: { flex: 2, fontSize: 15, color: '#333', padding: 4, borderRadius: 4, backgroundColor: '#FAFAFA' },
    inlineIngQtyInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#B8860B', padding: 4, borderRadius: 4, backgroundColor: '#FAFAFA', textAlign: 'right' },
    inlineIngUnitInput: { flex: 0.8, fontSize: 13, color: '#666', padding: 4, borderRadius: 4, backgroundColor: '#FAFAFA' },
});
