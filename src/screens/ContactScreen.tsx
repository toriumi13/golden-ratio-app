import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Text, Appbar, Surface, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ContactScreen = ({ navigation }: any) => {
    const theme = useTheme();

    const handleOpenX = () => {
        const url = 'https://x.com/golden_ratioapp';
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header elevated style={styles.header}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="お問い合わせ" titleStyle={styles.headerTitle} />
            </Appbar.Header>

            <View style={styles.content}>
                <Surface style={styles.card} elevation={2}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="chat-outline" size={32} color="#C5A059" />
                    </View>
                    <Text variant="headlineSmall" style={styles.title}>ご連絡はこちらまで</Text>
                    <Text variant="bodyMedium" style={styles.description}>
                        アプリの不具合、改善要望、ビジネスのお問い合わせなど、お気軽にご連絡ください。{"\n"}
                        公式Xにて最新情報と共にお返事させていただきます。
                    </Text>

                    <Button 
                        mode="contained" 
                        onPress={handleOpenX}
                        icon="twitter"
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                    >
                        公式X (@golden_ratioapp)
                    </Button>

                    <Text variant="bodySmall" style={styles.note}>
                        ※ お返事には数日いただく場合がございます。予めご了承ください。
                    </Text>
                </Surface>

                <View style={styles.decorationCircle} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9F6' },
    header: { backgroundColor: '#FFF' },
    headerTitle: { fontWeight: 'bold', color: '#3E2723' },
    content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
    card: { 
        padding: 40, 
        borderRadius: 32, 
        backgroundColor: '#FFF', 
        width: '100%', 
        maxWidth: 500, 
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    iconContainer: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: '#FDFCFB', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F2EFE9',
    },
    title: { fontWeight: 'bold', color: '#3E2723', marginBottom: 16, textAlign: 'center' },
    description: { textAlign: 'center', color: '#8C7853', lineHeight: 24, marginBottom: 32 },
    button: { width: '100%', height: 56, justifyContent: 'center', borderRadius: 16, backgroundColor: '#1DA1F2' },
    buttonLabel: { fontWeight: 'bold', fontSize: 16 },
    note: { color: '#BCAAA4', textAlign: 'center', marginTop: 24, fontSize: 12 },
    decorationCircle: { 
        position: 'absolute', 
        bottom: -100, 
        right: -100, 
        width: 300, 
        height: 300, 
        borderRadius: 150, 
        backgroundColor: '#F3E5AB', 
        opacity: 0.2, 
        zIndex: -1 
    }
});

export default ContactScreen;
