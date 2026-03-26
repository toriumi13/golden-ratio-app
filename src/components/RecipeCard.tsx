import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCategoryById } from '../constants/categories';
import { getDefaultImageForCategory } from '../constants/defaultImages';
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
            <View style={styles.horizontalContainer}>
                <Image
                    source={{ uri: item.imageUrl || getDefaultImageForCategory(item.category || 'others') }}
                    style={styles.sideImage}
                />
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.tagBadgeRow}>
                            <View style={styles.versionBadge}>
                                <Text style={styles.versionBadgeText}>Ver {item.latestVersionNumber || '1.0'}</Text>
                            </View>
                        </View>
                        <IconButton
                            icon="delete-outline"
                            iconColor="#888"
                            size={18}
                            style={{ margin: 0 }}
                            onPress={() => onDelete(item.id, item.name)}
                        />
                    </View>

                    <Text variant="titleMedium" style={styles.recipeName} numberOfLines={2}>
                        {item.name}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.statItem}>
                            <IconButton icon="history" size={12} iconColor="#888" style={styles.statIcon} />
                            <Text style={styles.statText}>改善済み</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.latestVersionDate || item.createdAt).toLocaleDateString('ja-JP')}
                        </Text>
                    </View>
                </Card.Content>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    recipeCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#FFF',
        overflow: 'hidden',
    },
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 120,
    },
    sideImage: {
        width: 120,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    versionBadge: {
        backgroundColor: '#FDF7E1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    versionBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#C5A059',
    },
    recipeName: {
        color: '#3E2723',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    tagBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F9F7F2',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        margin: 0,
        marginRight: -2,
    },
    statText: {
        fontSize: 10,
        color: '#888',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 10,
        color: '#A1887F',
    },
});
