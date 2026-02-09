import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Text, Button, IconButton, Card, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { getAvailablePackages, purchasePackage, restorePurchases } from '../store/subscription';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallProps {
    onClose: () => void;
    reason?: string;
}

export default function Paywall({ onClose, reason }: PaywallProps) {
    const theme = useTheme();
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        setLoading(true);
        const available = await getAvailablePackages();
        setPackages(available);
        setLoading(false);
    };

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setPurchasing(true);
        const success = await purchasePackage(pkg);
        setPurchasing(false);
        if (success) {
            Alert.alert('ありがとうございます！', 'プレミアムプランが有効になりました。');
            onClose();
        } else {
            Alert.alert('エラー', '購入処理を完了できませんでした。');
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        const success = await restorePurchases();
        setPurchasing(false);
        if (success) {
            Alert.alert('復元完了', '以前の購入情報を復元しました。');
            onClose();
        } else {
            Alert.alert('情報', '有効な購入情報が見つかりませんでした。');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <IconButton icon="close" onPress={onClose} style={styles.closeButton} />
                <Surface style={styles.crownContainer} elevation={0}>
                    <IconButton icon="crown" iconColor="#B8860B" size={40} />
                </Surface>
                <Text variant="headlineMedium" style={styles.title}>プレミアムプラン</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    さらなる「黄金比」の探求へ
                </Text>
            </View>

            {reason && (
                <View style={styles.reasonBox}>
                    <IconButton icon="alert-circle-outline" iconColor="#C62828" size={20} />
                    <Text style={styles.reasonText}>{reason}</Text>
                </View>
            )}

            <View style={styles.features}>
                <FeatureItem
                    icon="infinity"
                    title="無制限のレシピ・バージョン"
                    description="レシピ5個、バージョン10個の制限を解除し、一生涯の研究を記録できます。"
                />
                <FeatureItem
                    icon="calculator"
                    title="黄金比スケーラー"
                    description="入力した分量から最適な配合を自動計算。分量調節が劇的に楽になります。"
                />
                <FeatureItem
                    icon="ads-off"
                    title="広告なし"
                    description="研究を邪魔する広告を一切表示しません。"
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginVertical: 20 }} />
            ) : Platform.OS === 'web' ? (
                <Card style={styles.buyCard} elevation={2}>
                    <Text variant="titleMedium" style={styles.planName}>スタンダードプラン</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>¥480</Text>
                        <Text style={styles.period}>/ 月</Text>
                    </View>
                    <Button
                        mode="contained"
                        style={styles.buyButton}
                        onPress={() => alert('Web版の決済（Stripe）は準備中です。アプリ版からご購入いただけます。')}
                    >
                        アップグレード (準備中)
                    </Button>
                </Card>
            ) : (
                packages.map((pkg) => (
                    <Card key={pkg.identifier} style={styles.buyCard} elevation={2}>
                        <Text variant="titleMedium" style={styles.planName}>{pkg.product.title}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>{pkg.product.priceString}</Text>
                            <Text style={styles.period}> / {pkg.packageType === 'MONTHLY' ? '月' : '年'}</Text>
                        </View>
                        <Button
                            mode="contained"
                            disabled={purchasing}
                            loading={purchasing}
                            style={styles.buyButton}
                            onPress={() => handlePurchase(pkg)}
                        >
                            アップグレード
                        </Button>
                        <Text style={styles.footerNote}>{pkg.product.description}</Text>
                    </Card>
                ))
            )}

            <View style={styles.footerActions}>
                <Button mode="text" onPress={handleRestore} disabled={purchasing} textColor="#B8860B">
                    購入情報を復元
                </Button>
                <Button mode="text" onPress={onClose} disabled={purchasing} textColor="#888">
                    今はフリープランを続ける
                </Button>
            </View>
        </ScrollView>
    );
}

function FeatureItem({ icon, title, description }: { icon: string, title: string, description: string }) {
    const theme = useTheme();
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <IconButton icon={icon} iconColor={theme.colors.primary} size={24} />
            </View>
            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{description}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    closeButton: {
        position: 'absolute',
        right: -12,
        top: -16,
    },
    crownContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFDE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        color: '#4E342E',
    },
    subtitle: {
        color: '#8C7853',
        marginTop: 4,
    },
    reasonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    reasonText: {
        color: '#C62828',
        flex: 1,
        fontSize: 13,
        fontWeight: 'bold',
    },
    features: {
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 15,
        marginBottom: 2,
    },
    featureDesc: {
        color: '#777',
        fontSize: 13,
        lineHeight: 18,
    },
    buyCard: {
        backgroundColor: '#4E342E',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    planName: {
        color: '#FFF8E1',
        marginBottom: 8,
        textAlign: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    period: {
        color: '#FFECB3',
        fontSize: 16,
        marginLeft: 4,
    },
    buyButton: {
        width: '100%',
        backgroundColor: '#B8860B',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
    },
    footerNote: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        marginTop: 12,
        textAlign: 'center',
    },
    footerActions: {
        alignItems: 'center',
        marginTop: 8,
    }
});
