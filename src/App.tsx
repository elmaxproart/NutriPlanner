import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AddMenuPage from './screens/AddMenuPage';
import Dashboard from './screens/Dashboard';
import EditScreen from './screens/EditScreen';
import LoginScreen from './screens/LoginScreen';
import MenuPlanifiesScreen from './screens/MenuScreen';
import OnboardingScreen from './screens/onboarding_screen/OnboardingScreen';
import ProfileScreen from './screens/ProfileScreen';
import Redirection from './screens/Redirection';
import AchatRapideScreen from './screens/stock/AchatRapideScreen';
import CourseScreen from './screens/stock/CourseScreen';
import HistoriqueAchatScreen from './screens/stock/HistoriqueAchatScreen';
import StockScreen from './screens/stock/StockScreen';
import UploadScreen from './screens/stock/UploadScreen';
import Welcome from './screens/Welcome';
import Signup from './screens/Signup';
import GeminiAssistant from './screens/ai/GeminiAssistant';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import MapScreen from './screens/geolocalisation/MapScreen';

// Import de tes écrans (à adapter selon ton projet)


// Création des navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Configuration de la tab bar avec ses onglets
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212', 
          borderTopColor: '#222',     
        },
        tabBarActiveTintColor: '#FFA500', // orange actif
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'questioncircleo';
          if (route.name === 'Stock') iconName = 'inbox';
          else if (route.name === 'Courses') iconName = 'profile';
          else if (route.name === 'AchatRapide') iconName = 'shoppingcart';
          else if (route.name === 'HistoriqueAchats') iconName = 'clockcircleo';
          return <AntDesign name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Courses" component={CourseScreen} />
      <Tab.Screen name="AchatRapide" component={AchatRapideScreen} />
      <Tab.Screen name="HistoriqueAchats" component={HistoriqueAchatScreen} />
    </Tab.Navigator>
  );
}

// Navigation principale

export default function AppNavigation() {
  useEffect(() => {
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted.');
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        // 🔥 ENVOIE ce token à Firestore si tu veux cibler l’utilisateur plus tard
      }
    }
  };

  requestPermission();
}, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'  screenOptions={{ headerShown: false }}>
        {/* Écrans avant la tab bar */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Redirection" component={Redirection} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Upload" component={UploadScreen} />

        {/* Ici on lance la tab bar */}
        <Stack.Screen name="HomeTabs" component={AppTabs} />

        {/* Autres écrans pouvant apparaître au-dessus */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Home" component={Dashboard} />
        <Stack.Screen name="EditScreen" component={EditScreen} />
        <Stack.Screen name="addMenu" component={AddMenuPage} />
        <Stack.Screen name="menu" component={MenuPlanifiesScreen} />
        <Stack.Screen name="ia" component={GeminiAssistant} />
         <Stack.Screen name="Map" component={MapScreen} /> 

      </Stack.Navigator>
    </NavigationContainer>
  );
}

