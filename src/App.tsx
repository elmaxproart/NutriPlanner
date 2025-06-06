// import React, { useEffect, useState } from 'react';
// import { View, ActivityIndicator, Alert } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { BackHandler } from "react-native";

// import LoginScreen from './screens/LoginScreen';
// import SignupScreen from './screens/Signup';
// import Dashboard from './screens/Dashboard';
// import Welcome from './screens/Welcome';
// import ProfileScreen from './screens/ProfileScreen';
// import Redirection from './screens/Redirection';
// import OnboardingScreen from './screens/onboarding_screen/OnboardingScreen';
// import AddMenuPage from './screens/AddMenuPage';
// import EditScreen from './screens/EditScreen';
// import MenuPlanifiesScreen from './screens/MenuScreen';


// const Stack = createStackNavigator();

// const App = () => {
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState<firebase.User | null>(null);


// useEffect(() => {
//   const backAction = () => {
//     Alert.alert("Quitter l'application", "Voulez-vous vraiment quitter ?", [
//       {
//         text: "Annuler",
//         onPress: () => null,
//         style: "cancel",
//       },
//       {
//         text: "Oui",
//         onPress: () => BackHandler.exitApp(),
//       },
//     ]);
//     return true; 
//   };

//   const backHandler = BackHandler.addEventListener(
//     "hardwareBackPress",
//     backAction
//   );

//   return () => backHandler.remove(); 
// }, []);

//   useEffect(() => {
//     const unsubscribe = auth().onAuthStateChanged((user) => {
//       setUser(user);
//       if (initializing) setInitializing(false);
//     });

//     return unsubscribe;
//   }, []);

//   if (initializing) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
//         <ActivityIndicator size="large" color="#6200ee" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator  screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Onboarding" component={OnboardingScreen} />
//         <Stack.Screen name="Redirection" component={Redirection} />
//         <Stack.Screen name="Welcome" component={Welcome} />
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Signup" component={SignupScreen} />

//         <Stack.Screen name="Profile" component={ProfileScreen} />
//         {user && (
//           <Stack.Screen name="Home" component={Dashboard} />
//         )}
//         <Stack.Screen name="EditScreen" component={EditScreen} />
//          <Stack.Screen name="addMenu" component={AddMenuPage} /> 
//         <Stack.Screen name="menu" component={MenuPlanifiesScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;


import React from 'react';
import { SafeAreaView } from 'react-native';
import MapViewComponent from '../src/components/MapViewComponent';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapViewComponent />
    </SafeAreaView>
  );
};

export default App;
