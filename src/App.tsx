import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, BackHandler, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuth } from '@react-native-firebase/auth';

import { useAuth } from './hooks/useAuth';
import { ModalComponent } from './components/common/Modal';

// Import all screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/Signup';
import Dashboard from './screens/Dashboard';
import WelcomeScreen from './screens/Welcome';
import ProfileScreen from './screens/ProfileScreen';
import RedirectionScreen from './screens/Redirection';
import OnboardingScreen from './screens/onboarding_screen/OnboardingScreen';
import AddMenuPage from './screens/AddMenuPage';
import EditScreen from './screens/EditScreen';
import MenuPlanifiesScreen from './screens/MenuScreen';
import GeminiAIScreen from './screens/GeminiAIScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import NetworkStatusScreen from './screens/NetworkStatusScreen';
import MenuSuggestionsScreen from './screens/MenuSuggestionsScreen';
import MenuDetailScreen from './screens/MenuDetailScreen';
import FamilyListScreen from './screens/FamilyListScreen';
import FamilyMemberDetailScreen from './screens/FamilyMemberDetailScreen';
import AddFamilyMemberScreen from './screens/AddFamilyMemberScreen';
import EditFamilyMemberScreen from './screens/EditFamilyMemberScreen';
import AddRecipeScreen from './screens/AddRecipeScreen';
import RecipeListScreen from './screens/RecipeListScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import RecipeAnalysisScreen from './screens/RecipeAnalysisScreen';
import { logger } from './utils/logger';
import OnboardingScreenIA from './components/ai/onboarding/OnboardingScreen';
import UserOnboardingScreen from './screens/onboarding_screen/UserOnboardingScreen';
import UserOnboardingStep1 from './screens/onboarding_screen/UserOnboardingStep1';
import UserOnboardingStep2 from './screens/onboarding_screen/UserOnboardingStep2';
import UserOnboardingStep3 from './screens/onboarding_screen/UserOnboardingStep3';
import UserOnboardingStep4 from './screens/onboarding_screen/UserOnboardingStep4';
import UserOnboardingStep5 from './screens/onboarding_screen/UserOnboardingStep5';
import UserOnboardingSummary from './screens/onboarding_screen/UserOnboardingSummary';

// Define the RootStackParamList for type safety in navigation
export type RootStackParamList = {
  Onboarding: undefined;
  WelcomeAI: undefined;
  Redirection: undefined;
  Welcome: undefined;
  Login: { errorMessage: string };
  Signup: undefined;
  Home: undefined;
  Profile: undefined;
  Edit: { data?: any };
  AddMenu: undefined;
  Menu: undefined;
  GeminiAI: undefined;
  ForgotPassword: undefined;
  NetworkStatus: undefined;
  MealHistory: undefined;
  Stores: undefined;
  RecipeDetail: { recipeId: string; familyId: string };
  MenuSuggestions: undefined;
  MenuDetail: { menuId: string };
  FamilyList: undefined;
  FamilyMemberDetail: { memberId: string; familyId: string };
  AddFamilyMember: undefined;
  EditFamilyMember: { memberId: string; familyId: string };
  AddRecipe: undefined;
  RecipeList: undefined;
  RecipeAnalysis: { recipeId: string; familyId: string };
  BudgetDetail: { budgetId: string };
  BudgetOverview: undefined;
  ShoppingList: undefined;
  EditRecipe: { recipeId: string; familyId: string; createurId: string };
  Settings: undefined;
  FallbackLogin: undefined;
  UserOnboarding: { userId: string };
  UserOnboardingStep1: { userId: string; familyId: string };
  UserOnboardingStep2: { userId: string; familyId: string };
  UserOnboardingStep3: { userId: string; familyId: string };
  UserOnboardingStep4: { userId: string; familyId: string };
  UserOnboardingStep5: { userId: string; familyId: string };
  UserOnboardingSummary: { userId: string; familyId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const { userId, loading: authLoading, error: authError } = useAuth();
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  useEffect(() => {
    const backAction = () => {
      setIsExitModalVisible(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleConfirmExit = () => {
    setIsExitModalVisible(false);
    BackHandler.exitApp();
  };

  const handleRetryAuth = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch (error) {
        logger.error(`Failed to reload auth state: ${error}`);
      }
    }
  };

  if (authLoading) {
    return (
      <View style={appStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={appStyles.loadingText}>Chargement de l'application...</Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View style={appStyles.loadingContainer}>
        <Text style={appStyles.loadingText}>Erreur : {authError}</Text>
        <TouchableOpacity style={appStyles.retryButton} onPress={handleRetryAuth}>
          <Text style={appStyles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList = userId ? 'Onboarding' : 'Welcome';
  logger.info(`Initial route: ${initialRouteName}`);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
          {/* Public/Onboarding Screens */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="WelcomeAI" component={OnboardingScreenIA} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Redirection" component={RedirectionScreen} />
          <Stack.Screen name="UserOnboarding" component={UserOnboardingScreen} />
          <Stack.Screen name="UserOnboardingStep1" component={UserOnboardingStep1} />
          <Stack.Screen name="UserOnboardingStep2" component={UserOnboardingStep2} />
          <Stack.Screen name="UserOnboardingStep3" component={UserOnboardingStep3} />
          <Stack.Screen name="UserOnboardingStep4" component={UserOnboardingStep4} />
          <Stack.Screen name="UserOnboardingStep5" component={UserOnboardingStep5} />
          <Stack.Screen name="UserOnboardingSummary" component={UserOnboardingSummary} />

          {/* Authenticated User Screens */}
          <Stack.Screen name="Home" component={Dashboard} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Edit" component={EditScreen} />
          <Stack.Screen name="AddMenu" component={AddMenuPage} />
          <Stack.Screen name="Menu" component={MenuPlanifiesScreen} />
          <Stack.Screen name="GeminiAI" component={GeminiAIScreen} />
          <Stack.Screen name="NetworkStatus" component={NetworkStatusScreen} />
          <Stack.Screen name="MenuSuggestions" component={MenuSuggestionsScreen} />
          <Stack.Screen name="MenuDetail" component={MenuDetailScreen} />

          {/* Family Management */}
          <Stack.Screen name="FamilyList" component={FamilyListScreen} />
          <Stack.Screen name="FamilyMemberDetail" component={FamilyMemberDetailScreen} />
          <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
          <Stack.Screen name="EditFamilyMember" component={EditFamilyMemberScreen} />

          {/* Recipe Management */}
          <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
          <Stack.Screen name="RecipeList" component={RecipeListScreen} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <Stack.Screen name="RecipeAnalysis" component={RecipeAnalysisScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      <ModalComponent
        visible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
        title="Quitter l'application"
        showCloseButton={false}
      >
        <View style={appStyles.modalContent}>
          <Text style={appStyles.modalMessageText}>Voulez-vous vraiment quitter NutriBuddy AI ?</Text>
          <View style={appStyles.modalButtonContainer}>
            <TouchableOpacity style={appStyles.modalCancelButton} onPress={() => setIsExitModalVisible(false)}>
              <Text style={appStyles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={appStyles.modalConfirmButton} onPress={handleConfirmExit}>
              <Text style={appStyles.modalButtonText}>Oui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalComponent>
    </>
  );
};

const appStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 18,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f7b733',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 10,
    alignItems: 'center',
  },
  modalMessageText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default App;
