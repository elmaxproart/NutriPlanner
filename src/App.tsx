import './i18n'; // Import i18n configuration
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import React, { useEffect, useState } from 'react';
import {
  View,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
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
import GeminiChatScreen from './components/ai/GeminiChatScreen';
import { AiInteraction } from './constants/entities';
import { PromptType } from './services/prompts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import withNetworkCheck from './screens/withNetworkCheck';

export type RootStackParamList = {

  Store: { storeId: string };
  Onboarding: undefined;
  WelcomeAI: undefined;
  Redirection: undefined;
  Welcome: undefined;
  Login: { errorMessage: string };
  Signup: undefined;
  Home: undefined;
  GeminiChat: { initialInteraction?: AiInteraction; promptType?: PromptType; messageId?: string };
  Profile: undefined;
  Edit: { data?: any };
  AddMenu: undefined;
  Menu: undefined;
  GeminiAI: undefined;
  ForgotPassword: undefined;
  NetworkStatus: undefined;
  MenuSuggestions: undefined;
  MenuDetail: { menuId: string };
  FamilyList: undefined;
  FamilyMemberDetail: { memberId: string };
  AddFamilyMember: undefined;
  EditFamilyMember: { memberId: string };
  AddRecipe: undefined;
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  RecipeAnalysis: { recipeId: string; familyId: string };
  UserOnboarding: { userId: string };
  UserOnboardingStep1: { userId: string; familyId: string };
  UserOnboardingStep2: { userId: string; familyId: string };
  UserOnboardingStep3: { userId: string; familyId: string };
  UserOnboardingStep4: { userId: string; familyId: string };
  UserOnboardingStep5: { userId: string; familyId: string };
  UserOnboardingSummary: { userId: string; familyId: string };
  MealHistory: undefined;
  Stores: undefined;
  BudgetDetail: { budgetId: string };
  BudgetOverview: undefined;
  ShoppingList: undefined;
  EditRecipe: { recipeId: string; familyId: string; createurId: string };
  Settings: undefined;
  FallbackLogin: undefined;

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
      <SafeAreaView style={styles.loadingContainer}>
        <Image source={require('./assets/images/koki.jpg')} style={styles.loadingBackground} />
        <View style={styles.loadingContent}>
          <Animated.View style={styles.loadingIcon}>
            <MaterialCommunityIcons name="food" size={60} color="#FF4F00" />
          </Animated.View>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Erreur : {authError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetryAuth}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList =
    typeof userId === 'string' && userId.trim() !== '' ? 'Home' : 'Onboarding';
  logger.info(`Initial route: ${initialRouteName}`);

  return (
    <>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
            {/* Écrans publics (pas de réseau requis) */}
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

            {/* Écrans authentifiés (réseau requis pour certains) */}
            <Stack.Screen name="Home" component={withNetworkCheck(Dashboard)} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Edit" component={EditScreen} />
            <Stack.Screen name="AddMenu" component={withNetworkCheck(AddMenuPage)} />
            <Stack.Screen name="Menu" component={withNetworkCheck(MenuPlanifiesScreen)} />
            <Stack.Screen name="GeminiAI" component={withNetworkCheck(GeminiAIScreen)} />
            <Stack.Screen name="GeminiChat" component={withNetworkCheck(GeminiChatScreen)} />
            <Stack.Screen name="NetworkStatus" component={NetworkStatusScreen} />
            <Stack.Screen name="MenuSuggestions" component={withNetworkCheck(MenuSuggestionsScreen)} />
            <Stack.Screen name="MenuDetail" component={withNetworkCheck(MenuDetailScreen)} />
            <Stack.Screen name="FamilyList" component={withNetworkCheck(FamilyListScreen)} />
            <Stack.Screen name="FamilyMemberDetail" component={withNetworkCheck(FamilyMemberDetailScreen)} />
            <Stack.Screen name="AddFamilyMember" component={withNetworkCheck(AddFamilyMemberScreen)} />
            <Stack.Screen name="EditFamilyMember" component={withNetworkCheck(EditFamilyMemberScreen)} />
            <Stack.Screen name="AddRecipe" component={withNetworkCheck(AddRecipeScreen)} />
            <Stack.Screen name="RecipeList" component={withNetworkCheck(RecipeListScreen)} />
            <Stack.Screen name="RecipeDetail" component={withNetworkCheck(RecipeDetailScreen)} />
            <Stack.Screen name="RecipeAnalysis" component={withNetworkCheck(RecipeAnalysisScreen)} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nextProvider>

      <ModalComponent
        visible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
        title="Quitter l'application"
        showCloseButton={false}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalMessageText}>Voulez-vous vraiment quitter NutriBuddy AI ?</Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsExitModalVisible(false)}>
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmExit}>
              <Text style={styles.modalButtonText}>Oui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalComponent>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  loadingBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f7b733',
    borderRadius: 8,
    shadowColor: '#f7b733',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalMessageText: {
    fontSize: 18,
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
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;
