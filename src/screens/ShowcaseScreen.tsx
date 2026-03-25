import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    useWindowDimensions,
    Image
} from 'react-native';
import {
    Text,
    Card,
    IconButton,
    useTheme,
    Surface,
    Button,
    Searchbar
} from 'react-native-paper';
import { getAllPublicRecipes, toggleLike, getLikeStatus } from '../store/repository';
import { auth } from '../store/firebase';
import LoginScreen from './LoginScreen';
import { Recipe } from '../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import { getDefaultImageForCategory } from '../constants/defaultImages';
import { ScrollView, Alert } from 'react-native';



const ShowcaseScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [likedRecipes, setLikedRecipes] = useState<Record<string, boolean>>({});
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        loadPublicRecipes();
    }, []);

    const loadPublicRecipes = async () => {
        try {
            const data = await getAllPublicRecipes();
            setRecipes(data);

            // Fetch like status for all visible recipes
            const statusMap: Record<string, boolean> = {};
            await Promise.all(data.map(async (r) => {
                statusMap[r.id] = await getLikeStatus(r.id);
            }));
            setLikedRecipes(statusMap);
        } catch (error) {
            console.error('Failed to load showcase:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (recipeId: string) => {
        try {
            const isLikedNow = await toggleLike(recipeId);
            setLikedRecipes(prev => ({ ...prev, [recipeId]: isLikedNow }));

            // Update recipe like count in the list
            const updateList = (list: Recipe[]) => list.map(r => {
                if (r.id === recipeId) {
                    const currentCount = r.likeCount || 0;
                    return { ...r, likeCount: isLikedNow ? currentCount + 1 : Math.max(0, currentCount - 1) };
                }
                return r;
            });

            setRecipes(prev => updateList(prev));
        } catch (error: any) {
            Alert.alert('エラー', 'いいねの更新に失敗しました。ログインしているか確認してください。');
        }
    };

    const handleCategorySelect = (categoryId: string | null) => {
        setSelectedCategoryId(categoryId);
        setSearchQuery(''); // Clear search when picking a category for focus
    };

    const getFilteredRecipes = () => {
        let results = recipes;

        // 1. Category Filter (only if no search query OR if searching within category)
        // If there's a search query, we show global results by default unless we want strict category search.
        // Let's go with: if category is selected, search within it. If not, global search.
        if (selectedCategoryId !== null) {
            results = results.filter(r => {
                if (selectedCategoryId === 'others') return r.category === 'others' || !r.category;
                return r.category === selectedCategoryId;
            });
        }

        // 2. Text Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(r => 
                r.name.toLowerCase().includes(query) || 
                (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
            );
        }

        return results;
    };

    const filteredRecipes = getFilteredRecipes();
    const isSearching = searchQuery.trim().length > 0;

    const renderRecipeCard = ({ item }: { item: Recipe }) => {
        const category = getCategoryById(item.category || 'others');
        const isLiked = likedRecipes[item.id] || false;
        const likeCount = item.likeCount || 0;

        return (
            <Card
                style={styles.recipeCard}
                elevation={1}
                onPress={() => {
                    navigation.navigate('RecipeDetail', {
                        recipeId: item.id,
                        recipeName: item.name,
                        fromShowcase: true
                    });
                }}
            >
                <View style={styles.horizontalContainer}>
                    <Image
                        source={{ uri: item.imageUrl || getDefaultImageForCategory(item.category || 'others') }}
                        style={styles.sideImage}
                    />
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: `${category.color}10`, borderColor: `${category.color}10` }]}>
                                <MaterialCommunityIcons name={category.icon as any} size={20} color={category.color} />
                            </View>
                            <View style={styles.titleContainer}>
                                <Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.metaRow}>
                                    <MaterialCommunityIcons name="calendar-clock" size={12} color="#8D6E63" />
                                    <Text style={styles.recipeDate}>
                                        {new Date(item.latestVersionDate || item.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.actionsColumn}>
                                <TouchableOpacity
                                    style={styles.likeButton}
                                    onPress={(e) => {
                                        handleLike(item.id);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={isLiked ? "heart" : "heart-outline"}
                                        size={20}
                                        color={isLiked ? "#E91E63" : "#8D6E63"}
                                    />
                                    {likeCount > 0 && (
                                        <Text style={[styles.likeCountText, isLiked && { color: "#E91E63" }]}>
                                            {likeCount}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Card>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color="#C5A059" size="large" />
                <Text style={{ marginTop: 12, color: '#8D6E63' }}>研究成果を読み込み中...</Text>
            </View>
        );
    }

    if (showLogin) {
        return <LoginScreen onClose={() => setShowLogin(false)} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <IconButton
                    icon={(selectedCategoryId || isSearching) ? "chevron-left" : "arrow-left"}
                    onPress={() => {
                        if (isSearching) {
                            setSearchQuery('');
                        } else if (selectedCategoryId) {
                            handleCategorySelect(null);
                        } else {
                            navigation.goBack();
                        }
                    }}
                    iconColor="#3E2723"
                />
                <Text style={styles.headerTitle}>
                    {isSearching ? '検索結果' : (selectedCategoryId ? getCategoryById(selectedCategoryId).name : '黄金比ショーケース')}
                </Text>
                <View style={{ flex: 1 }} />
                <Button
                    mode="text"
                    icon={auth.currentUser?.isAnonymous ? "account-circle-outline" : "account-check"}
                    onPress={() => setShowLogin(true)}
                    textColor={theme.colors.primary}
                    labelStyle={{ fontWeight: 'bold', fontSize: 13 }}
                >
                    {auth.currentUser?.isAnonymous ? "ログイン" : "プロフィール"}
                </Button>
            </View>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="名前やタグで検索"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    iconColor={theme.colors.primary}
                    elevation={1}
                />
            </View>

            {selectedCategoryId === null && !isSearching ? (
                // --- LEVEL 1: FOLDER GRID ---
                <ScrollView contentContainerStyle={styles.folderGridContent}>
                    <View style={styles.introSection}>
                        <View style={styles.introBadge}>
                            <MaterialCommunityIcons name="auto-fix" size={16} color="#FFF" />
                            <Text style={styles.introBadgeText}>Research Results</Text>
                        </View>
                        <Text style={styles.introTitle}>比率が導き出す「究極の一皿」</Text>
                        <Text style={styles.introText}>
                            研究者たちが公開した「失敗しない黄金比」。
                            比率をチェックして、あなたの料理に取り入れましょう。
                        </Text>
                    </View>

                    <Text style={styles.gridTitle}>カテゴリー (フォルダ)</Text>
                    <View style={styles.folderGrid}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => handleCategorySelect(cat.id)}
                                style={[styles.gridFolderItem, { width: (width - 48) / 2 }]}
                            >
                                <Surface style={[styles.gridFolderIconBg, { backgroundColor: `${cat.color}10` }]} elevation={1}>
                                    <MaterialCommunityIcons name={cat.icon as any} size={36} color={cat.color} />
                                </Surface>
                                <Text style={styles.gridFolderLabel}>{cat.name}</Text>
                                <Text style={styles.gridFolderCount}>
                                    {recipes.filter(r => {
                                        if (cat.id === 'others') return r.category === 'others' || !r.category;
                                        return r.category === cat.id;
                                    }).length} 研究成果
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                // --- LEVEL 2: RECIPE LIST ---
                <FlatList
                    data={filteredRecipes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecipeCard}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={() => (
                        <View style={styles.listHeader}>
                            {(selectedCategoryId && !isSearching) ? (
                                <TouchableOpacity
                                    style={styles.backToFolders}
                                    onPress={() => handleCategorySelect(null)}
                                >
                                    <MaterialCommunityIcons name="folder-outline" size={16} color="#8D6E63" />
                                    <Text style={styles.backToFoldersText}>フォルダ一覧に戻る</Text>
                                </TouchableOpacity>
                            ) : isSearching && (
                                <View style={styles.searchHeader}>
                                    <Text style={styles.searchResultCount}>{filteredRecipes.length}件の見つかった研究</Text>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.centered}>
                            <MaterialCommunityIcons name={isSearching ? "magnify-close" : "book-open-variant"} size={48} color="#D7CCC8" />
                            <Text style={{ color: '#8D6E63', marginTop: 12, textAlign: 'center' }}>
                                {isSearching ? `「${searchQuery}」に一致する\nレシピは見つかりませんでした` : "このカテゴリーにはまだ公開レシピがありません"}
                            </Text>
                            <Button
                                mode="text"
                                onPress={() => {
                                    setSearchQuery('');
                                    handleCategorySelect(null);
                                }}
                                style={{ marginTop: 16 }}
                            >
                                {isSearching ? "検索をクリア" : "他のフォルダを見る"}
                            </Button>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                                <Text style={styles.footerLinkText}>プライバシーポリシー</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerDivider}>|</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                                <Text style={styles.footerLinkText}>利用規約</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F7F2',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        justifyContent: 'flex-start',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#F9F7F2',
    },
    searchbar: {
        borderRadius: 16,
        backgroundColor: '#FFF',
    },
    searchHeader: {
        marginBottom: 8,
    },
    searchResultCount: {
        fontSize: 12,
        color: '#8D6E63',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3E2723',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    introSection: {
        padding: 24,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 24,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#F2EFE9',
        // Subtle soft shadow
        shadowColor: "#3E2723",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    introBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C5A059',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
    },
    introBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#3E2723',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#5D4037',
        opacity: 0.8,
    },
    listContent: {
        paddingBottom: 60,
    },
    recipeCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#FFF',
        overflow: 'hidden',
    },
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 100,
    },
    sideImage: {
        width: 100,
        height: 100,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 10,
    },
    recipeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3E2723',
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.7,
    },
    recipeDate: {
        fontSize: 10,
        color: '#8D6E63',
        marginLeft: 4,
        fontWeight: '500',
    },
    badge: {
        backgroundColor: '#FDF7E1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#C5A059',
        textTransform: 'uppercase',
    },
    folderLabelActive: {
        color: '#3E2723',
    },
    folderGridContent: {
        paddingBottom: 40,
    },
    gridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3E2723',
        marginLeft: 24,
        marginBottom: 16,
    },
    folderGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    gridFolderItem: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F2EFE9',
        // Shadow
        shadowColor: "#3E2723",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    gridFolderIconBg: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    gridFolderLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#3E2723',
        textAlign: 'center',
        marginBottom: 4,
    },
    gridFolderCount: {
        fontSize: 10,
        color: '#8D6E63',
        fontWeight: '600',
        opacity: 0.7,
    },
    listHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },
    backToFolders: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.8,
    },
    backToFoldersText: {
        fontSize: 12,
        color: '#8D6E63',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    actionsColumn: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    likeButton: {
        alignItems: 'center',
        padding: 4,
    },
    likeCountText: {
        fontSize: 12,
        color: '#8D6E63',
        fontWeight: 'bold',
        marginTop: 2,
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
        paddingBottom: 60,
        opacity: 0.6,
    },
    footerLinkText: {
        fontSize: 12,
        color: '#8C7853',
        textDecorationLine: 'underline',
    },
    footerDivider: {
        marginHorizontal: 12,
        fontSize: 12,
        color: '#8C7853',
    },
});

export default ShowcaseScreen;
