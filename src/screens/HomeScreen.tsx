import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Alert, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Card, FAB, Text, useTheme, IconButton, Surface, Button, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Recipe } from '../types';
import { getRecipes, createRecipe, deleteRecipe, isAdmin } from '../store/repository';
import { seedDemoData, seedOfficialRecipes } from '../store/seed';
import { logout } from '../store/auth';
import LoginScreen from './LoginScreen';
import Paywall from '../components/Paywall';
import { auth } from '../store/firebase';
import { getUserProfile, UserProfile, addSection, addIngredient, addStep, getPublicRecipeDetails } from '../store/repository';
import { presentPaywall, presentCustomerCenter } from '../store/subscription';
import { PRESET_RECIPES, PresetRecipe } from '../data/presets';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isSeedingOfficial, setIsSeedingOfficial] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallReason, setPaywallReason] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<PresetRecipe | null>(null);
    const [importData, setImportData] = useState<any>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [allTags, setAllTags] = useState<string[]>([]);
    const navigation = useNavigation<any>();
    const theme = useTheme();


    const loadRecipes = async () => {
        try {
            const data = await getRecipes();
            setRecipes(data);

            // Extract unique tags
            const tags = new Set<string>();
            data.forEach(r => {
                r.tags?.forEach(t => tags.add(t));
            });
            setAllTags(Array.from(tags).sort());
        } catch (e: any) {
            console.error("[HOME] loadRecipes error:", e);
            Alert.alert("エラー", `レシピの読み込みに失敗しました: ${e.message}`);
        }
    };

    // Listen for auth state changes to refresh data
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
            console.log("Auth state changed, reloading recipes...", user?.uid);
            loadRecipes();
            if (user) {
                const profile = await getUserProfile();
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Handle URL parameters for import
    useEffect(() => {
        const handleUrlParams = async () => {
            if (Platform.OS === 'web') {
                const params = new URLSearchParams(window.location.search);

                // 1. Data-in-URL (Legacy)
                const dataBase64 = params.get('importData');
                if (dataBase64) {
                    try {
                        const json = decodeURIComponent(escape(atob(dataBase64)));
                        const data = JSON.parse(json);
                        setImportData(data);
                        // Clear the parameter
                        const url = new URL(window.location.href);
                        url.searchParams.delete('importData');
                        window.history.replaceState({}, '', url.toString());
                        return;
                    } catch (e) {
                        console.error('Failed to parse import data', e);
                    }
                }

                // 2. ID-based Navigation
                const rId = params.get('recipeId');

                if (rId) {
                    navigation.navigate('RecipeDetail', { recipeId: rId, fromShowcase: true });

                    // Clear params
                    const url = new URL(window.location.href);
                    ['recipeId', 'versionId', 'recipeName'].forEach(p => url.searchParams.delete(p));
                    window.history.replaceState({}, '', url.toString());
                    return;
                }

                // 3. Screen-based Navigation (New)
                const targetScreen = params.get('screen');
                if (targetScreen === 'Showcase') {
                    navigation.navigate('Showcase');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('screen');
                    window.history.replaceState({}, '', url.toString());
                    return;
                } else if (targetScreen === 'Guide') {
                    navigation.navigate('Guide');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('screen');
                    window.history.replaceState({}, '', url.toString());
                    return;
                }
            }
        };

        handleUrlParams();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRecipes();
        }, [])
    );

    const handleAddRecipe = async () => {
        try {
            const newRecipeName = `新規レシピ ${recipes.length + 1}`;
            await createRecipe(newRecipeName);
            loadRecipes();
        } catch (error: any) {
            if (error.message.includes('上限')) {
                // Try presenting native paywall first
                const success = await presentPaywall();
                if (success) {
                    loadRecipes();
                } else {
                    setPaywallReason(error.message);
                    setShowPaywall(true); // Fallback to custom paywall or just stop
                }
            } else {
                alert(error.message);
            }
        }
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        await seedDemoData();
        await loadRecipes();
        setIsSeeding(false);
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

            setSelectedPreset(null);
            await loadRecipes();
            navigation.navigate('RecipeDetail', { recipeId });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportData = async () => {
        if (!importData) return;
        setIsImporting(true);
        try {
            const originId = importData.version?.recipeId || importData.id;
            const recipe = await createRecipe(importData.name, originId);
            const recipeId = recipe.id;
            const versionId = recipe.currentVersionId!;

            const v = importData.version;

            for (let i = 0; i < (v.sections || []).length; i++) {
                const s = v.sections[i];
                const sectionId = await addSection(recipeId, versionId, s.name, i);
                for (const ing of (s.ingredients || [])) {
                    await addIngredient(recipeId, versionId, sectionId, ing.name, ing.quantity, ing.unit);
                }
            }

            for (let i = 0; i < (v.steps || []).length; i++) {
                const step = v.steps[i];
                await addStep(recipeId, versionId, step.description, i);
            }

            setImportData(null);
            await loadRecipes();
            Alert.alert('インポート完了', `「${importData.name}」をあなたの研究ノートに追加しました。`);
            navigation.navigate('RecipeDetail', { recipeId });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const renderRecipeCard = ({ item }: { item: Recipe }) => {
        const latestVersion = item.versions?.[0]; // Versions are sorted DESC
        const versionCount = item.versions?.length || 0;

        return (
            <Card
                style={styles.recipeCard}
                elevation={1}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Surface style={styles.iconContainer} elevation={0}>
                            <View style={styles.iconInner}>
                                <IconButton icon="notebook-outline" iconColor={theme.colors.primary} size={24} />
                            </View>
                        </Surface>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton
                                icon="delete-outline"
                                iconColor="#888"
                                size={20}
                                style={{ margin: 0 }}
                                onPress={() => {
                                    const message = `「${item.name}」を削除してもよろしいですか？この操作は取り消せません。`;

                                    if (Platform.OS === 'web') {
                                        if (window.confirm(message)) {
                                            deleteRecipe(item.id).then(() => loadRecipes());
                                        }
                                        return;
                                    }

                                    Alert.alert(
                                        'レシピの削除',
                                        message,
                                        [
                                            { text: 'キャンセル', style: 'cancel' },
                                            {
                                                text: '削除',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await deleteRecipe(item.id);
                                                        loadRecipes();
                                                    } catch (err: any) {
                                                        Alert.alert('エラー', '削除に失敗しました');
                                                    }
                                                }
                                            },
                                        ]
                                    );
                                }}
                            />
                            <View style={styles.versionBadge}>
                                <Text style={styles.versionBadgeText}>Ver {item.latestVersionNumber || '1.0'}</Text>
                            </View>
                        </View>
                    </View>

                    <Text variant="titleLarge" style={styles.recipeName} numberOfLines={1}>
                        {item.name}
                    </Text>

                    {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagBadgeRow}>
                            {item.tags.map(tag => (
                                <View key={tag} style={styles.tagBadge}>
                                    <Text style={styles.tagBadgeText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <View style={styles.statItem}>
                            <IconButton icon="history" size={14} iconColor="#888" style={styles.statIcon} />
                            <Text style={styles.statText}>改善済み</Text>
                        </View>
                        <Text style={styles.dateText}>
                            更新: {new Date(item.latestVersionDate || item.createdAt).toLocaleDateString('ja-JP')}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    const renderPresetItem = ({ item }: { item: PresetRecipe }) => (
        <Card
            style={styles.presetCard}
            onPress={() => setSelectedPreset(item)}
            elevation={0}
        >
            <Card.Content style={styles.presetContent}>
                <Text style={styles.presetCategory}>{item.category}</Text>
                <Text style={styles.presetName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.presetFooter}>
                    <Text style={styles.presetAction}>レシピを見る</Text>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header elevated style={styles.appbar}>
                <Appbar.Content
                    title="黄金比のレシピ帳"
                    titleStyle={styles.appTitle}
                />
                {userProfile?.plan === 'standard' && (
                    <IconButton
                        icon="crown"
                        iconColor="#B8860B"
                        size={20}
                        onPress={() => presentCustomerCenter()}
                    />
                )}
                <Button
                    mode="text"
                    onPress={() => setShowLogin(true)}
                    icon={auth.currentUser?.isAnonymous ? "account-circle-outline" : "account-check"}
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    textColor={theme.colors.primary}
                    contentStyle={{ flexDirection: 'row-reverse', height: 48 }}
                >
                    ログイン
                </Button>
            </Appbar.Header>

            <View style={{ flex: 1 }}>
                <FlatList
                    data={selectedTag ? recipes.filter(r => r.tags?.includes(selectedTag)) : recipes}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRecipeCard}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.presetsContainer}>
                                <View style={styles.quickActionsRow}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Showcase')}
                                        activeOpacity={0.8}
                                        style={styles.quickActionTile}
                                    >
                                        <Surface style={[styles.actionBanner, { backgroundColor: '#C5A059' }]} elevation={2}>
                                            <View style={styles.actionBadge}>
                                                <MaterialCommunityIcons name="earth" size={12} color="#C5A059" />
                                                <Text style={styles.actionBadgeText}>Showcase</Text>
                                            </View>
                                            <Text style={styles.actionTitle}>ショーケース</Text>
                                            <Text style={styles.actionSubtitle}>世界中の比率</Text>
                                            <View style={styles.actionIconWrap}>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
                                            </View>
                                        </Surface>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Guide')}
                                        activeOpacity={0.8}
                                        style={styles.quickActionTile}
                                    >
                                        <Surface style={[styles.actionBanner, { backgroundColor: '#4E342E' }]} elevation={2}>
                                            <View style={[styles.actionBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                <MaterialCommunityIcons name="book-open-variant" size={12} color="#FDFCF0" />
                                                <Text style={[styles.actionBadgeText, { color: '#FDFCF0' }]}>Manual</Text>
                                            </View>
                                            <Text style={styles.actionTitle}>使い方ガイド</Text>
                                            <Text style={styles.actionSubtitle}>研究のコツ</Text>
                                            <View style={styles.actionIconWrap}>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                                            </View>
                                        </Surface>
                                    </TouchableOpacity>
                                </View>

                                {isAdmin() && (
                                    <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
                                        <Button
                                            mode="contained"
                                            buttonColor="#C5A059"
                                            icon="star-shooting"
                                            onPress={handleSeedOfficial}
                                            loading={isSeedingOfficial}
                                            disabled={isSeedingOfficial}
                                            style={{ borderRadius: 8 }}
                                        >
                                            【管理者専用】公式レシピを一括登録
                                        </Button>
                                    </View>
                                )}

                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>定番の黄金比10選</Text>
                                    <IconButton icon="star-outline" size={18} iconColor={theme.colors.primary} />
                                </View>
                                <FlatList
                                    data={PRESET_RECIPES}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={renderPresetItem}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.presetsList}
                                />
                                <View style={styles.divider} />

                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>あなたの研究ノート</Text>
                                    {selectedTag && (
                                        <Button
                                            mode="text"
                                            compact
                                            onPress={() => setSelectedTag(null)}
                                            labelStyle={{ fontSize: 12 }}
                                        >
                                            フィルター解除
                                        </Button>
                                    )}
                                </View>

                                {allTags.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.tagsScroll}
                                        contentContainerStyle={styles.tagsScrollContent}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setSelectedTag(null)}
                                            style={[styles.filterChip, !selectedTag && styles.filterChipActive]}
                                        >
                                            <Text style={[styles.filterChipText, !selectedTag && styles.filterChipTextActive]}>すべて</Text>
                                        </TouchableOpacity>
                                        {allTags.map(tag => (
                                            <TouchableOpacity
                                                key={tag}
                                                onPress={() => setSelectedTag(tag)}
                                                style={[styles.filterChip, selectedTag === tag && styles.filterChipActive]}
                                            >
                                                <Text style={[styles.filterChipText, selectedTag === tag && styles.filterChipTextActive]}>#{tag}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <IconButton icon="book-open-variant" size={64} iconColor="#DDD" />
                                <Text variant="headlineSmall" style={styles.emptyTitle}>研究ノートはまだありません</Text>
                                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                                    右下の「＋」ボタンから、あなただけの最高の配合の記録を始めましょう。
                                </Text>
                                {isAdmin() && (
                                    <View style={{ marginTop: 16 }}>
                                        <Button
                                            mode="contained"
                                            buttonColor="#C5A059"
                                            icon="star-shooting"
                                            onPress={handleSeedOfficial}
                                            loading={isSeedingOfficial}
                                            disabled={isSeedingOfficial}
                                            style={{ borderRadius: 8 }}
                                        >
                                            【管理者専用】公式レシピを一括登録
                                        </Button>
                                    </View>
                                )}
                                <Button
                                    mode="outlined"
                                    onPress={handleSeedData}
                                    loading={isSeeding}
                                    disabled={isSeeding}
                                    style={{ marginTop: 24 }}
                                >
                                    デモデータを追加する
                                </Button>
                            </View>
                        }
                    />
                    {userProfile?.plan !== 'standard' && (
                        <Card style={styles.premiumPromoCard} elevation={2}>
                            <View style={styles.premiumPromoContent}>
                                <View style={styles.premiumPromoIconContainer}>
                                    <IconButton icon="crown" iconColor="#B8860B" size={24} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.premiumPromoTitle}>プレミアム機能で研究を加速</Text>
                                    <Text style={styles.premiumPromoSubtitle}>広告なし・レシピ無制限・逆算スケーラー</Text>
                                    <Button
                                        mode="contained"
                                        compact
                                        onPress={() => {
                                            setPaywallReason(null);
                                            setShowPaywall(true);
                                        }}
                                        style={styles.premiumPromoButton}
                                        labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                                    >
                                        詳細を見る
                                    </Button>
                                </View>
                            </View>
                        </Card>
                    )}
                </View>


            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
                onPress={handleAddRecipe}
                label="新しいレシピ"
                visible={true}
            />

            <Portal>
                <Dialog visible={showLogin} onDismiss={() => setShowLogin(false)} style={styles.loginDialog}>
                    <LoginScreen onClose={() => setShowLogin(false)} />
                </Dialog>
                <Dialog visible={showPaywall} onDismiss={() => setShowPaywall(false)} style={styles.loginDialog}>
                    <Paywall onClose={() => setShowPaywall(false)} reason={paywallReason || undefined} />
                </Dialog>

                <Dialog visible={!!selectedPreset} onDismiss={() => setSelectedPreset(null)} style={styles.presetDialog}>
                    <Dialog.Title style={styles.dialogTitle}>{selectedPreset?.name}</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScroll}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                                <Text style={styles.dialogDescription}>{selectedPreset?.description}</Text>
                                <Text style={styles.sectionHeader}>材料の比率</Text>
                                {selectedPreset?.sections.map((s, idx) => (
                                    <View key={idx} style={styles.dialogSection}>
                                        <Text style={styles.dialogSectionName}>{s.name}</Text>
                                        {s.ingredients.map((ing, iidx) => (
                                            <Text key={iidx} style={styles.dialogIngredient}>
                                                • {ing.name}: {ing.unit?.includes('適量') ? '' : `${ing.quantity} `}{ing.unit}
                                            </Text>
                                        ))}
                                    </View>
                                ))}
                                <Text style={styles.sectionHeader}>作り方</Text>
                                {selectedPreset?.steps.map((step, idx) => (
                                    <Text key={idx} style={styles.dialogStep}>{idx + 1}. {step}</Text>
                                ))}
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setSelectedPreset(null)} textColor="#888">キャンセル</Button>
                        <Button
                            mode="contained"
                            onPress={() => selectedPreset && handleImportPreset(selectedPreset)}
                            loading={isImporting}
                            disabled={isImporting}
                            style={{ borderRadius: 10 }}
                        >
                            自分のレシピに追加
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={!!importData} onDismiss={() => setImportData(null)} style={styles.presetDialog}>
                    <Dialog.Title style={styles.dialogTitle}>レシピをインポート</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogDescription}>
                            「{importData?.name}」をあなたの研究ノートに追加しますか？
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setImportData(null)} textColor="#888">キャンセル</Button>
                        <Button
                            mode="contained"
                            onPress={handleImportData}
                            loading={isImporting}
                            disabled={isImporting}
                            style={{ borderRadius: 10 }}
                        >
                            インポート
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    appbar: {
        backgroundColor: '#fff',
    },
    appTitle: {
        fontWeight: 'bold',
        color: '#4E342E',
        letterSpacing: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    recipeCard: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#EFEBE9',
        overflow: 'hidden',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F9F7F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3E5AB',
    },
    iconInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    versionBadge: {
        backgroundColor: '#FDF7E1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    versionBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#C5A059',
        letterSpacing: 0.5,
    },
    recipeName: {
        fontWeight: 'bold',
        color: '#3E2723',
        fontSize: 22,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    tagBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    tagBadge: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    tagBadgeText: {
        fontSize: 10,
        color: '#8C7853',
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F9F7F2',
        paddingTop: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDFCFB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statIcon: {
        margin: 0,
        marginRight: -4,
    },
    statText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C5A059',
    },
    dateText: {
        fontSize: 11,
        color: '#A1887F',
        opacity: 0.8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: '#3E2723',
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
        fontSize: 24,
    },
    emptySubtitle: {
        color: '#8C7853',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
        fontSize: 16,
        opacity: 0.8,
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
        borderRadius: 28,
        height: 56,
        justifyContent: 'center',
    },
    loginDialog: {
        backgroundColor: '#fff',
        borderRadius: 28,
    },
    presetDialog: {
        backgroundColor: '#fff',
        borderRadius: 20,
        maxHeight: '85%',
        paddingVertical: 8,
    },
    dialogTitle: {
        fontWeight: 'bold',
        color: '#4E342E',
        textAlign: 'center',
        fontSize: 20,
        marginTop: 16,
    },
    dialogScroll: {
        paddingHorizontal: 0, // ScrollView internally handles horizontal padding if needed, but Dialog.ScrollArea has default horizontal padding
    },
    dialogDescription: {
        fontSize: 14,
        color: '#8C7853',
        marginBottom: 20,
        lineHeight: 22,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.9,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E342E',
        marginTop: 16,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#F0E68C',
        paddingLeft: 8,
    },
    dialogSection: {
        marginBottom: 8,
    },
    dialogSectionName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#A1887F',
        marginBottom: 4,
    },
    dialogIngredient: {
        fontSize: 14,
        color: '#4E342E',
        marginLeft: 8,
        marginBottom: 2,
    },
    dialogStep: {
        fontSize: 14,
        color: '#4E342E',
        marginBottom: 6,
        lineHeight: 20,
    },
    presetsContainer: {
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E342E',
    },
    presetsList: {
        paddingRight: 16,
    },
    presetCard: {
        width: 140,
        height: 120,
        marginRight: 12,
        borderRadius: 16,
        backgroundColor: '#FDFCF0',
        borderWidth: 1,
        borderColor: '#F0E68C',
    },
    presetContent: {
        padding: 12,
        flex: 1,
    },
    presetCategory: {
        fontSize: 10,
        color: '#B8860B',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    presetName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4E342E',
        lineHeight: 18,
    },
    presetFooter: {
        marginTop: 'auto',
    },
    presetAction: {
        fontSize: 11,
        color: '#8C7853',
        textDecorationLine: 'underline',
    },
    divider: {
        height: 1,
        backgroundColor: '#EFEBE9',
        marginVertical: 20,
    },
    premiumPromoCard: {
        backgroundColor: '#4E342E', // Dark Espresso base
        margin: 4,
        marginBottom: 80, // Extra space to avoid FAB overlap
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#B8860B',
    },
    premiumPromoContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    premiumPromoIconContainer: {
        backgroundColor: '#FDFCF0',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    premiumPromoTitle: {
        color: '#FDFCF0',
        fontSize: 15,
        fontWeight: 'bold',
    },
    premiumPromoSubtitle: {
        color: '#BD9A7A',
        fontSize: 11,
        marginTop: 2,
        marginBottom: 8,
    },
    premiumPromoButton: {
        backgroundColor: '#B8860B',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    quickActionTile: {
        flex: 1,
    },
    actionBanner: {
        borderRadius: 20,
        height: 120, // Enough height for title + icon
        padding: 16,
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
    },
    actionTitle: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 4,
    },
    actionSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        marginTop: 2,
    },
    actionIconWrap: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 4,
    },
    actionBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#C5A059',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    tagsScroll: {
        marginBottom: 16,
    },
    tagsScrollContent: {
        paddingRight: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EFEBE9',
    },
    filterChipActive: {
        backgroundColor: '#C5A059',
        borderColor: '#C5A059',
    },
    filterChipText: {
        fontSize: 12,
        color: '#8C7853',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
});
