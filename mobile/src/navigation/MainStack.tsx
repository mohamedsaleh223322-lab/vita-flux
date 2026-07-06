import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import GovernorateScreen from '../screens/governorate/GovernorateScreen';
import HospitalsScreen from '../screens/hospitals/HospitalsScreen';
import HospitalDetailScreen from '../screens/hospitals/HospitalDetailScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import { MainStackParamList } from '../types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Governorate" component={GovernorateScreen} />
      <Stack.Screen name="Hospitals" component={HospitalsScreen} />
      <Stack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
