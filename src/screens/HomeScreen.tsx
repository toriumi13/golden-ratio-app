import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, useWindowDimensions, Alert, Platform, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Appbar, useTheme, Surface, Button, Portal, Dialog, Text, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { UserProfile } from '../types';
import LoginScreen from './LoginScreen';
import Paywall from '../components/Paywall';
import { auth } from '../store/firebase';
import { getUserProfile, getPublicRecipeDetails, addSection, addIngredient, addStep, createRecipe, isAdmin } from '../store/repository';
import { seedOfficialRecipes } from '../store/seed';
import { presentPaywall } from '../store/subscription';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Searchbar } from 'react-native-paper';
import { useRecipes } from '../hooks/useRecipes';
import { RecipeCard } from '../components/RecipeCard';
import { BottomBar } from '../components/BottomBar';
import { LegalFooter } from '../components/LegalFooter';

export default function HomeScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 600;
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const {
        recipes,
        filteredRecipes,
        loading,
        searchQuery,
        setSearchQuery,
        loadRecipes,
        handleAddRecipe,
        handleDeleteRecipe,
    } = useRecipes();

    const [showLogin, setShowLogin] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallReason, setPaywallReason] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [importData, setImportData] = useState<any>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [allTags, setAllTags] = useState<string[]>([]);

    const fetchProfile = useCallback(async () => {
        if (auth.currentUser) {
            try {
                const profile = await getUserProfile();
                setUserProfile(profile);
            } catch (e) {
                console.error(e);
            }
        } else {
            setUserProfile(null);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        const tags = new Set<string>();
        recipes.forEach(r => {
            r.tags?.forEach(t => tags.add(t));
        });
        setAllTags(Array.from(tags).sort());
    }, [recipes]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            loadRecipes();
            fetchProfile();
            if (!user) setShowLogin(true);
        });
        return () => unsubscribe();
    }, [loadRecipes, fetchProfile]);

    useEffect(() => {
        const handleUrlParams = async () => {
            if (Platform.OS === 'web') {
                const params = new URLSearchParams(window.location.search);
                const sharedRecipeId = params.get('recipeId');
                const sharedVersionId = params.get('versionId');
                const sharedName = params.get('recipeName');

                if (sharedRecipeId) {
                    // Navigate to RecipeDetail directly in showcase mode
                    // instead of showing the import dialog immediately.
                    navigation.navigate('RecipeDetail', { 
                        recipeId: sharedRecipeId, 
                        versionId: sharedVersionId,
                        fromShowcase: true 
                    });
                }

                const targetScreen = params.get('screen');
                if (targetScreen) {
                    const validScreens = ['Showcase', 'Guide', 'PrivacyPolicy', 'TermsOfService', 'About', 'Contact'];
                    if (validScreens.includes(targetScreen)) {
                        navigation.navigate(targetScreen as any);
                    }
                }
                
                if (window.location.search) {
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.history.replaceState({}, '', url.toString());
                }
            }
        };
        handleUrlParams();
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            loadRecipes();
        }, [loadRecipes])
    );

    const handleActualAddRecipe = async () => {
        try {
            const newRecipe = await handleAddRecipe();
            if (newRecipe) navigation.navigate('RecipeDetail', { recipeId: newRecipe.id });
        } catch (error: any) {
            if (error.message.includes('上限')) {
                const success = await presentPaywall();
                if (success) loadRecipes();
                else {
                    setPaywallReason(error.message);
                    setShowPaywall(true);
                }
            } else {
                Alert.alert("エラー", error.message);
            }
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
            Alert.alert('インポート完了', `「${importData.name}」を追加しました。`);
            navigation.navigate('RecipeDetail', { recipeId });
        } catch (error: any) {
            Alert.alert("エラー", error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleSeedRecipes = async () => {
        setIsSeeding(true);
        try {
            await seedOfficialRecipes();
            Alert.alert("完了", "公式レシピのシードが完了しました。");
            loadRecipes();
        } catch (e: any) {
            Alert.alert("エラー", e.message);
        } finally {
            setIsSeeding(false);
        }
    };

    const mainRecipes = filteredRecipes.filter(r => !selectedTag || (r.tags && r.tags.includes(selectedTag!)));

    if (!auth.currentUser) {
        return <LoginScreen onClose={() => setShowLogin(false)} />;
    }

    return (
        <View style={styles.container}>
            <Appbar.Header elevated style={styles.appbar}>
                <Appbar.Content title="黄金比のレシピ帳" titleStyle={styles.appTitle} />
                {userProfile?.plan !== 'standard' && (
                    <Button
                        mode="text"
                        icon="crown"
                        textColor="#B8860B"
                        onPress={() => setShowPaywall(true)}
                        labelStyle={{ fontSize: isMobile ? 12 : 14, fontWeight: 'bold' }}
                    >
                        {!isMobile && "プレミアム"}
                    </Button>
                )}
                <Button
                    mode="text"
                    icon={auth.currentUser?.isAnonymous ? "account-circle-outline" : "account-check"}
                    onPress={() => setShowLogin(true)}
                    textColor={theme.colors.primary}
                    labelStyle={{ fontWeight: 'bold' }}
                >
                    {auth.currentUser?.isAnonymous ? "ログイン" : "プロフィール"}
                </Button>
            </Appbar.Header>

            <FlatList
                data={mainRecipes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RecipeCard
                        item={item}
                        navigation={navigation}
                        isMobile={isMobile}
                        onDelete={handleDeleteRecipe}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={{ padding: 16 }}>
                        <Searchbar
                            placeholder="名前またはタグで検索"
                            onChangeText={setSearchQuery}
                            value={searchQuery}
                            style={styles.searchbar}
                            iconColor={theme.colors.primary}
                            elevation={1}
                        />

                        {isAdmin() && (
                            <Button 
                                mode="contained" 
                                onPress={handleSeedRecipes} 
                                loading={isSeeding}
                                style={{ marginBottom: 16, backgroundColor: '#4E342E' }}
                                icon="seed"
                            >
                                公式レシピをシード(管理者用)
                            </Button>
                        )}

                        <View style={styles.quickActionsRow}>
                            <TouchableOpacity style={styles.quickActionTile} onPress={() => navigation.navigate('Showcase')}>
                                <Surface style={[styles.actionBanner, { backgroundColor: '#C5A059' }]} elevation={2}>
                                    <View style={styles.actionBadge}>
                                        <MaterialCommunityIcons name="star-outline" size={12} color="#C5A059" />
                                        <Text style={styles.actionBadgeText}>Popular</Text>
                                    </View>
                                    <Text style={styles.actionTitle}>ショーケース</Text>
                                    <Text style={styles.actionSubtitle}>成功事例をチェック</Text>
                                    <View style={styles.actionIconWrap}>
                                        <MaterialCommunityIcons name="earth" size={48} color="rgba(255,255,255,0.2)" />
                                    </View>
                                </Surface>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.quickActionTile} onPress={() => navigation.navigate('Guide')}>
                                <Surface style={[styles.actionBanner, { backgroundColor: '#4E342E' }]} elevation={2}>
                                    <View style={styles.actionBadge}>
                                        <MaterialCommunityIcons name="lightbulb-on-outline" size={12} color="#C5A059" />
                                        <Text style={styles.actionBadgeText}>Tutorial</Text>
                                    </View>
                                    <Text style={styles.actionTitle}>使い方ガイド</Text>
                                    <Text style={styles.actionSubtitle}>研究のコツ</Text>
                                    <View style={styles.actionIconWrap}>
                                        <MaterialCommunityIcons name="book-open-variant" size={48} color="rgba(255,255,255,0.2)" />
                                    </View>
                                </Surface>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.recipeBanner}
                            onPress={() => Linking.openURL('/recipes')}
                            activeOpacity={0.8}
                        >
                            <Surface style={styles.recipeBannerSurface} elevation={1}>
                                <View>
                                    <Text style={styles.recipeBannerTitle}>📚 黄金比プリセットレシピ集</Text>
                                    <Text style={styles.recipeBannerSub}>10品の黄金比を無料公開中。人数分の分量も自動計算できます</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#C5A059" />
                            </Surface>
                        </TouchableOpacity>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>研究ノート</Text>
                            <Text style={styles.sectionCount}>{recipes.length}件</Text>
                        </View>

                        {allTags.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsScrollContent}>
                                <TouchableOpacity onPress={() => setSelectedTag(null)} style={[styles.filterChip, !selectedTag && styles.filterChipActive]}>
                                    <Text style={[styles.filterChipText, !selectedTag && styles.filterChipTextActive]}>すべて</Text>
                                </TouchableOpacity>
                                {allTags.map(tag => (
                                    <TouchableOpacity key={tag} onPress={() => setSelectedTag(tag)} style={[styles.filterChip, selectedTag === tag && styles.filterChipActive]}>
                                        <Text style={[styles.filterChipText, selectedTag === tag && styles.filterChipTextActive]}>#{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {mainRecipes.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name={searchQuery ? "magnify-close" : "notebook-plus-outline"} size={64} color="#D7CCC8" />
                                <Text style={styles.emptyTitle}>{searchQuery ? "見つかりませんでした" : "ノートが空っぽです"}</Text>
                                <Text style={styles.emptySubtitle}>{searchQuery ? "条件を変えてみてください" : "右下のボタンから作成しましょう！"}</Text>
                            </View>
                        )}
                    </View>
                }
                ListFooterComponent={<LegalFooter onNavigate={(screen) => navigation.navigate(screen as any)} />}
            />

            <BottomBar 
                isPremium={userProfile?.isPremium || false} 
                isMobile={isMobile} 
                onAddRecipe={handleActualAddRecipe} 
            />

            <Portal>
                <Dialog visible={showLogin} onDismiss={() => setShowLogin(false)} style={styles.dialog}>
                    <LoginScreen onClose={() => setShowLogin(false)} />
                </Dialog>
                <Dialog visible={showPaywall} onDismiss={() => setShowPaywall(false)} style={styles.dialog}>
                    <Paywall onClose={() => setShowPaywall(false)} reason={paywallReason || undefined} />
                </Dialog>
                <Dialog visible={!!importData} onDismiss={() => setImportData(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>レシピをインポート</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogDescription}>「{importData?.name}」を追加しますか？</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setImportData(null)} textColor="#888">キャンセル</Button>
                        <Button mode="contained" onPress={handleImportData} loading={isImporting} style={{ borderRadius: 10 }}>インポート</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    appbar: { backgroundColor: '#fff' },
    appTitle: { fontWeight: 'bold', color: '#4E342E', fontSize: 18 },
    listContent: { paddingBottom: 100 },
    searchbar: { marginBottom: 20, borderRadius: 16, backgroundColor: '#FFF' },
    quickActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    quickActionTile: { flex: 1 },
    actionBanner: { borderRadius: 20, height: 110, padding: 16, overflow: 'hidden' },
    actionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    actionBadgeText: { fontSize: 8, fontWeight: '900', color: '#C5A059', marginLeft: 4 },
    actionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginTop: 4 },
    actionSubtitle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, marginTop: 2 },
    actionIconWrap: { position: 'absolute', bottom: -10, right: -10 },
    recipeBanner: { marginBottom: 20 },
    recipeBannerSurface: { borderRadius: 12, padding: 16, backgroundColor: '#FBF9F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    recipeBannerTitle: { fontWeight: 'bold', color: '#4E342E', fontSize: 15 },
    recipeBannerSub: { color: '#8C7853', fontSize: 12, marginTop: 4 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
    sectionCount: { fontSize: 12, color: '#8C7853' },
    tagsScroll: { marginBottom: 16 },
    tagsScrollContent: { paddingRight: 16, gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEBE9' },
    filterChipActive: { backgroundColor: '#C5A059', borderColor: '#C5A059' },
    filterChipText: { fontSize: 12, color: '#8C7853', fontWeight: '600' },
    filterChipTextActive: { color: '#FFF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { color: '#3E2723', fontWeight: 'bold', marginTop: 16, textAlign: 'center', fontSize: 20 },
    emptySubtitle: { color: '#8C7853', textAlign: 'center', marginTop: 8, fontSize: 14 },
    dialog: { backgroundColor: '#fff', borderRadius: 28 },
    dialogTitle: { fontWeight: 'bold', color: '#4E342E', textAlign: 'center', fontSize: 20 },
    dialogDescription: { fontSize: 14, color: '#8C7853', textAlign: 'center' },
});
