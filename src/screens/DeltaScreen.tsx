import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, Card, List, IconButton, useTheme, Divider, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Recipe, Version } from '../types';
import { getRecipeDetails } from '../store/repository';
import { compareVersions, IngredientDiff, StepDiff } from '../utils/delta';

export default function DeltaScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { recipeId, versionAId, versionBId } = route.params;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [diff, setDiff] = useState<{ ingredientDiffs: IngredientDiff[], stepDiffs: StepDiff[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await getRecipeDetails(recipeId);
            if (data && data.versions) {
                const verA = data.versions.find(v => v.id === versionAId);
                const verB = data.versions.find(v => v.id === versionBId);
                if (verA && verB) {
                    const result = compareVersions(verA, verB);
                    setDiff(result);
                    setRecipe(data);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [recipeId, versionAId, versionBId]);

    if (loading) return <View style={styles.center}><Text>比較中...</Text></View>;

    const verA = recipe?.versions?.find(v => v.id === versionAId);
    const verB = recipe?.versions?.find(v => v.id === versionBId);

    return (
        <View style={styles.container}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="進化の記録" subtitle={`Ver ${verA?.versionNumber} → Ver ${verB?.versionNumber}`} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="材料の変化"
                        titleStyle={{ fontWeight: 'bold', color: theme.colors.secondary }}
                        left={(props) => <IconButton {...props} icon="scale" />}
                    />
                    <Card.Content>
                        {diff?.ingredientDiffs.map((d, i) => (
                            <View key={i} style={styles.diffRow}>
                                <Text style={styles.ingName}>{d.name}</Text>
                                <View style={styles.diffValue}>
                                    {d.change === 'removed' ? (
                                        <View style={styles.badgeRemoved}><Text style={styles.removedTxt}>削除: {d.oldQuantity}{d.unit}</Text></View>
                                    ) : d.change === 'added' ? (
                                        <View style={styles.badgeAdded}><Text style={styles.addedTxt}>追加: {d.newQuantity}{d.unit}</Text></View>
                                    ) : (
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={styles.oldVal}>{d.oldQuantity}</Text>
                                                <Text style={{ marginHorizontal: 6, color: '#999' }}>→</Text>
                                                <Text style={styles.newVal}>{d.newQuantity}{d.unit}</Text>
                                            </View>
                                            <View style={[
                                                styles.percentageContainer,
                                                (d.newQuantity! > d.oldQuantity!) ? styles.plusBg : styles.minusBg
                                            ]}>
                                                <Text style={[styles.percentageTxt, (d.newQuantity! > d.oldQuantity!) ? styles.plusTxt : styles.minusTxt]}>
                                                    {d.newQuantity! > d.oldQuantity! ? '⬆' : '⬇'}
                                                    {Math.abs(Math.round((d.newQuantity! - d.oldQuantity!) / d.oldQuantity! * 100))}%
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                        {diff?.ingredientDiffs.length === 0 && <Text style={styles.noChange}>材料に変更はありません</Text>}
                    </Card.Content>
                </Card>

                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="工程の変化"
                        titleStyle={{ fontWeight: 'bold', color: theme.colors.secondary }}
                        left={(props) => <IconButton {...props} icon="format-list-checks" />}
                    />
                    <Card.Content>
                        {diff?.stepDiffs.map((d, i) => (
                            <View key={i} style={styles.stepDiffItem}>
                                <View style={[styles.stepIndicator, d.change === 'added' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFEBEE' }]}>
                                    <IconButton
                                        icon={d.change === 'added' ? 'plus' : 'minus'}
                                        size={16}
                                        iconColor={d.change === 'added' ? '#4CAF50' : '#F44336'}
                                    />
                                </View>
                                <Text style={[styles.stepDesc, d.change === 'removed' && styles.removed]}>{d.description}</Text>
                            </View>
                        ))}
                        {diff?.stepDiffs.length === 0 && <Text style={styles.noChange}>行程に変更はありません</Text>}
                    </Card.Content>
                </Card>

                <View style={styles.memoSection}>
                    <Text variant="titleSmall" style={styles.memoTitle}>Ver {verB?.versionNumber} の改善ポイント</Text>
                    <Card style={styles.memoCard} elevation={0}>
                        <Card.Content>
                            <Text style={styles.memoText}>{verB?.notes || '記録なし'}</Text>
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    diffRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    ingName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    diffValue: {
        flex: 1.5,
        alignItems: 'flex-end',
    },
    badgeRemoved: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    removedTxt: {
        color: '#F44336',
        fontSize: 13,
        fontWeight: 'bold',
    },
    badgeAdded: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    addedTxt: {
        color: '#4CAF50',
        fontSize: 13,
        fontWeight: 'bold',
    },
    removed: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    oldVal: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    newVal: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    percentageContainer: {
        marginTop: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    plusBg: { backgroundColor: '#E8F5E9' },
    minusBg: { backgroundColor: '#FFEBEE' },
    percentageTxt: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    plusTxt: { color: '#4CAF50' },
    minusTxt: { color: '#F44336' },
    stepDiffItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepDesc: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: '#444',
    },
    noChange: {
        textAlign: 'center',
        color: '#AAA',
        paddingVertical: 24,
        fontSize: 14,
    },
    memoSection: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    memoTitle: {
        fontWeight: 'bold',
        color: '#4E342E',
        marginBottom: 8,
    },
    memoCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD54F',
    },
    memoText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#5D4037',
    }
});
