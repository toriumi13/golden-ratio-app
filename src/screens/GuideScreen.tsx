import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Image } from 'react-native';
import { Text, Appbar, Card, useTheme, IconButton, List } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const GuideScreen = ({ navigation }: any) => {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="アプリの使い方ガイド" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.hero}>
                    <MaterialCommunityIcons name="auto-fix" size={64} color="#C5A059" />
                    <Text style={styles.heroTitle}>究極の比率を、あなたの手に。</Text>
                    <Text style={styles.heroSubtitle}>
                        黄金比のレシピ帳は、分量ではなく「比率」を記録し、
                        いつでも理想の味を再現するための研究ノートです。
                    </Text>
                </View>

                {/* Section 1: The Concept */}
                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="1. 黄金比とは？"
                        titleStyle={styles.cardTitle}
                        left={(props) => <MaterialCommunityIcons name="scale-balance" size={24} color="#C5A059" />}
                    />
                    <Card.Content>
                        <Text style={styles.text}>
                            料理の味の決め手は、絶対的な分量（gやml）ではなく、調味料同士の「比率」にあります。
                        </Text>
                        <View style={styles.exampleRatio}>
                            <View style={[styles.ratioBar, { flex: 2, backgroundColor: '#E67E22' }]}>
                                <Text style={styles.ratioText}>醤油 2</Text>
                            </View>
                            <View style={[styles.ratioBar, { flex: 1, backgroundColor: '#F1C40F' }]}>
                                <Text style={styles.ratioText}>みりん 1</Text>
                            </View>
                            <View style={[styles.ratioBar, { flex: 1, backgroundColor: '#3498DB' }]}>
                                <Text style={styles.ratioText}>酒 1</Text>
                            </View>
                        </View>
                        <Text style={styles.text}>
                            このアプリでは、材料を入力すると自動でこの「比率（バー）」が表示され、味のバランスを一目で確認できます。
                        </Text>
                    </Card.Content>
                </Card>

                {/* Section 2: Scaler */}
                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="2. 黄金比スケーラー"
                        titleStyle={styles.cardTitle}
                        left={(props) => <MaterialCommunityIcons name="calculator" size={24} color="#C5A059" />}
                    />
                    <Card.Content>
                        <Text style={styles.text}>
                            「今日は鶏肉が350gあるけど、他の調味料はどうすればいい？」
                        </Text>
                        <Text style={styles.text}>
                            そんな時は「黄金比スケーラー」をオンにして、メイン食材の分量を書き換えてください。
                            比率を維持したまま、他のすべての材料が自動で計算されます。
                        </Text>
                        <View style={styles.tipBox}>
                            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#856404" />
                            <Text style={styles.tipText}>
                                人数の増減ボタン（+/-）でも簡単に全体量を調整できます。
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Section 3: Versions */}
                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="3. 進化の記録（バージョン）"
                        titleStyle={styles.cardTitle}
                        left={(props) => <MaterialCommunityIcons name="history" size={24} color="#C5A059" />}
                    />
                    <Card.Content>
                        <Text style={styles.text}>
                            「少し甘すぎたから、次は砂糖を減らそう」
                        </Text>
                        <Text style={styles.text}>
                            レシピを直接書き換えるのではなく「新しいバージョン」を作成しましょう。
                            過去の配合と今の配合を比較（デルタ表示）し、どう味が進化したかを一目で追跡できます。
                        </Text>
                    </Card.Content>
                </Card>

                {/* Section 4: Showcase */}
                <Card style={styles.card} elevation={1}>
                    <Card.Title
                        title="4. ショーケースで共有"
                        titleStyle={styles.cardTitle}
                        left={(props) => <MaterialCommunityIcons name="share-variant" size={24} color="#C5A059" />}
                    />
                    <Card.Content>
                        <Text style={styles.text}>
                            完成した究極の比率は「公開」してショーケースに並べることができます。
                            他の研究者の比率を、自分のノートにインポートして試すことも可能です。
                        </Text>
                    </Card.Content>
                </Card>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        さあ、あなただけの究極のレシピを完成させましょう！
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.goBack()}
                        style={styles.startBtn}
                    >
                        研究を始める
                    </Button>
                </View>
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
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#3E2723',
        marginTop: 16,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#5D4037',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        opacity: 0.8,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F2EFE9',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E2723',
    },
    text: {
        fontSize: 14,
        lineHeight: 22,
        color: '#5D4037',
        marginBottom: 12,
    },
    exampleRatio: {
        flexDirection: 'row',
        height: 40,
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 16,
    },
    ratioBar: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratioText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tipBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFBD1',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        alignItems: 'center',
    },
    tipText: {
        fontSize: 12,
        color: '#856404',
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3E2723',
        marginBottom: 16,
    },
    startBtn: {
        borderRadius: 12,
        paddingHorizontal: 32,
        backgroundColor: '#C5A059',
    },
});

import { Button } from 'react-native-paper';

export default GuideScreen;
