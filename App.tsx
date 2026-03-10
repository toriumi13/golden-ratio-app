import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme, Text, Button } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import { observeAuth, loginAnonymously } from './src/store/auth';
import LoginScreen from './src/screens/LoginScreen';
import { initializeSubscription, syncSubscriptionUser } from './src/store/subscription';
import { Platform } from 'react-native';
import PWAInstallPrompt from './src/components/PWAInstallPrompt';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#C5A059', // Champagne Gold (Sophisticated)
    onPrimary: '#FFFFFF',
    primaryContainer: '#F3E5AB',
    onPrimaryContainer: '#4A3728',
    secondary: '#3E2723', // Deep Espresso
    onSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    background: '#F9F7F2', // Nuance Beige/Off-white
    outline: '#E0C097',   // Soft Gold outline
    surfaceVariant: '#F2EF E9',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FDFCFB',
      level3: '#FBF9F7',
      level4: '#FAF7F5',
      level5: '#F9F5F2',
    },
  },
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize RevenueCat for Mobile
    if (Platform.OS !== 'web') {
      initializeSubscription();
    }

    console.log("Setting up auth observer...");
    const unsubscribe = observeAuth((user) => {
      console.log("Auth State Changed:", user ? `UID: ${user.uid} (Anonymous: ${user.isAnonymous})` : "No User");
      setUser(user);

      // Sync user with RevenueCat
      if (Platform.OS !== 'web') {
        syncSubscriptionUser(user?.uid || null);
      }

      if (initializing) setInitializing(false);

      if (!user) {
        console.log("No user session found. Attempting anonymous login...");
        loginAnonymously();
      }
    });

    // Timeout safety: if auth doesn't respond in 10s, stop loading anyway
    const timeout = setTimeout(() => {
      if (initializing) {
        console.log("Auth initialization timeout.");
        setInitializing(false);
        setError("通信タイムアウト。オフラインまたは設定エラーの可能性があります。");
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [initializing]);

  const handleRetry = () => {
    setError(null);
    setInitializing(true);
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#B8860B" />
        <Text style={{ marginTop: 16, color: '#8C7853', fontWeight: 'bold' }}>黄金比を読み込み中...</Text>
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text variant="headlineSmall" style={{ color: '#C62828', marginBottom: 16, fontWeight: 'bold' }}>接続エラー</Text>
        <Text style={{ textAlign: 'center', marginBottom: 32, lineHeight: 24, color: '#5D4037' }}>{error}</Text>
        <Button
          mode="contained"
          onPress={handleRetry}
          contentStyle={{ height: 48 }}
          style={{ borderRadius: 8, width: '100%' }}
        >
          再試行
        </Button>
      </View>
    );
  }

  if (!user) {
    // Check if we are on a public-accessible route like 'Showcase'
    // Note: Since this is outside the NavigationContainer in some structures, 
    // we use a more robust check if possible, or allow the navigator to handle it.
    // However, in this app structure, AuthWrapper sits above AppNavigator.
    // For SEO and public access, we allow the children to render and let the screens handle auth.
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 5, zIndex: 9999 }}>
        <Text style={{ fontSize: 9, color: '#fff' }}>
          Build 23:05 | UID: {user?.uid || 'NONE'} | {user?.email || (user?.isAnonymous ? 'ANON' : 'GUEST')}
        </Text>
      </View>
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthWrapper>
          <AppNavigator />
          {Platform.OS === 'web' && <PWAInstallPrompt />}
        </AuthWrapper>
      </PaperProvider>
    </SafeAreaProvider>
  );
}