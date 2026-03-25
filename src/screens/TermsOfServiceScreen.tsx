import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Text, Appbar, useTheme, Card } from 'react-native-paper';

const TermsOfServiceScreen = ({ navigation }: any) => {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="利用規約" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card} elevation={0}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>1. はじめに</Text>
                        <Text style={styles.text}>
                            本利用規約は、当アプリ「黄金比のレシピ帳」の利用者と開発者の間の義務関係を定めるものです。本アプリを利用することで、本規約に同意したものとみなされます。
                        </Text>

                        <Text style={styles.sectionTitle}>2. サービスの提供目的</Text>
                        <Text style={styles.text}>
                            本アプリは、ユーザーが料理のレシピや調味料の比率を記録・管理することを目的としたツールです。
                        </Text>

                        <Text style={styles.sectionTitle}>3. 禁止事項</Text>
                        <Text style={styles.text}>ユーザーは、以下の行為を行ってはなりません。</Text>
                        <Text style={styles.listItem}>• 公序良俗に反する内容の投稿</Text>
                        <Text style={styles.listItem}>• 他者の著作権や知的財産権を侵害する行為</Text>
                        <Text style={styles.listItem}>• サーバーに過度な負荷をかける行為</Text>
                        <Text style={styles.listItem}>• その他、開発者が不適切と判断する行為</Text>

                        <Text style={styles.sectionTitle}>4. 著作権について</Text>
                        <Text style={styles.text}>
                            ユーザーが本アプリに投稿したレシピや画像の著作権は、原則として投稿したユーザーに帰属します。ただし、ショーケースに公開されたコンテンツについては、本アプリのプロモーション目的で開発者が無償で引用・利用できるものとします。
                        </Text>

                        <Text style={styles.sectionTitle}>5. サービスの変更・停止</Text>
                        <Text style={styles.text}>
                            開発者は、予告なく本アプリの内容を変更、または提供を停止・終了することができるものとします。これによって生じた不利益について、一切の責任を負いません。
                        </Text>

                        <Text style={styles.sectionTitle}>6. 免責事項</Text>
                        <Text style={styles.text}>
                            本アプリは、現状有姿で提供されるものであり、情報の正確性や有用性を保証するものではありません。本アプリの利用に関して発生したいかなる損害についても、開発者は責任を負いかねます。
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

export default TermsOfServiceScreen;
