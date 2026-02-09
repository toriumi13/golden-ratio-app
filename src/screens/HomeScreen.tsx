import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Appbar, Card, FAB, Text, useTheme, IconButton, Surface, Button, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Recipe } from '../types';
import { getRecipes, createRecipe } from '../store/repository';
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
                        <View style={styles.versionBadge}>
                            <Text style={styles.versionBadgeText}>Ver {item.latestVersionNumber || '1.0'}</Text>
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
                        <Card style={styles.adPlaceholder} elevation={0}>
                            <View style={styles.adContent}>
                                <Text style={styles.adLabel}>SPONSORED</Text>
                                <Text style={styles.adTitle}>こだわりを制限なく記録しよう</Text>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => {
                                        setPaywallReason(null);
                                        setShowPaywall(true);
                                    }}
                                    labelStyle={{ fontSize: 11 }}
                                >
                                    広告を削除する
                                </Button>
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardContent: {
        paddingTop: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFF8E1',
    },
    iconInner: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    versionBadge: {
        backgroundColor: '#EFEBE9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    versionBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    recipeName: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
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
        color: '#666',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: '#8C7853',
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    },
    loginDialog: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
    },
    adPlaceholder: {
        backgroundColor: '#EEEEEE',
        margin: 16,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    adContent: {
        alignItems: 'center',
    },
    adLabel: {
        fontSize: 10,
        color: '#999',
        letterSpacing: 1,
        marginBottom: 4,
    },
    adTitle: {
        fontSize: 13,
        color: '#666',
        fontWeight: 'bold',
    },
});
