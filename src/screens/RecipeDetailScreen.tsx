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
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallReason, setPaywallReason] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


    const loadData = useCallback(async () => {
        const data = await getRecipeDetails(recipeId);
        setRecipe(data);
        if (data && data.versions && data.versions.length > 0 && !selectedVersionId) {
            // Default to current version linked in recipe, or the latest created
            const current = data.versions.find(v => v.id === data.currentVersionId) || data.versions[0];
            setSelectedVersionId(current.id);
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

                {/* Scaler / Servings Control (UI Aim 2) */}
                <View style={styles.scalerContainer}>
                    <View style={styles.scalerInfo}>
                        <IconButton icon="account-group" size={20} iconColor={theme.colors.secondary} style={{ margin: 0 }} />
                        <Text style={styles.scalerLabel}>分量を調整</Text>
                    </View>
                    <View style={styles.stepper}>
                        <IconButton
                            icon="minus"
                            size={18}
                            mode="outlined"
                            disabled={servings <= 1}
                            onPress={() => setServings(s => Math.max(1, s - 1))}
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
                            onPress={() => setServings(s => s + 1)}
                            style={styles.stepperBtn}
                        />
                    </View>
                </View>

                {/* Ingredients Section */}
                <Text variant="titleMedium" style={styles.mainSectionTitle}>材料</Text>

                {currentVersion?.sections?.map((section) => {
                    const maxQty = Math.max(...(section.ingredients?.map(i => i.quantity) || [1]));
                    return (
                        <View key={section.id} style={styles.sectionContainer}>
                            <Text variant="labelLarge" style={{ color: theme.colors.primary, marginBottom: 12, fontWeight: 'bold' }}>
                                {section.name.toUpperCase()}
                            </Text>

                            {section.ingredients?.map((ing) => (
                                <View key={ing.id} style={{ marginBottom: 12 }}>
                                    <View style={styles.row}>
                                        <Text style={styles.ingName}>{ing.name}</Text>
                                        <Text style={styles.ingQty}>
                                            {(ing.quantity * servings).toFixed(1).replace(/\.0$/, '')}
                                            <Text style={{ fontSize: 10, fontWeight: 'normal' }}>{ing.unit}</Text>
                                        </Text>
                                    </View>
                                    {/* Ratio Bar (UI Aim 1) */}
                                    <View style={styles.ratioBarBg}>
                                        <View style={[styles.ratioBarFill, { width: `${(ing.quantity / maxQty) * 100}%` }]} />
                                    </View>
                                </View>
                            ))}
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
                            <Card.Content>
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
                                                textStyle={{ fontSize: 11, color: '#666', lineHeight: 14 }}
                                                compact
                                            >
                                                {ss.section?.name}
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
        minHeight: 60,
    },
    timelineLeft: {
        width: 30,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#DDD',
        marginTop: 6,
        zIndex: 1,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#EEE',
        marginVertical: -2,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 16,
        paddingHorizontal: 12,
        paddingTop: 4,
    },
    timelineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    versionNum: {
        fontSize: 14,
        color: '#666',
    },
    versionDate: {
        fontSize: 12,
        color: '#999',
    },
    versionNotes: {
        color: '#777',
        marginTop: 4,
        fontSize: 13,
    },
    comparisonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        paddingRight: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    comparisonTxt: {
        fontSize: 10,
        color: '#666',
        fontWeight: 'bold',
    },
    card: {
        margin: 16,
        marginBottom: 8,
        borderRadius: 12,
    },
    mainSectionTitle: {
        marginLeft: 20,
        marginTop: 12,
        marginBottom: 12,
        fontWeight: 'bold',
        color: '#4E342E',
        letterSpacing: 1,
    },
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    ingName: {
        fontSize: 15,
        color: '#333',
    },
    ingQty: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#B8860B',
    },
    ratioBarBg: {
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    ratioBarFill: {
        height: '100%',
        backgroundColor: '#B8860B',
        borderRadius: 2,
    },
    stepsContainer: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    stepCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepNum: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    stepDesc: {
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
        color: '#333',
    },
    stepSectionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9F9F9',
        gap: 6,
    },
    sectionChip: {
        backgroundColor: '#F5F5F5',
        borderRadius: 6,
        margin: 0,
        padding: 0,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
        fontSize: 14
    },
    scalerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 1,
    },
    scalerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scalerLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4E342E',
        marginLeft: 4,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        padding: 4,
    },
    stepperBtn: {
        margin: 0,
        width: 32,
        height: 32,
    },
    servingsCount: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 12,
    },
    servingsNum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#B8860B',
    },
    servingsUnit: {
        fontSize: 10,
        color: '#888',
        marginLeft: 2,
    },
    nativeInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
});
