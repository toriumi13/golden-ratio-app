import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TextInput, TouchableOpacity,
    Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Appbar, Text, Surface, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { GeneratedDish } from '../../api/generate-kondate';

const DISH_TYPES: { key: string; label: string; apiLabel: string; icon: string }[] = [
    { key: 'main',    label: '主菜',    apiLabel: '主菜',    icon: 'food' },
    { key: 'side1',   label: '副菜①',  apiLabel: '副菜',    icon: 'food-apple-outline' },
    { key: 'side2',   label: '副菜②',  apiLabel: '副菜',    icon: 'food-apple-outline' },
    { key: 'side3',   label: '副菜③',  apiLabel: '副菜',    icon: 'food-apple-outline' },
    { key: 'soup',    label: '汁物',    apiLabel: '汁物',    icon: 'bowl-mix-outline' },
    { key: 'dessert', label: 'デザート', apiLabel: 'デザート', icon: 'cake-variant-outline' },
];

const STAPLE_OPTIONS = ['ごはん', 'パン', '麺', 'なし'];
const API_BASE = Platform.OS === 'web' ? '' : 'https://golden-ratio-app-zeta.vercel.app';

export default function KondateScreen() {
    const navigation = useNavigation<any>();

    const [selectedDishKeys, setSelectedDishKeys] = useState<Set<string>>(
        new Set(['main', 'side1', 'side2'])
    );
    const [stapleFood, setStapleFood] = useState('ごはん');
    const [requiredIngredients, setRequiredIngredients] = useState<string[]>([]);
    const [optionalIngredients, setOptionalIngredients] = useState<string[]>([]);
    const [reqInput, setReqInput] = useState('');
    const [optInput, setOptInput] = useState('');
    const [freeText, setFreeText] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleDishType = (key: string) => {
        setSelectedDishKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const addChip = (
        input: string,
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        setInput: React.Dispatch<React.SetStateAction<string>>,
    ) => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setList(prev => [...prev, trimmed]);
        setInput('');
    };

    const removeChip = (index: number, setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        const dishTypes = DISH_TYPES
            .filter(d => selectedDishKeys.has(d.key))
            .map(d => d.apiLabel);

        if (dishTypes.length === 0) {
            Alert.alert('料理を選んでください', '少なくとも1品選択してください。');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/generate-kondate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dishTypes,
                    stapleFood,
                    requiredIngredients,
                    optionalIngredients,
                    freeText,
                }),
            });
            const data = await res.json();
            if (res.status === 429) throw new Error(data.error || 'AIが混み合っています。しばらく待ってから再試行してください。');
            if (!res.ok) throw new Error(data.error || '生成に失敗しました');
            navigation.navigate('KondatePreview', { dishes: data.dishes as GeneratedDish[] });
        } catch (e: any) {
            Alert.alert('エラー', e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCount = selectedDishKeys.size;

    return (
        <View style={styles.container}>
            <Appbar.Header elevated style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="AI献立生成" titleStyle={styles.appTitle} />
            </Appbar.Header>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* 使い方 */}
                    <Surface style={styles.howToCard} elevation={0}>
                        <View style={styles.howToHeader}>
                            <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#2D6A4F" />
                            <Text style={styles.howToTitle}>使い方</Text>
                        </View>
                        <View style={styles.howToSteps}>
                            {[
                                '作りたい料理の種類をタップして選ぶ',
                                '主食と使いたい食材を入力する（任意）',
                                '「献立を生成する」をタップ',
                                '気に入ったレシピをまとめて保存',
                            ].map((step, i) => (
                                <View key={i} style={styles.howToStep}>
                                    <View style={styles.howToStepNum}>
                                        <Text style={styles.howToStepNumText}>{i + 1}</Text>
                                    </View>
                                    <Text style={styles.howToStepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </Surface>

                    {/* 料理の種類 */}
                    <Surface style={styles.card} elevation={1}>
                        <View style={styles.cardLabelRow}>
                            <Text style={styles.cardLabel}>料理の種類</Text>
                            <Text style={styles.cardSub}>{selectedCount}品選択中</Text>
                        </View>
                        <View style={styles.dishTypeGrid}>
                            {DISH_TYPES.map(dish => {
                                const active = selectedDishKeys.has(dish.key);
                                return (
                                    <TouchableOpacity
                                        key={dish.key}
                                        onPress={() => toggleDishType(dish.key)}
                                        style={[styles.dishTypeTile, active && styles.dishTypeTileActive]}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name={dish.icon as any}
                                            size={24}
                                            color={active ? '#fff' : '#8C7853'}
                                        />
                                        <Text style={[styles.dishTypeLabel, active && styles.dishTypeLabelActive]}>
                                            {dish.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Surface>

                    {/* 主食 */}
                    <Surface style={styles.card} elevation={1}>
                        <Text style={styles.cardLabel}>主食</Text>
                        <View style={styles.chipRow}>
                            {STAPLE_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setStapleFood(opt)}
                                    style={[styles.chip, stapleFood === opt && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, stapleFood === opt && styles.chipTextActive]}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Surface>

                    {/* 食材 */}
                    <Surface style={styles.card} elevation={1}>
                        <Text style={styles.cardLabel}>食材</Text>

                        <Text style={styles.ingredientLabel}>必ず使う</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="例：鶏もも肉"
                                placeholderTextColor="#B0A090"
                                value={reqInput}
                                onChangeText={setReqInput}
                                onSubmitEditing={() => addChip(reqInput, setRequiredIngredients, setReqInput)}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addChip(reqInput, setRequiredIngredients, setReqInput)}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {requiredIngredients.length > 0 && (
                            <View style={styles.chipRow}>
                                {requiredIngredients.map((ing, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.ingredientChip}
                                        onPress={() => removeChip(i, setRequiredIngredients)}
                                    >
                                        <Text style={styles.ingredientChipText}>{ing}</Text>
                                        <MaterialCommunityIcons name="close" size={14} color="#4E342E" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.ingredientLabel, { marginTop: 16 }]}>あれば使いたい</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="例：にんじん"
                                placeholderTextColor="#B0A090"
                                value={optInput}
                                onChangeText={setOptInput}
                                onSubmitEditing={() => addChip(optInput, setOptionalIngredients, setOptInput)}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addChip(optInput, setOptionalIngredients, setOptInput)}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {optionalIngredients.length > 0 && (
                            <View style={styles.chipRow}>
                                {optionalIngredients.map((ing, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.ingredientChipOptional}
                                        onPress={() => removeChip(i, setOptionalIngredients)}
                                    >
                                        <Text style={styles.ingredientChipText}>{ing}</Text>
                                        <MaterialCommunityIcons name="close" size={14} color="#4E342E" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </Surface>

                    {/* その他の要望 */}
                    <Surface style={styles.card} elevation={1}>
                        <Text style={styles.cardLabel}>その他の要望</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder={'例：「こってり系で」「さっぱりしたい」\n「親子丼っぽいものが食べたい」'}
                            placeholderTextColor="#B0A090"
                            value={freeText}
                            onChangeText={setFreeText}
                            multiline
                            numberOfLines={3}
                        />
                    </Surface>

                    <Button
                        mode="contained"
                        onPress={handleGenerate}
                        disabled={loading || selectedCount === 0}
                        style={styles.generateButton}
                        contentStyle={{ height: 56 }}
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        buttonColor="#2D6A4F"
                    >
                        {loading ? '献立を考えています...' : `${selectedCount}品の献立を生成する`}
                    </Button>
                    {loading && <ActivityIndicator style={{ marginTop: 8 }} color="#2D6A4F" />}

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F7F2' },
    appbar: { backgroundColor: '#fff' },
    appTitle: { fontWeight: 'bold', color: '#4E342E', fontSize: 18 },
    scroll: { padding: 16, gap: 12 },

    howToCard: { borderRadius: 16, padding: 16, backgroundColor: '#EEF6F1', borderWidth: 1, borderColor: '#B7D9C8' },
    howToHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    howToTitle: { fontSize: 14, fontWeight: 'bold', color: '#2D6A4F' },
    howToSteps: { gap: 8 },
    howToStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    howToStepNum: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#2D6A4F',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    howToStepNumText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    howToStepText: { fontSize: 13, color: '#2D6A4F', flex: 1 },

    card: { borderRadius: 16, padding: 16, backgroundColor: '#fff' },
    cardLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
    cardLabel: { fontSize: 15, fontWeight: 'bold', color: '#4E342E' },
    cardSub: { fontSize: 12, color: '#8C7853' },

    dishTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dishTypeTile: {
        alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
        backgroundColor: '#F5F0E8', borderWidth: 1.5, borderColor: '#E0C097',
        minWidth: 80,
    },
    dishTypeTileActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
    dishTypeLabel: { fontSize: 12, fontWeight: '700', color: '#8C7853' },
    dishTypeLabelActive: { color: '#fff' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F5F0E8', borderWidth: 1, borderColor: '#E0C097',
    },
    chipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
    chipText: { fontSize: 13, color: '#8C7853', fontWeight: '600' },
    chipTextActive: { color: '#fff' },

    ingredientLabel: { fontSize: 13, fontWeight: '600', color: '#8C7853', marginBottom: 8 },
    inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    textInput: {
        flex: 1, borderWidth: 1, borderColor: '#E0C097', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
        color: '#4E342E', backgroundColor: '#FAFAFA',
    },
    textArea: { height: 80, textAlignVertical: 'top', flex: undefined },
    addButton: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#C5A059',
        justifyContent: 'center', alignItems: 'center',
    },
    ingredientChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
        backgroundColor: '#FFF8EC', borderWidth: 1, borderColor: '#C5A059',
    },
    ingredientChipOptional: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
        backgroundColor: '#F0F4F0', borderWidth: 1, borderColor: '#A8C5A0',
    },
    ingredientChipText: { fontSize: 13, color: '#4E342E' },
    generateButton: { borderRadius: 16, marginTop: 8 },
});
