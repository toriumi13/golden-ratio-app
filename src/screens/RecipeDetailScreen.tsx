import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput as RNTextInput, Platform } from 'react-native';
import { Appbar, Text, Card, Divider, Chip, useTheme, Button, Portal, Dialog, IconButton } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Recipe, Version } from '../types';
import { getRecipeDetails, createNewVersionFromExisting, getUserProfile, UserProfile, setRecipePublicStatus } from '../store/repository';
import Paywall from '../components/Paywall';
import { presentPaywall } from '../store/subscription';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { toPng } from 'html-to-image';
import { getVirtualWeight, getRatioWidth } from '../utils/ratio';

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
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const contentRef = React.useRef<View>(null);


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

    const handleShare = async () => {
        if (!recipe || !currentVersion) return;

        // Prevent sharing if it's a direct copy (has originRecipeId) 
        // and hasn't been significantly modified (only one version)
        if (recipe.originRecipeId && recipe.versions && recipe.versions.length <= 1) {
            Alert.alert(
                '共有の制限',
                'このレシピは他の研究者から提供されたものです。あなたが独自の改良（新しいバージョンの作成）を行うまでは、ショーケースへ再公開することはできません。個人間での共有はURLをコピーして行ってください。'
            );
            // We can still allow sharing the URL, but don't mark it as Public
            const origin = (Platform.OS === 'web' && window.location.origin)
                ? window.location.origin
                : 'https://golden-ratio-app-zeta.vercel.app';
            const url = `${origin}/api/share?recipeId=${recipe.id}&versionId=${currentVersion.id}&recipeName=${encodeURIComponent(recipe.name)}`;
            setShareUrl(url);
            setShowShareDialog(true);
            return;
        }

        try {
            // Updated to ID-based sharing: Make it public first
            await setRecipePublicStatus(recipe.id, currentVersion.id, true);

            // Use current origin for local testing, fallback to production URL
            const origin = (Platform.OS === 'web' && window.location.origin)
                ? window.location.origin
                : 'https://golden-ratio-app-zeta.vercel.app';

            // Sharable URL with OGP proxy
            const url = `${origin}/api/share?recipeId=${recipe.id}&versionId=${currentVersion.id}&recipeName=${encodeURIComponent(recipe.name)}`;
            setShareUrl(url);
            setShowShareDialog(true);
        } catch (error) {
            console.error('Share failed:', error);
            Alert.alert('エラー', '共有設定の更新に失敗しました。');
        }
    };

    const downloadPinterestImage = async () => {
        if (Platform.OS !== 'web') {
            Alert.alert('Web版のみ', 'この機能はWeb版でのみ利用可能です。');
            return;
        }

        setIsGeneratingImage(true);
        try {
            const node = document.getElementById('recipe-content');
            if (!node) throw new Error('Content node not found');

            const dataUrl = await toPng(node, {
                backgroundColor: '#fff',
                style: {
                    padding: '40px',
                    borderRadius: '0'
                }
            });

            const link = document.createElement('a');
            link.download = `${recipe?.name || 'recipe'}_infographic.png`;
            link.href = dataUrl;
            link.click();
            Alert.alert('保存完了', 'Pinterest用画像をダウンロードしました。');
        } catch (err) {
            console.error('Failed to generate image', err);
            Alert.alert('エラー', '画像の生成に失敗しました。');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert('コピー完了', '共有用URLをクリップボードにコピーしました');
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
                    icon="share-variant"
                    onPress={handleShare}
                />
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
                                {currentVersion?.notes}
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                {/* Main Content for Image Capture (Off-screen) */}
                <View style={{ position: 'absolute', left: -9999, top: 0, width: 600 }}>
                    <View id="recipe-content">
                        <Card style={styles.captureCard}>
                            <Card.Content>
                                <View style={styles.captureHeader}>
                                    <Text style={styles.captureTitle}>{recipe.name}</Text>
                                    <Text style={styles.captureVersion}>
                                        Ver {currentVersion?.versionNumber} {currentVersion?.notes ? `(${currentVersion.notes})` : ''}
                                    </Text>
                                </View>

                                <View style={styles.captureStats}>
                                    <Text style={styles.captureStatText}>{currentVersion?.baseServings}人前</Text>
                                    <Text style={styles.captureStatText}>{new Date(currentVersion?.createdAt || '').toLocaleDateString()}</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        {currentVersion?.sections?.map((section) => (
                            <Card key={section.id} style={styles.captureSectionCard}>
                                <Card.Title
                                    title={section.name}
                                    titleStyle={styles.captureSectionTitle}
                                />
                                <Card.Content>
                                    {section.ingredients?.map((ing) => (
                                        <View key={ing.id} style={styles.captureIngRow}>
                                            <Text style={styles.captureIngName}>{ing.name}</Text>
                                            <Text style={styles.captureIngQty}>
                                                {ing.unit?.includes('適量') ? '' : ing.quantity}
                                                {ing.unit}
                                            </Text>
                                        </View>
                                    ))}
                                </Card.Content>
                            </Card>
                        ))}

                        <Card style={styles.captureSectionCard}>
                            <Card.Title title="手順" titleStyle={styles.captureSectionTitle} />
                            <Card.Content>
                                {currentVersion?.steps?.map((step, idx) => (
                                    <View key={step.id} style={styles.captureStepRow}>
                                        <View style={styles.captureStepNum}>
                                            <Text style={styles.captureStepNumText}>{idx + 1}</Text>
                                        </View>
                                        <Text style={styles.captureStepText}>
                                            {step.description}
                                        </Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>

                        <View style={styles.captureFooter}>
                            <Text style={styles.captureFooterText}>Generated by Golden Ratio Recipe App</Text>
                        </View>
                    </View>
                </View>
                {/* Scaler / Servings Control */}
                <View style={styles.scalerContainer}>
                    <View style={styles.scalerHeader}>
                        <View style={styles.scalerInfo}>
                            <IconButton icon="account-group" size={20} iconColor="#F3E5AB" style={{ margin: 0 }} />
                            <Text style={styles.scalerLabel}>分量を調整</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text variant="labelSmall" style={{ color: isStandardScaler ? '#C5A059' : '#BD9A7A', fontWeight: 'bold' }}>黄金比スケーラー</Text>
                            <IconButton
                                icon={isStandardScaler ? "calculator" : "calculator-variant-outline"}
                                iconColor={isStandardScaler ? "#C5A059" : "#BD9A7A"}
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
                                iconColor="#FFF"
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
                                iconColor="#FFF"
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
                    const maxWeight = Math.max(...(section.ingredients?.map(i => {
                        const baseVal = i.quantity * servings;
                        const actualQty = isStandardScaler ? baseVal * scalerRelativeFactor : baseVal;
                        return getVirtualWeight(actualQty, i.unit);
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
                                                {!ing.unit?.includes('適量') && (
                                                    isStandardScaler ? (
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
                                                    )
                                                )}
                                                <Text style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>{ing.unit}</Text>
                                            </View>
                                        </View>
                                        {/* Ratio Bar */}
                                        <View style={styles.ratioBarBg}>
                                            <View style={[styles.ratioBarFill, { width: getRatioWidth(displayValue, ing.unit, maxWeight) as any }]} />
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
                                                textStyle={{ fontSize: 11, color: '#4A3728', lineHeight: 14, fontWeight: 'bold' }}
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
                            onChangeText={(text) => setNewVersionNotes(text)}
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

                <Dialog visible={showShareDialog} onDismiss={() => setShowShareDialog(false)} style={styles.shareDialog}>
                    <Dialog.Title style={styles.dialogTitle}>レシピを共有</Dialog.Title>
                    <Dialog.Content style={styles.shareContent}>
                        <Text style={styles.shareSubtitle}>相手がQRコードを読み取ると、このレシピをインポートできます。</Text>
                        <View style={styles.qrContainer}>
                            {shareUrl ? (
                                <QRCode
                                    value={shareUrl}
                                    size={200}
                                    color="#4E342E"
                                    backgroundColor="white"
                                />
                            ) : null}
                        </View>
                        <Button
                            mode="outlined"
                            onPress={copyToClipboard}
                            style={styles.copyBtn}
                            icon="content-copy"
                        >
                            URLをコピー
                        </Button>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            mode="contained"
                            onPress={downloadPinterestImage}
                            loading={isGeneratingImage}
                            disabled={isGeneratingImage}
                            style={styles.pinterestBtn}
                            icon="image"
                        >
                            Pinterest用画像を保存
                        </Button>
                        <Button onPress={() => setShowShareDialog(false)}>閉じる</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F7F2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    appbar: { backgroundColor: '#FFF' },
    appbarTitle: { fontWeight: 'bold', color: '#3E2723', letterSpacing: 0.5 },
    scrollContent: { padding: 20, paddingBottom: 100 },

    // Timeline
    timelineItem: { flexDirection: 'row', minHeight: 70 },
    timelineLeft: { width: 32, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0', marginTop: 8, zIndex: 1, borderWidth: 2, borderColor: '#fff' },
    timelineLine: { flex: 1, width: 2, backgroundColor: '#F3E5AB', marginVertical: -4 },
    timelineRight: { flex: 1, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 4 },
    timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    versionNum: { fontSize: 15, fontWeight: '500', color: '#8C7853' },
    versionDate: { fontSize: 11, color: '#A1887F' },
    versionNotes: { color: '#6D4C41', marginTop: 6, fontSize: 13, lineHeight: 18 },
    comparisonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF7E1', borderRadius: 8, paddingRight: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFECB3' },
    comparisonTxt: { fontSize: 10, color: '#C5A059', fontWeight: 'bold' },

    // Cards
    card: { marginBottom: 12, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EFEBE9', overflow: 'hidden' },
    mainSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#3E2723', marginTop: 24, marginBottom: 16, letterSpacing: -0.5 },

    // Scaler
    scalerContainer: { backgroundColor: '#3E2723', borderRadius: 24, padding: 20, marginBottom: 20, overflow: 'hidden' },
    scalerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    scalerInfo: { flexDirection: 'row', alignItems: 'center' },
    scalerLabel: { fontSize: 14, color: '#F3E5AB', fontWeight: 'bold', marginLeft: 6 },
    scalerActiveTxt: { color: '#BD9A7A', fontSize: 11, textAlign: 'center' },
    standardScalerActive: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16 },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
    stepperBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    servingsCount: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    servingsNum: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    servingsUnit: { fontSize: 12, color: '#BD9A7A' },
    scalerInput: { fontSize: 16, fontWeight: 'bold', color: '#C5A059', borderBottomWidth: 1, borderBottomColor: '#C5A059', padding: 2, minWidth: 40, textAlign: 'right' },

    // Ingredients
    sectionContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F2EFE9' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    ingName: { fontSize: 16, color: '#3E2723', fontWeight: '500' },
    ingQty: { fontSize: 16, fontWeight: 'bold', color: '#C5A059' },
    ratioBarBg: { height: 4, backgroundColor: '#F9F7F2', borderRadius: 2, overflow: 'hidden' },
    ratioBarFill: { height: '100%', backgroundColor: '#C5A059', borderRadius: 2 },
    emptyText: { textAlign: 'center', padding: 20, color: '#A1887F', fontStyle: 'italic' },

    // Steps
    stepsContainer: { gap: 12 },
    stepCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 4, borderWidth: 1, borderColor: '#F2EFE9' },
    stepHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
    stepNumContainer: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#3E2723', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    stepNum: { fontSize: 14, fontWeight: 'bold', color: '#F3E5AB' },
    stepDesc: { flex: 1, fontSize: 15, lineHeight: 24, color: '#3E2723' },
    stepSectionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 0 },
    sectionChip: { backgroundColor: '#F3E5AB', borderRadius: 8 },

    // Dialogs & Forms
    nativeInput: { borderWidth: 1, borderColor: '#F2EFE9', borderRadius: 16, padding: 16, fontSize: 16, backgroundColor: '#FFF', textAlignVertical: 'top' },
    shareDialog: { backgroundColor: '#FFF', borderRadius: 28 },
    dialogTitle: { fontWeight: 'bold', color: '#3E2723', textAlign: 'center' },
    shareContent: { alignItems: 'center', paddingBottom: 20 },
    shareSubtitle: { fontSize: 14, color: '#8C7853', textAlign: 'center', marginBottom: 20 },
    qrContainer: { padding: 20, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F2EFE9', marginBottom: 20 },
    copyBtn: { borderRadius: 12, width: '100%' },
    dialogActions: { flexDirection: 'column', gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
    pinterestBtn: { width: '100%', borderRadius: 12 },

    // Capture (Infographic)
    captureCard: { padding: 40, backgroundColor: '#FFF', borderRadius: 0 },
    captureHeader: { marginBottom: 24 },
    captureTitle: { fontSize: 32, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
    captureVersion: { fontSize: 18, color: '#C5A059', fontWeight: 'bold' },
    captureStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F2EFE9', paddingVertical: 12 },
    captureStatText: { fontSize: 16, color: '#8C7853' },
    captureSectionCard: { marginHorizontal: 40, marginBottom: 20, borderRadius: 16, borderWidth: 1, borderColor: '#C5A059' },
    captureSectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
    captureIngRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F2EFE9' },
    captureIngName: { fontSize: 16, color: '#3E2723' },
    captureIngQty: { fontSize: 16, fontWeight: 'bold', color: '#C5A059' },
    captureStepRow: { flexDirection: 'row', marginBottom: 16 },
    captureStepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#C5A059', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    captureStepNumText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    captureStepText: { flex: 1, fontSize: 16, lineHeight: 24, color: '#3E2723' },
    captureFooter: { paddingTop: 40, paddingBottom: 20, alignItems: 'center' },
    captureFooterText: { fontSize: 14, color: '#A1887F', opacity: 0.5 }
});
