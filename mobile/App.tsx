import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { getSocket } from './src/socket/socket';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function AppInner() {
  const { bootstrap, token, isLoggedIn } = useAuthStore();
  const { theme } = useTheme();

  useEffect(() => {
    bootstrap();
  }, []);

  // Initialize socket connection once user logs in
  useEffect(() => {
    if (isLoggedIn && token) {
      getSocket(token);
    }
  }, [isLoggedIn, token]);

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppInner />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
