import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StockScreen from './StockScreen';
import CourseScreen from './CourseScreen';
import HistoriqueAchatScreen from './HistoriqueAchatScreen';
import AchatRapideScreen from './AchatRapideScreen';


const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#292929' },
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: '#ccc',
      }}
    >
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Course" component={CourseScreen} />
      <Tab.Screen name="Historique" component={HistoriqueAchatScreen} />
      <Tab.Screen name="AchatRapide" component={AchatRapideScreen} options={{ title: 'Achat rapide' }} />
    </Tab.Navigator>
  );
}
