import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface LegalFooterProps {
    onNavigate: (screen: string) => void;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ onNavigate }) => {
    const LinkItem = ({ label, screen, path }: { label: string, screen: string, path: string }) => (
        <Text
            style={styles.footerLinkText}
            accessibilityRole="link"
            href={path}
            onPress={(e: any) => {
                // On web, prevent default to use SPA navigation unless it's a special click
                if (Platform.OS === 'web') {
                    if (e.ctrlKey || e.metaKey || e.shiftKey || (e.button && e.button !== 0)) {
                        return;
                    }
                    e.preventDefault();
                }
                onNavigate(screen);
            }}
        >
            {label}
        </Text>
    );

    return (
        <View style={styles.footerLinks}>
            <LinkItem label="プライバシーポリシー" screen="PrivacyPolicy" path="/privacy" />
            <Text style={styles.footerDivider}>|</Text>
            <LinkItem label="利用規約" screen="TermsOfService" path="/terms" />
            <Text style={styles.footerDivider}>|</Text>
            <LinkItem label="このサイトについて" screen="About" path="/about" />
            <Text style={styles.footerDivider}>|</Text>
            <LinkItem label="お問い合わせ" screen="Contact" path="/contact" />
        </View>
    );
};

const styles = StyleSheet.create({
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        opacity: 0.6,
    },
    footerLinkText: {
        fontSize: 12,
        color: '#8C7853',
        textDecorationLine: 'underline',
    },
    footerDivider: {
        marginHorizontal: 12,
        fontSize: 12,
        color: '#8C7853',
    },
});
