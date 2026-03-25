import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { AdBanner } from './ads';

interface BottomBarProps {
    isPremium: boolean;
    isMobile: boolean;
    onAddRecipe: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ isPremium, isMobile, onAddRecipe }) => {
    return (
        <Surface style={styles.bottomBar} elevation={4}>
            <View style={styles.adArea}>
                {!isPremium && <AdBanner />}
            </View>
            <FAB
                icon="plus"
                style={styles.fabInBar}
                color="#fff"
                onPress={onAddRecipe}
                label={!isMobile ? "新しいレシピ" : undefined}
                visible={true}
            />
        </Surface>
    );
};

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
    },
    adArea: {
        flex: 1,
        marginRight: 16,
        maxWidth: 320,
    },
    fabInBar: {
        backgroundColor: '#C5A059',
        borderRadius: 16,
        elevation: 2,
    },
});
