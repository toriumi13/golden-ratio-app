import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Text, Appbar, useTheme, Card } from 'react-native-paper';

const PrivacyPolicyScreen = ({ navigation }: any) => {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="プライバシーポリシー" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card} elevation={0}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>1. 情報の収集について</Text>
                        <Text style={styles.text}>
                            当アプリ「黄金比のレシピ帳」では、サービスの向上、利用状況の分析、および広告配信のために以下の情報を収集する場合があります。
                        </Text>
                        <Text style={styles.listItem}>• アプリの利用履歴（表示されたレシピ、使用された機能など）</Text>
                        <Text style={styles.listItem}>• 端末情報（OSの種類、モデル名など）</Text>
                        <Text style={styles.listItem}>• 広告識別子（IDFA/AAIDなど）</Text>

                        <Text style={styles.sectionTitle}>2. 広告の配信について</Text>
                        <Text style={styles.text}>
                            当アプリでは、第三者配信事業者（Google AdSense / AdMob）が提供する広告を掲載しています。これらの配信事業者は、ユーザーの興味に応じたパーソナライズ広告を表示するために、クッキー（Cookie）や広告識別子を使用することがあります。
                        </Text>
                        <Text style={styles.text}>
                            Googleによる広告設定の管理方法については、Googleの「広告設定」ページ（https://adssettings.google.com/）をご覧ください。
                        </Text>

                        <Text style={styles.sectionTitle}>3. 解析ツールの利用について</Text>
                        <Text style={styles.text}>
                            当アプリでは、利用状況の分析のために Google Analytics / Firebase を利用しています。これらにより収集されるデータは統計的な情報として利用され、個人を特定するものではありません。
                        </Text>

                        <Text style={styles.sectionTitle}>4. 免責事項</Text>
                        <Text style={styles.text}>
                            当アプリに掲載されている情報やレシピの利用によって生じた損害等について、開発者は一切の責任を負いません。
                        </Text>

                        <Text style={styles.sectionTitle}>5. お問い合わせ</Text>
                        <Text style={styles.text}>
                            プライバシーポリシーに関するお問い合わせは、アプリ内の「お問い合わせ」または開発者の連絡先までお願いいたします。
                        </Text>

                        <Text style={styles.footerDate}>策定日: 2024年3月25日</Text>
                    </Card.Content>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F7F2',
    },
    appbar: {
        backgroundColor: '#FFF',
    },
    appbarTitle: {
        fontWeight: 'bold',
        color: '#3E2723',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
        marginTop: 20,
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        lineHeight: 22,
        color: '#5D4037',
        marginBottom: 12,
    },
    listItem: {
        fontSize: 14,
        lineHeight: 22,
        color: '#5D4037',
        marginLeft: 8,
        marginBottom: 4,
    },
    footerDate: {
        fontSize: 12,
        color: '#A1887F',
        marginTop: 32,
        textAlign: 'right',
    },
});

export default PrivacyPolicyScreen;
