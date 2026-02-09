import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, IconButton, useTheme, Card, Surface } from 'react-native-paper';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import {
    loginWithGoogle,
    loginWithEmail,
    linkUserWithEmail,
    loginWithGoogleCredential,
    linkWithGoogleCredential,
    logout,
    signUpWithEmail
} from '../store/auth';
import { auth } from '../store/firebase';

interface LoginScreenProps {
    onClose: () => void;
}

const GOOGLE_CONFIG = {
    iosClientId: '105811242629-dq1p4blfl6ij29p0roggoq6kkh481ava.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: '105811242629-qburn2r5b8l14attj7p1fi3l4pckp4o6.apps.googleusercontent.com',
};

export default function LoginScreen({ onClose }: LoginScreenProps) {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [request, response, promptAsync] = Google.useAuthRequest({
        ...GOOGLE_CONFIG,
        clientId: GOOGLE_CONFIG.webClientId,
        redirectUri: AuthSession.makeRedirectUri(),
    });

    const isAnonymous = auth.currentUser?.isAnonymous;

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleCredentialLogin(id_token);
        } else if (response?.type === 'error') {
            setError('Googleログイン中にエラーが発生しました');
        }
    }, [response]);

    const handleGoogleCredentialLogin = async (idToken: string) => {
        setLoading(true);
        try {
            if (isAnonymous) {
                await linkWithGoogleCredential(idToken);
            } else {
                await loginWithGoogleCredential(idToken);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || '連携に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const [loginMode, setLoginMode] = useState('login'); // 'login' or 'signup'

    const handleEmailAction = async () => {
        if (!email || !password) {
            setError('メールアドレスとパスワードを入力してください');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (loginMode === 'signup') {
                if (isAnonymous) {
                    await linkUserWithEmail(email, password);
                } else {
                    await signUpWithEmail(email, password);
                }
            } else {
                await loginWithEmail(email, password);
            }
            onClose();
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('このメールアドレスは既に登録されています。「ログイン」に切り替えてお試しください。');
            } else {
                setError(err.message || '認証に失敗しました');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginPress = async () => {
        setError(null);
        if (Platform.OS === 'web') {
            setLoading(true);
            try {
                await loginWithGoogle();
                onClose();
            } catch (err: any) {
                setError(err.message || 'Googleログインに失敗しました');
            } finally {
                setLoading(false);
            }
        } else {
            promptAsync();
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, !auth.currentUser && { paddingTop: 60 }]}>
            <View style={styles.header}>
                {auth.currentUser && (
                    <IconButton icon="close" onPress={onClose} style={styles.closeButton} />
                )}
                <Text variant="headlineMedium" style={styles.title}>
                    {auth.currentUser ? 'アカウント設定' : '黄金比のレシピ帳'}
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    {auth.currentUser
                        ? (isAnonymous ? 'アカウントを連携してデータを永続的に保存しましょう。' : '全ての研究データは安全に同期されています。')
                        : '最高のレシピ、その「究極の一杯」を追い求めるために。'}
                </Text>
            </View>

            {!auth.currentUser && (
                <View style={styles.demoSection}>
                    <View style={styles.previewLabelContainer}>
                        <IconButton icon="play-circle-outline" size={16} iconColor="#B8860B" />
                        <Text variant="labelMedium" style={styles.demoLabel}>アプリの使用イメージ</Text>
                    </View>

                    <Card style={styles.demoCard} elevation={3}>
                        <Card.Content>
                            <View style={styles.demoCardHeader}>
                                <Text variant="titleLarge" style={styles.demoRecipeName}>秘伝の醤油ラーメンスープ</Text>
                                <Surface style={styles.demoBadge} elevation={0}>
                                    <Text style={styles.demoBadgeText}>Ver 4.1</Text>
                                </Surface>
                            </View>

                            <View style={styles.timeline}>
                                <View style={styles.timelineItem}>
                                    <View style={styles.timelineDot} />
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineTitle}>Ver 4.1 (今回)</Text>
                                        <Text style={styles.timelineDesc}>醤油を「生醤油」に変更。香りが劇的に改善。</Text>
                                    </View>
                                </View>
                                <View style={styles.timelineLine} />
                                <View style={styles.timelineItem}>
                                    <View style={[styles.timelineDot, { backgroundColor: '#BCAAA4' }]} />
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineTitle, { color: '#888' }]}>Ver 3.5 (2日前)</Text>
                                        <Text style={[styles.timelineDesc, { color: '#AAA' }]}>ラードの量を5g減らして後味をスッキリさせた。</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.demoFooter}>
                                <View style={styles.demoStat}>
                                    <IconButton icon="flask-outline" size={16} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                                    <Text style={styles.demoStatText}>合計 24 回の研究記録</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                    <Text variant="bodySmall" style={styles.demoNote}>
                        一歩ずつ、「理想の味」へ。
                    </Text>
                </View>
            )}

            <View style={styles.currentUserInfo}>
                <IconButton icon="account-circle" size={24} iconColor={theme.colors.primary} />
                <View>
                    <Text variant="labelLarge" style={{ color: '#8C7853', fontSize: 11 }}>現在の状態</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#4E342E' }}>
                        {auth.currentUser?.email || (isAnonymous ? 'ゲスト（未連携）' : 'ゲスト（未ログイン）')}
                    </Text>
                </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {auth.currentUser && !isAnonymous ? (
                <View style={styles.loggedInSection}>
                    <Button
                        mode="contained"
                        onPress={async () => {
                            await logout();
                            onClose();
                        }}
                        icon="logout"
                        style={styles.logoutButton}
                    >
                        ログアウト
                    </Button>
                    <Text variant="bodySmall" style={styles.footerNote}>
                        ログアウトすると、次回のログインまでクラウド上のレシピにはアクセスできなくなります。
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.section}>
                        <Button
                            mode="outlined"
                            icon="google"
                            onPress={handleGoogleLoginPress}
                            loading={loading}
                            disabled={loading || (Platform.OS !== 'web' && !request)}
                            style={styles.googleButton}
                            labelStyle={styles.googleLabel}
                        >
                            Googleでログイン
                        </Button>
                    </View>

                    <View style={styles.dividerContainer}>
                        <Divider style={styles.divider} />
                        <Text style={styles.dividerText}>または</Text>
                        <Divider style={styles.divider} />
                    </View>

                    <View style={styles.section}>
                        <TextInput
                            label="メールアドレス"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />
                        <TextInput
                            label="パスワード"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.input}
                        />
                        <Button
                            mode="contained"
                            onPress={handleEmailAction}
                            loading={loading}
                            disabled={loading}
                            style={styles.mainButton}
                        >
                            {loginMode === 'signup' ? '新規アカウント作成' : 'ログイン'}
                        </Button>
                        <Button
                            mode="text"
                            onPress={() => setLoginMode(loginMode === 'signup' ? 'login' : 'signup')}
                            style={styles.toggleButton}
                        >
                            {loginMode === 'signup' ? '既にアカウントをお持ちの場合：ログイン' : '新しくアカウントを作成する'}
                        </Button>
                    </View>

                    <Text variant="bodySmall" style={styles.footerNote}>
                        アカウントを作成すると、別の端末からでもあなたの「黄金比」にアクセスできるようになります。
                    </Text>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 16,
    },
    closeButton: {
        position: 'absolute',
        right: -12,
        top: -16,
    },
    title: {
        fontWeight: 'bold',
        color: '#4E342E',
        marginBottom: 8,
    },
    subtitle: {
        color: '#8C7853',
        textAlign: 'center',
    },
    currentUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 10,
        borderRadius: 12,
        width: '100%',
        marginBottom: 24,
    },
    section: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    googleButton: {
        borderColor: '#E0E0E0',
        borderRadius: 8,
        height: 48,
        justifyContent: 'center',
    },
    googleLabel: {
        color: '#666',
        fontSize: 16,
    },
    mainButton: {
        marginTop: 8,
        borderRadius: 8,
        height: 48,
        justifyContent: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    divider: {
        flex: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 12,
    },
    errorText: {
        color: '#C62828',
        textAlign: 'center',
        marginBottom: 16,
        backgroundColor: '#FFEBEE',
        padding: 8,
        borderRadius: 4,
    },
    footerNote: {
        textAlign: 'center',
        color: '#999',
        marginTop: 16,
        lineHeight: 18,
    },
    clientNote: {
        color: '#999',
        fontSize: 10,
        textAlign: 'center',
    },
    toggleButton: {
        marginTop: 8,
    },
    loggedInSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: 16,
    },
    logoutButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        backgroundColor: '#C62828',
    },
    demoSection: {
        marginBottom: 24,
        padding: 4,
    },
    previewLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'center',
    },
    demoLabel: {
        color: '#B8860B',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    demoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFECB3',
        paddingVertical: 8,
    },
    demoCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    demoBadge: {
        backgroundColor: '#4E342E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    demoBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    demoRecipeName: {
        color: '#3E2723',
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    timeline: {
        marginBottom: 20,
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#B8860B',
        marginTop: 6,
    },
    timelineLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 4,
        marginVertical: 2,
    },
    timelineContent: {
        marginLeft: 16,
    },
    timelineTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4E342E',
    },
    timelineDesc: {
        fontSize: 12,
        color: '#6D4C41',
        marginTop: 2,
    },
    demoFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        paddingTop: 12,
    },
    demoStat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    demoStatText: {
        fontSize: 12,
        color: '#8C7853',
        fontWeight: 'bold',
    },
    demoNote: {
        color: '#9E9E9E',
        fontSize: 12,
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
