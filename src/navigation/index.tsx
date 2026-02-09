import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import EditRecipeScreen from '../screens/EditRecipeScreen';
import DeltaScreen from '../screens/DeltaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
                <Stack.Screen name="EditRecipe" component={EditRecipeScreen} />
                <Stack.Screen name="Delta" component={DeltaScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
