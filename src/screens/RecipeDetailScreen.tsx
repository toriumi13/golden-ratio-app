import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Appbar, Text, Card, Divider, Chip, useTheme, Button, Portal, Dialog, IconButton } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Recipe, Version } from '../types';
import { getRecipeDetails, createNewVersionFromExisting, getUserProfile, UserProfile } from '../store/repository';
import Paywall from '../components/Paywall';
import { presentPaywall } from '../store/subscription';

export default function RecipeDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { recipeId } = route.params;

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    // Dialog for new version
    const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
    const [newVersionNotes, setNewVersionNotes] = useState('');
    const [versionType, setVersionType] = useState<'minor' | 'major'>('minor');
    const [dialogKey, setDialogKey] = useState(0);
    const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
    const [servings, setServings] = useState(1);
    const [isStandardScaler, setIsStandardScaler] = useState(false);
    const [scalerBaseIngredientId, setScalerBaseIngredientId] = useState<string | null>(null);
    const [scalerRelativeFactor, setScalerRelativeFactor] = useState(1);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallReason, setPaywallReason] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


    const handleToggleScaler = async () => {
        if (!isStandardScaler) {
            // Check plan before enabling
            if (userProfile?.plan !== 'standard') {
                setPaywallReason('黄金比スケーラー（逆算機能）はスタンダードプラン限定の機能です。');
                setShowPaywall(true);
                return;
            }
        }
        setIsStandardScaler(!isStandardScaler);
        setScalerRelativeFactor(1); // Reset when toggling
    };

    const handleServingsChange = (delta: number) => () => {
        if (userProfile?.plan !== 'standard') {
            setPaywallReason('人数の変更（スケーラー機能）はスタンダードプラン限定の機能です。');
            setShowPaywall(true);
            return;
        }
        setServings(s => Math.max(1, s + delta));
    };

    const loadData = useCallback(async () => {
        const data = await getRecipeDetails(recipeId);
        setRecipe(data);
        if (data && data.versions && data.versions.length > 0 && !selectedVersionId) {
            const current = data.versions.find(v => v.id === data.currentVersionId) || data.versions[0];
            setSelectedVersionId(current.id);
            setServings(current.baseServings || 1);
        }
        const profile = await getUserProfile();
        setUserProfile(profile);
        setLoading(false);
    }, [recipeId, selectedVersionId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleCreateNewVersion = async () => {
        if (!selectedVersionId || !recipe) return;

        try {
            const newId = await createNewVersionFromExisting(recipe.id, selectedVersionId, newVersionNotes, versionType);
            setNewVersionNotes('');
            setVersionType('minor');
            setShowNewVersionDialog(false);
            setDialogKey(k => k + 1);
            setSelectedVersionId(newId);
            await loadData();
            Alert.alert('成功', '新しいバージョンを作成しました');
        } catch (error: any) {
            if (error.message.includes('上限')) {
                setShowNewVersionDialog(false);
                // Try presenting native paywall
                const success = await presentPaywall();
                if (success) {
                    await loadData();
                } else {
                    setPaywallReason(error.message);
                    setShowPaywall(true);
                }
            } else {
                Alert.alert('エラー', 'バージョンの作成に失敗しました');
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>読み込み中...</Text>
            </View>
        );
    }

    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>レシピが見つかりません</Text>
            </View>
        );
    }

    const currentVersion = recipe.versions?.find(v => v.id === selectedVersionId) || recipe.versions?.[0];

    // Use parentVersionId or fallback to chronological order
    const getParentVersion = (v: Version) => {
        if (!recipe?.versions) return null;
        if (v.parentVersionId) return recipe.versions.find(pv => pv.id === v.parentVersionId);
        // Fallback for legacy items: next older in the versions list
        const idx = recipe.versions.findIndex(ver => ver.id === v.id);
        return (idx !== -1 && idx < recipe.versions.length - 1) ? recipe.versions[idx + 1] : null;
    };

    const prevVersion = currentVersion ? getParentVersion(currentVersion) : null;

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title={recipe.name} />
                {prevVersion && (
                    <Appbar.Action
                        icon="compare-horizontal"
                        onPress={() => navigation.navigate('Delta', {
                            recipeId: recipe.id,
                            versionAId: prevVersion.id,
                            versionBId: currentVersion?.id
                        })}
                    />
                )}
                <Appbar.Action
                    icon="pencil"
                    onPress={() => navigation.navigate('EditRecipe', { recipeId: recipe.id, versionId: currentVersion?.id })}
                />
            </Appbar.Header>


            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Evolution Timeline (UI Aim 3 - Vertical Refinement) */}
                <Card style={[styles.card, { marginTop: 16 }]} elevation={2}>
                    <Card.Title
                        title="進化の記録"
                        titleStyle={{ fontWeight: 'bold' }}
                        left={(props) => <IconButton {...props} icon="history" iconColor={theme.colors.primary} />}
                        right={(props) => (
                            <IconButton
                                {...props}
                                icon="plus"
                                mode="contained"
                                containerColor={theme.colors.primary}
                                iconColor="#fff"
                                onPress={() => {
                                    setNewVersionNotes('');
                                    setShowNewVersionDialog(true);
                                }}
                            />
                        )}
                    />
                    <Card.Content style={{ paddingLeft: 8 }}>
                        {recipe.versions?.map((v, idx) => (
                            <View key={v.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[
                                        styles.timelineDot,
                                        selectedVersionId === v.id && { backgroundColor: theme.colors.primary, transform: [{ scale: 1.2 }] }
                                    ]} />
                                    {idx < (recipe.versions?.length || 0) - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={[
                                    styles.timelineRight,
                                    selectedVersionId === v.id && { backgroundColor: '#FFFBED', borderRadius: 12, borderWidth: 1, borderColor: '#FFECB3' }
                                ]}>
                                    <View style={styles.timelineRow}>
                                        <Text onPress={() => setSelectedVersionId(v.id)} style={[
                                            styles.versionNum,
                                            selectedVersionId === v.id && { color: theme.colors.primary, fontWeight: 'bold' }
                                        ]}>
                                            Ver {v.versionNumber}
                                        </Text>
                                        <Text style={styles.versionDate}>
                                            {new Date(v.createdAt).toLocaleDateString('ja-JP')}
                                        </Text>
                                    </View>
                                    {selectedVersionId === v.id && getParentVersion(v) && (
                                        <View style={styles.comparisonBadge}>
                                            <IconButton icon="compare-horizontal" size={14} style={{ margin: 0 }} iconColor="#666" />
                                            <Text style={styles.comparisonTxt}>
                                                比較対象: Ver {getParentVersion(v)?.versionNumber}
                                            </Text>
                                            <Button
                                                mode="text"
                                                compact
                                                onPress={() => navigation.navigate('Delta', {
                                                    recipeId: recipe.id,
                                                    versionAId: getParentVersion(v)?.id,
                                                    versionBId: v.id
                                                })}
                                                labelStyle={{ fontSize: 10, fontWeight: 'bold' }}
                                            >
                                                差分を表示
                                            </Button>
                                        </View>
                                    )}
                                    {v.notes && (
                                        <Text variant="bodySmall" style={styles.versionNotes} numberOfLines={2}>
                                            {v.notes}
                                        </Text>
                                    )}
                                    {selectedVersionId !== v.id && (
                                        <Button
                                            mode="text"
                                            compact
                                            onPress={() => setSelectedVersionId(v.id)}
                                            style={{ alignSelf: 'flex-start' }}
                                            labelStyle={{ fontSize: 11 }}
                                        >
                                            この時点を表示
                                        </Button>
                                    )}
                                </View>
                            </View>
                        ))}
                    </Card.Content>
                </Card>
                {/* Version Detail Card (Notes) */}
                {currentVersion?.notes && (
                    <Card style={[styles.card, { backgroundColor: '#FDFCF0' }]} elevation={0}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <IconButton icon="pencil-outline" size={16} iconColor="#8C7853" style={{ margin: 0 }} />
                                <Text style={{ color: '#8C7853', fontWeight: 'bold', fontSize: 12 }}>メモ / 改善点</Text>
                            </View>
                            <Text variant="bodyMedium" style={{ color: '#5D4037', lineHeight: 22 }}>
                                {currentVersion.notes}
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                {/* Scaler / Servings Control */}
                <View style={styles.scalerContainer}>
                    <View style={styles.scalerHeader}>
                        <View style={styles.scalerInfo}>
                            <IconButton icon="account-group" size={20} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
                            <Text style={styles.scalerLabel}>分量を調整</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text variant="labelSmall" style={{ color: isStandardScaler ? '#B8860B' : '#888', fontWeight: 'bold' }}>黄金比スケーラー</Text>
                            <IconButton
                                icon={isStandardScaler ? "calculator" : "calculator-variant-outline"}
                                iconColor={isStandardScaler ? "#B8860B" : "#888"}
                                size={20}
                                onPress={handleToggleScaler}
                            />
                        </View>
                    </View>

                    {!isStandardScaler ? (
                        <View style={styles.stepper}>
                            <IconButton
                                icon="minus"
                                size={18}
                                mode="outlined"
                                disabled={servings <= 1}
                                onPress={handleServingsChange(-1)}
                                style={styles.stepperBtn}
                            />
                            <View style={styles.servingsCount}>
                                <Text style={styles.servingsNum}>{servings}</Text>
                                <Text style={styles.servingsUnit}>人分</Text>
                            </View>
                            <IconButton
                                icon="plus"
                                size={18}
                                mode="outlined"
                                onPress={handleServingsChange(1)}
                                style={styles.stepperBtn}
                            />
                        </View>
                    ) : (
                        <View style={styles.standardScalerActive}>
                            <Text style={styles.scalerActiveTxt}>
                                💡 材料の分量を入力して全体を自動調整
                            </Text>
                        </View>
                    )}
                </View>

                {/* Ingredients Section */}
                <Text variant="titleMedium" style={styles.mainSectionTitle}>材料</Text>


                {currentVersion?.sections?.map((section) => {
                    const maxQty = Math.max(...(section.ingredients?.map(i => {
                        const baseVal = i.quantity * servings;
                        return isStandardScaler ? baseVal * scalerRelativeFactor : baseVal;
                    }) || [1]));

                    return (
                        <View key={section.id} style={styles.sectionContainer}>
                            <Text variant="titleMedium" style={{ color: '#4E342E', marginBottom: 8, fontWeight: 'bold' }}>
                                {section.name}
                            </Text>

                            {section.ingredients?.map((ing) => {
                                const baseValue = ing.quantity * servings;
                                const displayValue = isStandardScaler ? baseValue * scalerRelativeFactor : baseValue;

                                return (
                                    <View key={ing.id} style={{ marginBottom: 12 }}>
                                        <View style={styles.row}>
                                            <Text style={styles.ingName}>{ing.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                {isStandardScaler ? (
                                                    <RNTextInput
                                                        keyboardType="numeric"
                                                        defaultValue={displayValue.toFixed(1).replace(/\.0$/, '')}
                                                        onChangeText={(text) => {
                                                            const val = parseFloat(text);
                                                            if (!isNaN(val) && val > 0) {
                                                                setScalerBaseIngredientId(ing.id);
                                                                setScalerRelativeFactor(val / baseValue);
                                                            }
                                                        }}
                                                        style={styles.scalerInput}
                                                    />
                                                ) : (
                                                    <Text style={styles.ingQty}>
                                                        {displayValue.toFixed(1).replace(/\.0$/, '')}
                                                    </Text>
                                                )}
                                                <Text style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>{ing.unit}</Text>
                                            </View>
                                        </View>
                                        {/* Ratio Bar */}
                                        <View style={styles.ratioBarBg}>
                                            <View style={[styles.ratioBarFill, { width: `${(displayValue / maxQty) * 100}%` }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}

                {(!currentVersion?.sections || currentVersion.sections.length === 0) && (
                    <Text style={styles.emptyText}>
                        材料が登録されていません
                    </Text>
                )}

                {/* Steps Timeline Section */}
                <Text variant="titleMedium" style={styles.mainSectionTitle}>調理工程</Text>

                <View style={styles.stepsContainer}>
                    {currentVersion?.steps?.map((step, idx) => (
                        <Card
                            key={step.id}
                            style={[
                                styles.stepCard,
                                focusedStepId === step.id && { borderColor: theme.colors.primary, borderWidth: 2, elevation: 4 }
                            ]}
                            onPress={() => setFocusedStepId(focusedStepId === step.id ? null : step.id)}
                        >
                            <Card.Content style={{ padding: 0 }}>
                                <View style={styles.stepHeader}>
                                    <View style={[
                                        styles.stepNumContainer,
                                        focusedStepId === step.id && { backgroundColor: theme.colors.primary }
                                    ]}>
                                        <Text style={[
                                            styles.stepNum,
                                            focusedStepId === step.id && { color: '#fff' }
                                        ]}>{idx + 1}</Text>
                                    </View>
                                    <Text style={[
                                        styles.stepDesc,
                                        focusedStepId === step.id && { fontWeight: 'bold' }
                                    ]}>{step.description}</Text>
                                </View>

                                {step.stepSections && step.stepSections.length > 0 && (
                                    <View style={styles.stepSectionsContainer}>
                                        {step.stepSections.map((ss) => (
                                            <Chip
                                                key={ss.id}
                                                style={styles.sectionChip}
                                                textStyle={{ fontSize: 11, color: '#B8860B', lineHeight: 14, fontWeight: 'bold' }}
                                                compact
                                            >
                                                {currentVersion?.sections?.find(s => s.id === ss.sectionId)?.name}
                                            </Chip>
                                        ))}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    ))}

                    {(!currentVersion?.steps || currentVersion.steps.length === 0) && (
                        <Text style={styles.emptyText}>
                            工程が登録されていません
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* New Version Dialog */}
            <Portal>
                <Dialog visible={showNewVersionDialog} onDismiss={() => setShowNewVersionDialog(false)}>
                    {/* ...Existing Dialog Content... */}
                    <Dialog.Title>新しいバージョンを作成</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                            現在の「Ver {currentVersion?.versionNumber}」をベースに、次のレシピを作成します。
                        </Text>
                        <RNTextInput
                            key={`version-notes-${dialogKey}`}
                            placeholder="今回の変更点メモ（例: 醤油を減らした）"
                            defaultValue=""
                            onEndEditing={(e) => setNewVersionNotes(e.nativeEvent.text)}
                            style={styles.nativeInput}
                            multiline
                            numberOfLines={3}
                            blurOnSubmit={true}
                        />

                        <Text variant="labelMedium" style={{ marginTop: 16, marginBottom: 8 }}>更新の種類</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Button
                                mode={versionType === 'minor' ? 'contained' : 'outlined'}
                                onPress={() => setVersionType('minor')}
                                style={{ flex: 1 }}
                            >
                                修正 ({(parseFloat(currentVersion?.versionNumber || '1.0') + 0.1).toFixed(1)})
                            </Button>
                            <Button
                                mode={versionType === 'major' ? 'contained' : 'outlined'}
                                onPress={() => setVersionType('major')}
                                style={{ flex: 1 }}
                            >
                                大幅変更 ({(Math.floor(parseFloat(currentVersion?.versionNumber || '1.0')) + 1.0).toFixed(1)})
                            </Button>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowNewVersionDialog(false)}>キャンセル</Button>
                        <Button onPress={handleCreateNewVersion}>作成</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={showPaywall} onDismiss={() => setShowPaywall(false)} style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' }}>
                    <Paywall onClose={() => setShowPaywall(false)} reason={paywallReason || undefined} />
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
        alignItems: 'center'
    },
    versionBar: {
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    versionHeaderMini: {
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#EEE',
    },
    scrollContent: {
        paddingBottom: 40
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 70,
    },
    timelineLeft: {
        width: 32,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E0E0E0',
        marginTop: 8,
        zIndex: 1,
        borderWidth: 2,
        borderColor: '#fff',
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#F0E68C',
        marginVertical: -4,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 20,
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    timelineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    versionNum: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8C7853',
    },
    versionDate: {
        fontSize: 11,
        color: '#A1887F',
    },
    versionNotes: {
        color: '#6D4C41',
        marginTop: 6,
        fontSize: 13,
        lineHeight: 18,
    },
    comparisonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDF7E1',
        borderRadius: 8,
        paddingRight: 8,
        marginTop: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#FFECB3',
    },
    comparisonTxt: {
        fontSize: 10,
        color: '#B8860B',
        fontWeight: 'bold',
    },
    card: {
        margin: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    mainSectionTitle: {
        marginLeft: 20,
        marginTop: 24,
        marginBottom: 16,
        fontWeight: 'bold',
        color: '#4E342E',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F0E68C', // Light Brass
        elevation: 2,
        shadowColor: '#B8860B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ingName: {
        fontSize: 16,
        color: '#4E342E',
        fontWeight: '500',
    },
    ingQty: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#B8860B',
    },
    ratioBarBg: {
        height: 5,
        backgroundColor: '#FDFCF0',
        borderRadius: 2.5,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: '#EFEBE9',
    },
    ratioBarFill: {
        height: '100%',
        backgroundColor: '#DAA520', // GoldenRod
        borderRadius: 2.5,
    },
    stepsContainer: {
        marginHorizontal: 16,
        marginTop: 4,
    },
    stepCard: {
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EFEBE9',
        padding: 4,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
    },
    stepNumContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#4E342E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 0,
    },
    stepNum: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FDFCF0',
    },
    stepDesc: {
        flex: 1,
        fontSize: 16,
        lineHeight: 26,
        color: '#3E2723',
    },
    stepSectionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        padding: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#FDFCF0',
        gap: 8,
    },
    sectionChip: {
        backgroundColor: '#FDF7E1',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFECB3',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#A1887F',
        fontSize: 15,
        fontStyle: 'italic',
    },
    scalerContainer: {
        backgroundColor: '#FDFCF0',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#B8860B',
        elevation: 3,
        shadowColor: '#B8860B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    scalerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    scalerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scalerLabel: {
        fontSize: 16,
        color: '#4E342E',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    scalerInput: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#B8860B',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 16,
        color: '#4E342E',
        fontWeight: 'bold',
        minWidth: 70,
        textAlign: 'right',
    },
    standardScalerActive: {
        backgroundColor: '#FFFDE7',
        padding: 16,
        borderRadius: 14,
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#B8860B',
    },
    scalerActiveTxt: {
        fontSize: 13,
        color: '#8C7853',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    stepperBtn: {
        margin: 0,
        width: 40,
        height: 40,
        backgroundColor: '#fff',
    },
    servingsCount: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 4,
    },
    servingsNum: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4E342E',
    },
    servingsUnit: {
        fontSize: 12,
        color: '#8C7853',
        marginLeft: 4,
        fontWeight: 'bold',
    },
    nativeInput: {
        borderWidth: 1,
        borderColor: '#D7CCC8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
        color: '#3E2723',
    },
});
