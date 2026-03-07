import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import {
    Text,
    Card,
    IconButton,
    useTheme,
    Surface,
    Button
} from 'react-native-paper';
import { getAllPublicRecipes } from '../store/repository';
import { Recipe } from '../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import { ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const ShowcaseScreen = ({ navigation }: any) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        loadPublicRecipes();
    }, []);

    const loadPublicRecipes = async () => {
        try {
            const data = await getAllPublicRecipes();
            setRecipes(data);
            setFilteredRecipes(data);
        } catch (error) {
            console.error('Failed to load showcase:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (categoryId: string | null) => {
        setSelectedCategoryId(categoryId);
        if (categoryId === null) {
            setFilteredRecipes(recipes);
        } else {
            setFilteredRecipes(recipes.filter(r => {
                if (categoryId === 'others') {
                    return r.category === 'others' || !r.category;
                }
                return r.category === categoryId;
            }));
        }
    };

    const renderRecipeCard = ({ item }: { item: Recipe }) => {
        const category = getCategoryById(item.category || 'others');
        return (
            <Card
                style={styles.recipeCard}
                elevation={2}
                onPress={() => {
                    navigation.navigate('RecipeDetail', {
                        recipeId: item.id,
                        recipeName: item.name,
                        fromShowcase: true
                    });
                }}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: `${category.color}10`, borderColor: `${category.color}20` }]}>
                            <MaterialCommunityIcons name={category.icon as any} size={24} color={category.color} />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="folder-outline" size={14} color="#8D6E63" />
                                <Text style={styles.recipeDate}>{category.name}</Text>
                                <View style={{ width: 8 }} />
                                <MaterialCommunityIcons name="calendar-clock" size={14} color="#8D6E63" />
                                <Text style={styles.recipeDate}>
                                    {new Date(item.latestVersionDate || item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Public</Text>
                        </View>
                    </View>
                </Card.Content>
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <IconButton
                    icon={selectedCategoryId ? "chevron-left" : "arrow-left"}
                    onPress={() => {
                        if (selectedCategoryId) {
                            handleCategorySelect(null);
                        } else {
                            navigation.goBack();
                        }
                    }}
                    iconColor="#3E2723"
                />
                <Text style={styles.headerTitle}>
                    {selectedCategoryId ? getCategoryById(selectedCategoryId).name : '黄金比ショーケース'}
                </Text>
            </View>

            {selectedCategoryId === null ? (
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
                                style={styles.gridFolderItem}
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
                            <TouchableOpacity
                                style={styles.backToFolders}
                                onPress={() => handleCategorySelect(null)}
                            >
                                <MaterialCommunityIcons name="folder-outline" size={16} color="#8D6E63" />
                                <Text style={styles.backToFoldersText}>フォルダ一覧に戻る</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.centered}>
                            <MaterialCommunityIcons name="book-open-variant" size={48} color="#D7CCC8" />
                            <Text style={{ color: '#8D6E63', marginTop: 12 }}>このカテゴリーにはまだ公開レシピがありません</Text>
                            <Button
                                mode="text"
                                onPress={() => handleCategorySelect(null)}
                                style={{ marginTop: 16 }}
                            >
                                他のフォルダを見る
                            </Button>
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
        backgroundColor: '#F9F7F2',
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
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F2EFE9',
    },
    cardContent: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#FDFCF0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FDF7E1',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    recipeName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#3E2723',
        letterSpacing: -0.2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        opacity: 0.7,
    },
    recipeDate: {
        fontSize: 12,
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
        width: (width - 48) / 2, // 2 columns
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
});

export default ShowcaseScreen;
