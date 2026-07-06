import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import SplashScreen from '../screens/SplashScreen';
import { RootStackParamList } from '../types';

const Root = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoggedIn, isBootstrapping } = useAuthStore();

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {isBootstrapping ? (
          <Root.Screen name="Splash" component={SplashScreen} />
        ) : isLoggedIn ? (
          <Root.Screen name="Main" component={MainStack} />
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
