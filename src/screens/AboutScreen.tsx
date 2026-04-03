import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Appbar, Surface, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const AboutScreen = ({ navigation }: any) => {
    const theme = useTheme();

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header elevated style={styles.header}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="このサイトについて" titleStyle={styles.headerTitle} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="flask-outline" size={48} color="#C5A059" />
                    </View>
                    <Text variant="headlineLarge" style={styles.title}>「究極の一杯」を、{"\n"}比率で解き明かす。</Text>
                    <Text variant="bodyLarge" style={styles.introText}>
                        料理の美味しさには、必ず理由があります。{"\n"}
                        それは、素材の組み合わせが織りなす「黄金比」です。
                    </Text>
                </View>

                <Surface style={styles.card} elevation={1}>
                    <Text variant="titleLarge" style={styles.cardTitle}>「黄金比のレシピ帳」のミッション</Text>
                    <Text variant="bodyMedium" style={styles.cardBody}>
                        私たちは、センスや勘に頼り切るのではなく、数値としての「比率」を記録し、改善していくプロセスこそが、料理を次のレベルへ引き上げると信じています。{"\n"}{"\n"}
                        昨日の味と、今日の味。何が違ったのか？{"\n"}
                        調味料の比率を一歩ずつ調整し、あなただけの「一生モノのレシピ」を完成させるための研究ノート、それがこのアプリです。
                    </Text>
                </Surface>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>比率がもたらす3つの価値</Text>
                    
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="repeat" size={24} color="#C5A059" />
                        <View style={styles.featureText}>
                            <Text variant="titleSmall" style={styles.featureTitle}>高い再現性</Text>
                            <Text variant="bodySmall" style={styles.featureDesc}>
                                「適量」や「少々」を卒業し、比率で管理することで、いつでもあの味を再現できるようになります。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="trending-up" size={24} color="#C5A059" />
                        <View style={styles.featureText}>
                            <Text variant="titleSmall" style={styles.featureTitle}>進化の可視化</Text>
                            <Text variant="bodySmall" style={styles.featureDesc}>
                                バージョン管理機能により、どの比率が自分の好みに近づいたのか、改良の歴史を振り返ることができます。
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="share-variant" size={24} color="#C5A059" />
                        <View style={styles.featureText}>
                            <Text variant="titleSmall" style={styles.featureTitle}>知恵の共有</Text>
                            <Text variant="bodySmall" style={styles.featureDesc}>
                                優れた比率は、文化としての知恵です。ショーケースを通じて、他の研究者の成功事例から学ぶことができます。
                            </Text>
                        </View>
                    </View>
                </View>

                <Surface style={[styles.card, { backgroundColor: '#4E342E' }]} elevation={2}>
                    <Text variant="titleLarge" style={[styles.cardTitle, { color: '#FFF' }]}>開発者より</Text>
                    <Text variant="bodyMedium" style={[styles.cardBody, { color: 'rgba(255,255,255,0.8)' }]}>
                        このアプリは、一人の料理好きの試行錯誤から始まりました。{"\n"}
                        「黄金比のレシピ帳」を通じて、皆様のキッチンがよりクリエイティブで、喜びに満ちた場所になることを願っています。
                    </Text>
                </Surface>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.copy}>© 2026 Golden Ratio App</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9F6' },
    header: { backgroundColor: '#FFF' },
    headerTitle: { fontWeight: 'bold', color: '#3E2723' },
    content: { padding: 24 },
    heroSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    title: { fontWeight: '900', color: '#3E2723', textAlign: 'center', lineHeight: 42, marginBottom: 16 },
    introText: { textAlign: 'center', color: '#8C7853', lineHeight: 24 },
    card: { padding: 24, borderRadius: 20, backgroundColor: '#FFF', marginBottom: 32 },
    cardTitle: { fontWeight: 'bold', color: '#3E2723', marginBottom: 12 },
    cardBody: { lineHeight: 22, color: '#5D4037' },
    section: { marginBottom: 32 },
    sectionTitle: { fontWeight: 'bold', color: '#3E2723', marginBottom: 20, marginLeft: 4 },
    featureItem: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-start' },
    featureText: { flex: 1, marginLeft: 16 },
    featureTitle: { fontWeight: 'bold', color: '#3E2723', marginBottom: 4 },
    featureDesc: { color: '#8C7853', lineHeight: 18 },
    footer: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
    copy: { color: '#BCAAA4' }
});

export default AboutScreen;
