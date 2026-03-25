import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LegalFooterProps {
    onNavigate: (screen: string) => void;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ onNavigate }) => {
    return (
        <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => onNavigate('PrivacyPolicy')}>
                <Text style={styles.footerLinkText}>プライバシーポリシー</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity onPress={() => onNavigate('TermsOfService')}>
                <Text style={styles.footerLinkText}>利用規約</Text>
            </TouchableOpacity>
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
