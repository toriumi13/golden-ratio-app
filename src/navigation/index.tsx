import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import EditRecipeScreen from '../screens/EditRecipeScreen';
import DeltaScreen from '../screens/DeltaScreen';

import ShowcaseScreen from '../screens/ShowcaseScreen';
import GuideScreen from '../screens/GuideScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer
            documentTitle={{
                formatter: (options, route) =>
                    `${options?.title ?? route?.name} | 黄金比のレシピ帳`,
            }}
        >
            <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
                <Stack.Screen name="Showcase" component={ShowcaseScreen} options={{ title: 'ショーケース' }} />
                <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'レシピ詳細' }} />
                <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'レシピ編集' }} />
                <Stack.Screen name="Delta" component={DeltaScreen} options={{ title: '比率の差分' }} />
                <Stack.Screen name="Guide" component={GuideScreen} options={{ title: '使い方ガイド' }} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'プライバシーポリシー' }} />
                <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: '利用規約' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
