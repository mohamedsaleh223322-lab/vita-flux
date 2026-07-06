import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import HospitalTabScreen from '../screens/hospitals/HospitalTabScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import { MainTabsParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Hospital"
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen
        name="Hospital"
        component={HospitalTabScreen}
        options={{ tabBarLabel: 'Hospital' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
