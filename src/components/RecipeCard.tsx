import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Surface, IconButton, useTheme } from 'react-native-paper';
import { Recipe } from '../types';

interface RecipeCardProps {
    item: Recipe;
    navigation: any;
    isMobile: boolean;
    onDelete: (id: string, name: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ item, navigation, isMobile, onDelete }) => {
    const theme = useTheme();

    return (
        <Card
            style={styles.recipeCard}
            elevation={1}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
        >
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Surface style={styles.iconContainer} elevation={0}>
                        <View style={styles.iconInner}>
                            <IconButton icon="notebook-outline" iconColor={theme.colors.primary} size={24} />
                        </View>
                    </Surface>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconButton
                            icon="delete-outline"
                            iconColor="#888"
                            size={20}
                            style={{ margin: 0 }}
                            onPress={() => onDelete(item.id, item.name)}
                        />
                        <View style={styles.versionBadge}>
                            <Text style={styles.versionBadgeText}>Ver {item.latestVersionNumber || '1.0'}</Text>
                        </View>
                    </View>
                </View>

                <Text variant="titleLarge" style={[styles.recipeName, isMobile && { fontSize: 18 }]} >
                    {item.name}
                </Text>

                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagBadgeRow}>
                        {item.tags.map(tag => (
                            <View key={tag} style={styles.tagBadge}>
                                <Text style={styles.tagBadgeText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.statItem}>
                        <IconButton icon="history" size={14} iconColor="#888" style={styles.statIcon} />
                        <Text style={styles.statText}>改善済み</Text>
                    </View>
                    <Text style={styles.dateText}>
                        更新: {new Date(item.latestVersionDate || item.createdAt).toLocaleDateString('ja-JP')}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    recipeCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: '#FFF',
    },
    cardContent: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FDFCF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        opacity: 0.8,
    },
    versionBadge: {
        backgroundColor: '#FDF7E1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    versionBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#C5A059',
    },
    recipeName: {
        color: '#3E2723',
        fontWeight: '800',
        marginBottom: 12,
    },
    tagBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tagBadge: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagBadgeText: {
        fontSize: 10,
        color: '#777',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9F7F2',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        margin: 0,
        marginRight: -4,
    },
    statText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 11,
        color: '#A1887F',
    },
});
