import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Appbar, Text, Surface, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createRecipe, addSection, addIngredient, addStep } from '../store/repository';
import { presentPaywall } from '../store/subscription';
import type { GeneratedDish } from '../../api/generate-kondate';

const CATEGORY_LABELS: Record<string, string> = {
    japanese: '和食', western: '洋食', chinese: '中華',
    italian: 'イタリアン', sweets: 'スイーツ', drinks: '飲み物', others: 'その他',
};

export default function KondatePreviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dishes: GeneratedDish[] = route.params?.dishes ?? [];
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const savedNames: string[] = [];
        try {
            for (const dish of dishes) {
                const recipe = await createRecipe(dish.name);
                const recipeId = recipe.id;
                const versionId = recipe.currentVersionId!;

                for (let i = 0; i < dish.sections.length; i++) {
                    const sec = dish.sections[i];
                    const sectionId = await addSection(recipeId, versionId, sec.name, i);
                    for (const ing of sec.ingredients) {
                        await addIngredient(recipeId, versionId, sectionId, ing.name, ing.quantity, ing.unit);
                    }
                }
                for (let i = 0; i < dish.steps.length; i++) {
                    await addStep(recipeId, versionId, dish.steps[i], i);
                }
                savedNames.push(dish.name);
            }
            Alert.alert('保存完了', `${savedNames.length}品を追加しました。`, [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (e: any) {
            if (e.message.includes('上限')) {
                const success = await presentPaywall();
                if (!success) Alert.alert('保存上限', e.message);
            } else {
                Alert.alert('エラー', e.message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header elevated style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="今日の献立" titleStyle={styles.appTitle} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.intro}>
                    {dishes.length}品の献立が完成しました。気に入ったら保存しましょう。
                </Text>

                {dishes.map((dish, index) => (
                    <Surface key={index} style={styles.dishCard} elevation={1}>
                        <View style={styles.dishHeader}>
                            <View style={styles.dishNumberBadge}>
                                <Text style={styles.dishNumber}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.dishName}>{dish.name}</Text>
                                <Text style={styles.dishCategory}>
                                    {CATEGORY_LABELS[dish.category] ?? dish.category}・{dish.baseServings}人前
                                </Text>
                            </View>
                        </View>

                        {dish.description ? (
                            <Text style={styles.dishDescription}>{dish.description}</Text>
                        ) : null}

                        <Divider style={styles.divider} />

                        {dish.sections.map((sec, si) => (
                            <View key={si} style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="format-list-bulleted" size={14} color="#8C7853" />
                                    <Text style={styles.sectionName}>{sec.name}</Text>
                                </View>
                                {sec.ingredients.map((ing, ii) => (
                                    <View key={ii} style={styles.ingredientRow}>
                                        <Text style={styles.ingredientName}>{ing.name}</Text>
                                        <Text style={styles.ingredientQty}>{ing.quantity}{ing.unit}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {dish.steps.length > 0 && (
                            <>
                                <Divider style={styles.divider} />
                                <Text style={styles.stepsLabel}>作り方</Text>
                                {dish.steps.map((step, si) => (
                                    <View key={si} style={styles.stepRow}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{si + 1}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </Surface>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveButton}
                    contentStyle={{ height: 52 }}
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    buttonColor="#2D6A4F"
                    icon="content-save-all"
                >
                    {dishes.length}品をまとめて保存
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F7F2' },
    appbar: { backgroundColor: '#fff' },
    appTitle: { fontWeight: 'bold', color: '#4E342E', fontSize: 18 },
    scroll: { padding: 16, gap: 12 },
    intro: { fontSize: 14, color: '#8C7853', marginBottom: 4 },
    dishCard: { borderRadius: 16, padding: 16, backgroundColor: '#fff' },
    dishHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    dishNumberBadge: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D6A4F',
        justifyContent: 'center', alignItems: 'center',
    },
    dishNumber: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    dishName: { fontSize: 17, fontWeight: 'bold', color: '#4E342E' },
    dishCategory: { fontSize: 12, color: '#8C7853', marginTop: 2 },
    dishDescription: { fontSize: 13, color: '#8C7853', fontStyle: 'italic', marginBottom: 4 },
    divider: { marginVertical: 12, backgroundColor: '#F0EAE0' },
    section: { marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    sectionName: { fontSize: 12, fontWeight: '700', color: '#8C7853', textTransform: 'uppercase', letterSpacing: 0.5 },
    ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 4 },
    ingredientName: { fontSize: 14, color: '#4E342E' },
    ingredientQty: { fontSize: 14, color: '#C5A059', fontWeight: '600' },
    stepsLabel: { fontSize: 12, fontWeight: '700', color: '#8C7853', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    stepRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    stepNumber: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#F5F0E8',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    stepNumberText: { fontSize: 11, fontWeight: 'bold', color: '#C5A059' },
    stepText: { flex: 1, fontSize: 13, color: '#4E342E', lineHeight: 20 },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 16, paddingBottom: 32,
        borderTopWidth: 1, borderTopColor: '#F0EAE0',
    },
    saveButton: { borderRadius: 14 },
});
