import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Alert, Platform } from 'react-native';
import { Appbar, Card, FAB, Text, useTheme, IconButton, Surface, Button, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Recipe } from '../types';
import { getRecipes, createRecipe, deleteRecipe } from '../store/repository';
import { seedDemoData } from '../store/seed';
import { logout } from '../store/auth';
import LoginScreen from './LoginScreen';
import Paywall from '../components/Paywall';
import { auth } from '../store/firebase';
import { getUserProfile, UserProfile } from '../store/repository';
import { presentPaywall, presentCustomerCenter } from '../store/subscription';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isSeeding, setIsSeeding] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallReason, setPaywallReason] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const navigation = useNavigation<any>();
    const theme = useTheme();


    const loadRecipes = async () => {
        const data = await getRecipes();
        setRecipes(data);
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
                <Appbar.Action
                    icon={auth.currentUser?.isAnonymous ? "account-circle-outline" : "account-check"}
                    onPress={() => setShowLogin(true)}
                />
            </Appbar.Header>

            {recipes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <IconButton icon="book-open-variant" size={64} iconColor="#DDD" />
                    <Text variant="headlineSmall" style={styles.emptyTitle}>研究ノートはまだありません</Text>
                    <Text variant="bodyMedium" style={styles.emptySubtitle}>
                        右下の「＋」ボタンから、あなただけの最高の配合の記録を始めましょう。
                    </Text>
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
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={recipes}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRecipeCard}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
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
            )}

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
                onPress={handleAddRecipe}
                label="新しいレシピ"
            />

            <Portal>
                <Dialog visible={showLogin} onDismiss={() => setShowLogin(false)} style={styles.loginDialog}>
                    <LoginScreen onClose={() => setShowLogin(false)} />
                </Dialog>
                <Dialog visible={showPaywall} onDismiss={() => setShowPaywall(false)} style={styles.loginDialog}>
                    <Paywall onClose={() => setShowPaywall(false)} reason={paywallReason || undefined} />
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
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EFEBE9',
        overflow: 'hidden',
    },
    cardContent: {
        paddingTop: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FDFCF0',
        borderWidth: 1,
        borderColor: '#F0E68C',
    },
    iconInner: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    versionBadge: {
        backgroundColor: '#FDF7E1',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFECB3',
    },
    versionBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#B8860B',
    },
    recipeName: {
        fontWeight: 'bold',
        color: '#4E342E',
        fontSize: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#FDFCF0',
        paddingTop: 12,
        marginTop: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        margin: 0,
        padding: 0,
        width: 20,
    },
    statText: {
        fontSize: 12,
        color: '#8C7853',
    },
    dateText: {
        fontSize: 11,
        color: '#A1887F',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyTitle: {
        color: '#4E342E',
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
        fontSize: 22,
    },
    emptySubtitle: {
        color: '#8C7853',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        fontSize: 15,
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
        borderRadius: 18,
        elevation: 4,
    },
    loginDialog: {
        backgroundColor: '#fff',
        borderRadius: 28,
        overflow: 'hidden',
    },
    premiumPromoCard: {
        backgroundColor: '#4E342E', // Dark Espresso base
        margin: 4,
        borderRadius: 20,
        overflow: 'hidden',
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
});
