import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Appbar, Text, Button, TextInput, Card, IconButton, useTheme, Divider, Portal, Dialog } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Recipe, Section } from '../types';
import { getRecipeDetails, updateRecipeName, addSection, addIngredient, addStep, deleteSection, deleteIngredient, deleteStep } from '../store/repository';

export default function EditRecipeScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { recipeId } = route.params;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [recipeName, setRecipeName] = useState('');
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [showSectionDialog, setShowSectionDialog] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    const [showIngredientDialog, setShowIngredientDialog] = useState(false);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientQuantity, setNewIngredientQuantity] = useState('');
    const [newIngredientUnit, setNewIngredientUnit] = useState('');

    const [showStepDialog, setShowStepDialog] = useState(false);
    const [newStepDescription, setNewStepDescription] = useState('');

    const loadData = async () => {
        const data = await getRecipeDetails(recipeId);
        setRecipe(data);
        setRecipeName(data?.name || '');
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [recipeId]);

    const handleSaveRecipeName = async () => {
        if (recipeName.trim() && recipe) {
            await updateRecipeName(recipe.id, recipeName.trim());
            Alert.alert('成功', 'レシピ名を更新しました');
        }
    };

    const handleAddSection = async () => {
        if (!newSectionName.trim() || !recipe) return;

        const currentVersion = recipe.versions[0];
        const nextIndex = currentVersion?.sections?.length || 0;

        await addSection(currentVersion.id, newSectionName.trim(), nextIndex);
        setNewSectionName('');
        setShowSectionDialog(false);
        loadData();
    };

    const handleAddIngredient = async () => {
        if (!currentSectionId || !newIngredientName.trim()) return;

        const quantity = parseFloat(newIngredientQuantity);
        if (isNaN(quantity)) {
            Alert.alert('エラー', '分量は数値で入力してください');
            return;
        }

        await addIngredient(currentSectionId, newIngredientName.trim(), quantity, newIngredientUnit.trim() || 'g');

        setNewIngredientName('');
        setNewIngredientQuantity('');
        setNewIngredientUnit('');
        setShowIngredientDialog(false);
        loadData();
    };

    const handleAddStep = async () => {
        if (!currentSectionId || !newStepDescription.trim()) return;

        const section = recipe?.versions[0]?.sections?.find(s => s.id === currentSectionId);
        const nextIndex = section?.steps?.length || 0;

        await addStep(currentSectionId, newStepDescription.trim(), nextIndex);

        setNewStepDescription('');
        setShowStepDialog(false);
        loadData();
    };

    const handleDeleteSection = async (sectionId: string, sectionName: string) => {
        Alert.alert(
            '確認',
            `「${sectionName}」を削除しますか？材料と工程も削除されます。`,
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteSection(sectionId);
                        loadData();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>Recipe not found</Text>
            </View>
        );
    }

    const currentVersion = recipe.versions[0];

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="レシピ編集" />
                <Appbar.Action icon="check" onPress={handleSaveRecipeName} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Recipe Name */}
                <Card style={styles.card}>
                    <Card.Title title="レシピ名" />
                    <Card.Content>
                        <RNTextInput
                            value={recipeName}
                            onChangeText={setRecipeName}
                            placeholder="例: 我が家のハンバーグ"
                            style={styles.nativeInput}
                            returnKeyType="done"
                        />
                    </Card.Content>
                </Card>

                {/* Sections */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">セクション・材料・工程</Text>
                    <Button mode="contained-tonal" onPress={() => setShowSectionDialog(true)} icon="plus">
                        セクション追加
                    </Button>
                </View>

                {currentVersion?.sections?.map((section) => (
                    <Card key={section.id} style={styles.card}>
                        <Card.Title
                            title={section.name}
                            titleStyle={{ color: theme.colors.primary }}
                            right={(props) => (
                                <IconButton
                                    {...props}
                                    icon="delete"
                                    onPress={() => handleDeleteSection(section.id, section.name)}
                                />
                            )}
                        />
                        <Card.Content>
                            {/* Ingredients */}
                            <View style={styles.subSection}>
                                <Text variant="labelLarge">材料</Text>
                                {section.ingredients?.map((ing) => (
                                    <View key={ing.id} style={styles.row}>
                                        <Text style={{ flex: 1 }}>・{ing.name}</Text>
                                        <Text style={{ fontWeight: 'bold', marginRight: 8 }}>{ing.quantity} {ing.unit}</Text>
                                        <IconButton
                                            icon="close"
                                            size={16}
                                            onPress={async () => {
                                                await deleteIngredient(ing.id);
                                                loadData();
                                            }}
                                        />
                                    </View>
                                ))}
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setCurrentSectionId(section.id);
                                        setShowIngredientDialog(true);
                                    }}
                                    icon="plus"
                                    style={{ marginTop: 8 }}
                                >
                                    材料を追加
                                </Button>
                            </View>

                            <Divider style={{ marginVertical: 12 }} />

                            {/* Steps */}
                            <View style={styles.subSection}>
                                <Text variant="labelLarge">工程</Text>
                                {section.steps?.map((step, idx) => (
                                    <View key={step.id} style={styles.row}>
                                        <Text style={{ width: 24 }}>{idx + 1}.</Text>
                                        <Text style={{ flex: 1 }}>{step.description}</Text>
                                        <IconButton
                                            icon="close"
                                            size={16}
                                            onPress={async () => {
                                                await deleteStep(step.id);
                                                loadData();
                                            }}
                                        />
                                    </View>
                                ))}
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setCurrentSectionId(section.id);
                                        setShowStepDialog(true);
                                    }}
                                    icon="plus"
                                    style={{ marginTop: 8 }}
                                >
                                    工程を追加
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                ))}

                {(!currentVersion?.sections || currentVersion.sections.length === 0) && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                        セクションを追加してレシピを作成しましょう
                    </Text>
                )}
            </ScrollView>

            {/* Add Section Dialog */}
            <Portal>
                <Dialog visible={showSectionDialog} onDismiss={() => setShowSectionDialog(false)}>
                    <Dialog.Title>セクションを追加</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="labelMedium" style={{ marginBottom: 4 }}>セクション名</Text>
                        <RNTextInput
                            defaultValue=""
                            onEndEditing={(e) => sectionNameRef.current = e.nativeEvent.text}
                            placeholder="例: タネ、ソース"
                            style={styles.nativeInput}
                            returnKeyType="done"
                            blurOnSubmit={true}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowSectionDialog(false)}>キャンセル</Button>
                        <Button onPress={handleAddSection}>追加</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Add Ingredient Dialog */}
                <Dialog visible={showIngredientDialog} onDismiss={() => setShowIngredientDialog(false)}>
                    <Dialog.Title>材料を追加</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="labelMedium" style={{ marginBottom: 4 }}>材料名</Text>
                        <RNTextInput
                            defaultValue=""
                            onEndEditing={(e) => ingredientNameRef.current = e.nativeEvent.text}
                            placeholder="例: 豚ひき肉"
                            style={[styles.nativeInput, { marginBottom: 12 }]}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text variant="labelMedium" style={{ marginBottom: 4 }}>分量</Text>
                                <RNTextInput
                                    defaultValue=""
                                    onEndEditing={(e) => ingredientQuantityRef.current = e.nativeEvent.text}
                                    placeholder="300"
                                    keyboardType="numeric"
                                    style={styles.nativeInput}
                                    returnKeyType="next"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text variant="labelMedium" style={{ marginBottom: 4 }}>単位</Text>
                                <RNTextInput
                                    defaultValue=""
                                    onEndEditing={(e) => ingredientUnitRef.current = e.nativeEvent.text}
                                    placeholder="g"
                                    style={styles.nativeInput}
                                    returnKeyType="done"
                                />
                            </View>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowIngredientDialog(false)}>キャンセル</Button>
                        <Button onPress={handleAddIngredient}>追加</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Add Step Dialog */}
                <Dialog visible={showStepDialog} onDismiss={() => setShowStepDialog(false)}>
                    <Dialog.Title>工程を追加</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="labelMedium" style={{ marginBottom: 4 }}>工程の説明</Text>
                        <RNTextInput
                            defaultValue=""
                            onEndEditing={(e) => stepDescriptionRef.current = e.nativeEvent.text}
                            placeholder="例: 粘り気が出るまでこねる"
                            multiline
                            numberOfLines={3}
                            style={[styles.nativeInput, { height: 80, textAlignVertical: 'top' }]}
                            returnKeyType="done"
                            blurOnSubmit={true}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowStepDialog(false)}>キャンセル</Button>
                        <Button onPress={handleAddStep}>追加</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        margin: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    subSection: {
        marginVertical: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    nativeInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
});
