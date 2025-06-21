/* eslint-disable @typescript-eslint/no-unused-vars */
// src/screens/GeminiChatScreen.tsx
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Vibration,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useTranslation } from 'react-i18next';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import { conversationStyles } from '../../styles/conversationStyles';
import MessageInput from '../conversation/MessageInput';
import MessageBubble from '../conversation/MessageBubble';
import AITemplateCarousel from './AITemplateCarousel';

import ToastNotification from '../common/ToastNotification';
import { useAIConversation } from '../../hooks/useAIConversation';
import { useAuth } from '../../hooks/useAuth';
import { useBudget } from '../../hooks/useBudget';
import { useFamilyData } from '../../hooks/useFamilyData';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useMenus } from '../../hooks/useMenus';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRecipes } from '../../hooks/useRecipes';
import { useStores } from '../../hooks/useStores';
import { RootStackParamList } from '../../App';
import { generateUniqueId, getErrorMessage } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import Tts from 'react-native-tts';
import { useColorScheme } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import analytics from '../../utils/helpers';
import { AiInteraction, AiInteractionType, MembreFamille, Menu, Ingredient, Recette, HistoriqueRepas } from '../../constants/entities';
import { PromptType } from '../../services/prompts';
import { ModalComponent } from '../common/Modal';
import SingleTemplatePreview from './SingleTemplatePreview';

// Constants for layout and animation
const { width } = Dimensions.get('window');
// const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const MESSAGE_CARD_WIDTH = width * 0.85;
const MESSAGE_CARD_MARGIN = theme.spacing.sm;
const ANIMATION_DURATION = theme.animation.duration;

// Interface for GeminiChatScreen props
interface GeminiChatScreenProps extends StackScreenProps<RootStackParamList, 'GeminiChat'> {
  initialInteraction?: AiInteraction;
  promptType?: PromptType;
  messageId?: string;
}

// Interface for template preview
interface TemplatePreview {
  id: string;
  interaction: AiInteraction;
  promptType?: PromptType;
  interactionType: AiInteractionType;
}

// Main GeminiChatScreen component
const GeminiChatScreen: React.FC<GeminiChatScreenProps> = ({ navigation, route }) => {
  const { initialInteraction, promptType } = route.params || {};
  const { t } = useTranslation();
  const { userId } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const {
    messages: aiInteractions,
    sendMessage,
    currentConversation,
    conversations,
    createNewConversation,
    selectConversation,
    deleteConversation,
    generatePersonalizedRecipe,
    generateWeeklyMenu,
    generateShoppingList,
    analyzeRecipe,
    generateRecipeSuggestions,
    generateQuickRecipe,
    generateBudgetPlan,
    suggestStore,
    analyzeMeal,
    generateKidsRecipe,
    generateSpecialOccasionMenu,
    optimizeInventory,
    generateIngredientBasedRecipe,
    generateBudgetMenu,
    checkRecipeCompatibility,
    generateSpecificDietRecipe,
    generateBalancedDailyMenu,
    generateRecipeFromImage,
    generateLeftoverRecipe,
    generateGuestRecipe,
    checkIngredientAvailability,
    getNutritionalInfo,
    troubleshootProblem,
    getCreativeIdeas,
    analyzeFoodTrends,
    isReady,
    loading: aiLoading,
    error: aiError,
  } = useAIConversation();
  const { fetchFamilyMembers, loading: familyLoading } = useFamilyData();
  const { budgets, loading: budgetLoading } = useBudget();
  const { menus, loading: menusLoading } = useMenus();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { stores, loading: storesLoading } = useStores();
  const { loading: mealHistoryLoading } = useMealHistory();
  const { isConnected } = useNetworkStatus();

  // State management
  const [isConversationModalVisible, setIsConversationModalVisible] = useState(false);
  const [isNewConversationModalVisible, setIsNewConversationModalVisible] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [isNetworkErrorModalVisible, setIsNetworkErrorModalVisible] = useState(false);
  const [networkErrorMessage, setNetworkErrorMessage] = useState('');
  const [isTitleMissingModalVisible, setIsTitleMissingModalVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });
  const [isTyping, setIsTyping] = useState(false);
  const [templatePreviews, setTemplatePreviews] = useState<TemplatePreview[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Refs for UI components
  const scrollViewRef = useRef<ScrollView>(null);
  const messageListRef = useRef<FlatList>(null);
  const lastMessageRef = useRef<View>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: withTiming(contentOpacity.value * 50 - 50, { duration: ANIMATION_DURATION }) }],
  }));

  // Initialize animations
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    contentOpacity.value = withTiming(1, { duration: ANIMATION_DURATION + 200 });
  }, [headerOpacity, contentOpacity]);

  // Convert AI interactions to template previews
  const convertToTemplatePreview = useCallback(
    (interaction: AiInteraction): TemplatePreview => ({
      id: interaction.id,
      interaction,
      promptType: promptType || undefined,
      interactionType: interaction.type as AiInteractionType,
    }),
    [promptType],
  );

  // Update template previews when AI interactions change
  useEffect(() => {
    setIsLoadingTemplates(true);
    const newTemplatePreviews = aiInteractions.map(convertToTemplatePreview);
    setTemplatePreviews(newTemplatePreviews);
    setTimeout(() => setIsLoadingTemplates(false), 500);
    if (newTemplatePreviews.length > 0) {
      messageListRef.current?.scrollToEnd({ animated: true });
    }
  }, [aiInteractions, convertToTemplatePreview]);


  const handleSendText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setToast({ visible: true, message: t('errors.emptyMessage'), type: 'warning' });
        Vibration.vibrate(100);
        return;
      }
      if (!isConnected) {
        setNetworkErrorMessage(t('errors.noInternet'));
        setIsNetworkErrorModalVisible(true);
        return;
      }
      if (!userId) {
        setNetworkErrorMessage(t('errors.notLoggedIn'));
        setIsNetworkErrorModalVisible(true);
        return;
      }

      try {
        setIsTyping(true);
        const interaction: AiInteraction = {
          id: generateUniqueId(),
          content: { type: 'text',message : text },
          isUser: true,
          timestamp: new Date().toISOString(),
          type: 'text',
          dateCreation: new Date().toISOString(),
          dateMiseAJour: new Date().toISOString(),
          conversationId: currentConversation?.id || generateUniqueId(),
        };
        await sendMessage(text, undefined, undefined);
        setIsTyping(false);
        messageListRef.current?.scrollToEnd({ animated: true });
        analytics.track('Message_Sent', { type: 'text', conversationId: interaction.conversationId });
      } catch (error) {
        setIsTyping(false);
        setNetworkErrorMessage(t('errors.sendMessage'));
        setIsNetworkErrorModalVisible(true);
        logger.error('Error sending text message', { error: getErrorMessage(error) });
      }
    },
    [isConnected, userId, sendMessage, currentConversation, t],
  );

  // Handle sending image messages
  const handleSendImage = useCallback(
    async (uri: string, mimeType: string) => {
      if (!isConnected) {
        setNetworkErrorMessage(t('errors.noInternet'));
        setIsNetworkErrorModalVisible(true);
        return;
      }
      if (!userId) {
        setNetworkErrorMessage(t('errors.notLoggedIn'));
        setIsNetworkErrorModalVisible(true);
        return;
      }

      try {
        setIsTyping(true);
        const interaction: AiInteraction = {
          id: generateUniqueId(),
          content: { type: 'image', uri, mimeType },
          isUser: true,
          timestamp: new Date().toISOString(),
          type: 'image',
          dateCreation: new Date().toISOString(),
          dateMiseAJour: new Date().toISOString(),
          conversationId: currentConversation?.id || generateUniqueId(),
        };
        await sendMessage('Image uploaded', undefined, { uri, mimeType, base64: '' });
        setIsTyping(false);
        messageListRef.current?.scrollToEnd({ animated: true });
        analytics.track('Message_Sent', { type: 'image', conversationId: interaction.conversationId });
      } catch (error) {
        setIsTyping(false);
        setNetworkErrorMessage(t('errors.sendImage'));
        setIsNetworkErrorModalVisible(true);
        logger.error('Error sending image', { error: getErrorMessage(error) });
      }
    },
    [isConnected, userId, sendMessage, currentConversation, t],
  );



  const navigateToChat = useCallback(
    (interaction: AiInteraction, prompt: PromptType) => {
      navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType: prompt });
      AccessibilityInfo.announceForAccessibility(t('navigation.chat', { promptType: prompt }));
      analytics.track('Navigate_To_Chat', { prompt, interactionId: interaction.id });
    },
    [navigation, t],
  );

  // Handle AI action prompts
  const handleAction = useCallback(
    async (action: string, data: any) => {
      if (!userId) {
        setNetworkErrorMessage(t('errors.notLoggedIn'));
        setIsNetworkErrorModalVisible(true);
        return;
      }
      if (!isConnected) {
        setNetworkErrorMessage(t('errors.noInternet'));
        setIsNetworkErrorModalVisible(true);
        return;
      }

      try {
        setIsTyping(true);
        let interaction: AiInteraction | null = null;
        const conversationId = currentConversation?.id || generateUniqueId();

        switch (action as PromptType) {
          case PromptType.RECIPE_PERSONALIZED: {
            const recette = await generatePersonalizedRecipe(data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.WEEKLY_MENU: {
            const menu = await generateWeeklyMenu(data.members as MembreFamille[], data.dateStart as string);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'menu_suggestion',
                menu,
                description: t('templates.weekly_menu.description'),
                recipes: menu.recettes || [],
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'menu_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.SHOPPING_LIST: {
            const items = await generateShoppingList(data.menu as Menu, data.currentIngredients as Ingredient[]);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'shopping_list_suggestion', listId: generateUniqueId(), items },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'shopping_list_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.RECIPE_NUTRITION_ANALYSIS: {
            const analysis = await analyzeRecipe(data.recipe as Recette, data.familyData as MembreFamille[]);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe_analysis', recipeId: data.recipe.id, analysis },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe_analysis',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.RECIPE_SUGGESTION: {
            const recette = await generateRecipeSuggestions(data.ingredients as Ingredient[], {
              niveauEpices: data.preferences?.niveauEpices || 2,
              cuisinesPreferees: data.preferences?.cuisinesPreferees || ['Italienne'],
              mealType: data.preferences?.mealType,
            });
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'recipe_suggestion',
                recipeId: recette.id,
                name: recette.nom,
                description: t('templates.recipe_suggestion.description'),
                ingredients: recette.ingredients,
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.QUICK_RECIPE: {
            const recette = await generateQuickRecipe(data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.BUDGET_PLANNING: {
            const budget = await generateBudgetPlan(data.budgetLimit as number, data.month as string);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'budget', budget },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'budget',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.STORE_SUGGESTION: {
            const Stores = await suggestStore(data.ingredient as Ingredient);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'stores',
                stores: Stores,
                recommendation: t('templates.store_suggestion.recommendation', { ingredient: data.ingredient.nom }),
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'stores',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.MEAL_ANALYSIS: {
            const analysis = await analyzeMeal(data.historiqueRepas as HistoriqueRepas, data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe_analysis', recipeId: data.historiqueRepas.id, analysis },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe_analysis',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.KIDS_RECIPE: {
            const recette = await generateKidsRecipe(data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.SPECIAL_OCCASION_MENU: {
            const menu = await generateSpecialOccasionMenu(data.members as MembreFamille[], data.occasion as string, data.date as string);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'menu_suggestion',
                menu,
                description: t('templates.special_occasion_menu.description', { occasion: data.occasion }),
                recipes: menu.recettes || [],
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'menu_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.INVENTORY_OPTIMIZATION: {
            const recette = await optimizeInventory(data.ingredients as Ingredient[]);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.INGREDIENT_BASED_RECIPE: {
            const recette = await generateIngredientBasedRecipe(data.ingredient as Ingredient, data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.BUDGET_MENU: {
            const menu = await generateBudgetMenu(data.members as MembreFamille[], data.budget as number);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'menu_suggestion',
                menu,
                description: t('templates.budget_menu.description'),
                recipes: menu.recettes || [],
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'menu_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.RECIPE_COMPATIBILITY: {
            const compatibility = await checkRecipeCompatibility(data.recipe as Recette, data.members as MembreFamille[]);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe_compatibility', recette: data.recipe, compatibility },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe_compatibility',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.SPECIFIC_DIET_RECIPE: {
            const recette = await generateSpecificDietRecipe(data.member as MembreFamille, data.diet as string);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.BALANCED_DAILY_MENU: {
            const menu = await generateBalancedDailyMenu(data.member as MembreFamille, data.date as string);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'menu_suggestion',
                menu,
                description: t('templates.balanced_daily_menu.description'),
                recipes: menu.recettes || [],
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'menu_suggestion',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.RECIPE_FROM_IMAGE: {
            const recette = await generateRecipeFromImage(data.imageUrl as string, data.member as MembreFamille);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.LEFTOVER_RECIPE: {
            const recette = await generateLeftoverRecipe(data.ingredients as Ingredient[]);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.GUEST_RECIPE: {
            const recette = await generateGuestRecipe(data.members as MembreFamille[], data.guestCount as number);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'recipe', recette },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'recipe',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.INGREDIENT_AVAILABILITY: {
            const availability = await checkIngredientAvailability(data.ingredientName as string, data.location as { latitude: number; longitude: number });
            interaction = {
              id: generateUniqueId(),
              content: { type: 'ingredient_availability', stores: availability.stores, ingredients: availability.ingredients },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'ingredient_availability',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.NUTRITIONAL_INFO: {
            const analysis = await getNutritionalInfo(data.query as string);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'nutritional_info', analysis },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'nutritional_info',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.TROUBLESHOOT_PROBLEM: {
            const solution = await troubleshootProblem(data.query as string);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'troubleshoot_problem', question: data.query, solution },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'troubleshoot_problem',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.CREATIVE_IDEAS: {
            const ideas = await getCreativeIdeas(data.query as string);
            interaction = {
              id: generateUniqueId(),
              content: { type: 'creative_ideas', ideas },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'creative_ideas',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          case PromptType.FOOD_TREND_ANALYSIS: {
            const trends = await analyzeFoodTrends(data.members as MembreFamille[]);
            interaction = {
              id: generateUniqueId(),
              content: {
                type: 'food_trends',
                trends: trends.map((trend: any) => ({
                  id: generateUniqueId(),
                  name: trend.name,
                  description: trend.description,
                  popularity: trend.popularity || 80,
                })),
              },
              isUser: false,
              timestamp: new Date().toISOString(),
              type: 'food_trends',
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId,
            };
            break;
          }
          default:
            setIsTyping(false);
            setToast({
              visible: true,
              message: t('errors.unsupportedAction', { action }),
              type: 'error',
            });
            return;
        }

        if (interaction) {
          await sendMessage(
            typeof interaction.content === 'string' ? interaction.content : JSON.stringify(interaction.content),
            undefined,
            undefined,
          );
          const templatePreview = convertToTemplatePreview(interaction);
          setTemplatePreviews((prev) => [...prev, templatePreview]);
          navigateToChat(interaction, action as PromptType);
        }
        setIsTyping(false);
        messageListRef.current?.scrollToEnd({ animated: true });
        analytics.track('Action_Executed', { action, conversationId });
      } catch (error) {
        setIsTyping(false);
        setToast({
          visible: true,
          message: t('errors.actionExecution', { error: getErrorMessage(error) }),
          type: 'error',
        });
        logger.error('Error handling action', { action, error: getErrorMessage(error) });
      }
    },
    [userId, isConnected, t, currentConversation?.id, generatePersonalizedRecipe, generateWeeklyMenu, generateShoppingList, analyzeRecipe, generateRecipeSuggestions, generateQuickRecipe, generateBudgetPlan, suggestStore, analyzeMeal, generateKidsRecipe, generateSpecialOccasionMenu, optimizeInventory, generateIngredientBasedRecipe, generateBudgetMenu, checkRecipeCompatibility, generateSpecificDietRecipe, generateBalancedDailyMenu, generateRecipeFromImage, generateLeftoverRecipe, generateGuestRecipe, checkIngredientAvailability, getNutritionalInfo, troubleshootProblem, getCreativeIdeas, analyzeFoodTrends, sendMessage, convertToTemplatePreview, navigateToChat],
  );


  // Handle message deletion
  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      setToast({
        visible: true,
        message: t('message.deleteSuccess'),
        type: 'success',
      });
      setTemplatePreviews((prev) => prev.filter((template) => template.id !== messageId));
      analytics.track('Message_Deleted', { messageId });
    },
    [t],
  );

  // Handle message retry
  const handleRetryMessage = useCallback(
    async (message: AiInteraction) => {
      try {
        setIsTyping(true);
        await sendMessage(
          typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
          undefined,
          message.type === 'image' && 'uri' in message.content ? { uri: message.content.uri, mimeType: message.content.mimeType || 'image/jpeg', base64: '' } : undefined,
        );
        setIsTyping(false);
        messageListRef.current?.scrollToEnd({ animated: true });
        analytics.track('Message_Retried', { messageId: message.id });
      } catch (error) {
        setIsTyping(false);
        setToast({
          visible: true,
          message: t('errors.retryFailed'),
          type: 'error',
        });
        logger.error('Error retrying message', { error: getErrorMessage(error) });
      }
    },
    [sendMessage, t],
  );

  // Handle new conversation creation
  const handleNewConversation = useCallback(async () => {
    if (!newConversationTitle.trim()) {
      setIsTitleMissingModalVisible(true);
      Vibration.vibrate(100);
      return;
    }

    try {
      const conversationId = await createNewConversation(newConversationTitle.trim());
      setNewConversationTitle('');
      setIsNewConversationModalVisible(false);
      setToast({
        visible: true,
        message: t('conversation.created'),
        type: 'success',
      });
      selectConversation(conversationId);
      scrollViewRef.current?.scrollTo({ x: conversations.length * width, animated: true });
      analytics.track('Conversation_Created', { conversationId });
    } catch (error) {
      setNetworkErrorMessage(t('errors.createConversation'));
      setIsNetworkErrorModalVisible(true);
      logger.error('Error creating conversation', { error: getErrorMessage(error) });
    }
  }, [newConversationTitle, createNewConversation, conversations.length, selectConversation, t]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      selectConversation(conversationId);
      setIsConversationModalVisible(false);
      setToast({
        visible: true,
        message: t('conversation.selected'),
        type: 'success',
      });
      messageListRef.current?.scrollToEnd({ animated: true });
      analytics.track('Conversation_Selected', { conversationId });
    },
    [selectConversation, t],
  );

  // Handle text-to-speech
  const speakText = useCallback(
    (text: string) => {
      try {
        setIsSpeaking(true);
        Tts.speak(text, {
          iosVoiceId: 'com.apple.ttsbundle.Marie-compact',
          rate: 0.5,
          androidParams: { KEY_PARAM_STREAM: 'STREAM_MUSIC', KEY_PARAM_VOLUME: 0.8, KEY_PARAM_PAN: 0 },
        });
        Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
        analytics.track('Text_To_Speech_Started', { textLength: text.length });
      } catch (error) {
        setIsSpeaking(false);
        setToast({
          visible: true,
          message: t('errors.textToSpeech'),
          type: 'error',
        });
        logger.error('Error speaking text', { error: getErrorMessage(error) });
      }
    },
    [t],
  );

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      Tts.setDefaultLanguage('fr-FR');
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      if (userId) {
        await fetchFamilyMembers();
      }
      if (!currentConversation && aiInteractions.length === 0 && !initialInteraction) {
        const welcomeMessage: AiInteraction = {
          id: generateUniqueId(),
          content: { type: 'text', message: t('welcomeMessage') },
          isUser: false,
          timestamp: new Date().toISOString(),
          type: 'text',
          dateCreation: new Date().toISOString(),
          dateMiseAJour: new Date().toISOString(),
          conversationId: generateUniqueId(),
        };
        await sendMessage(t('welcomeMessage'), undefined, undefined);
        setTemplatePreviews([convertToTemplatePreview(welcomeMessage)]);
      }
      if (initialInteraction && promptType) {
        await sendMessage(
          typeof initialInteraction.content === 'string' ? initialInteraction.content : JSON.stringify(initialInteraction.content),
          undefined,
          initialInteraction.type === 'image' && 'uri' in initialInteraction.content ? { uri: initialInteraction.content.uri, mimeType: initialInteraction.content.mimeType || 'image/jpeg', base64: '' } : undefined,
        );
        const templatePreview = convertToTemplatePreview(initialInteraction);
        setTemplatePreviews((prev) => [...prev, templatePreview]);
        navigateToChat(initialInteraction, promptType);
      }
      messageListRef.current?.scrollToEnd({ animated: true });
      analytics.track('Chat_Screen_Initialized', { hasInitialInteraction: !!initialInteraction });
    };
    initialize();

    return () => {
      Tts.stop();
      Tts.removeAllListeners('tts-finish');
    };
  }, [
    userId,
    fetchFamilyMembers,
    sendMessage,
    aiInteractions.length,
    currentConversation,
    initialInteraction,
    promptType,
    convertToTemplatePreview,
    navigateToChat,
    t,
  ]);

  // Monitor dimensions change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      logger.info('Screen dimensions changed', { width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  // Check loading state
  const isLoading = familyLoading || budgetLoading || menusLoading || recipesLoading || storesLoading || mealHistoryLoading || aiLoading;

  // Render message as template or bubble
  const renderMessage = useCallback(
    ({ item: message, index }: { item: AiInteraction; index: number }) => {
      const templatePreview = templatePreviews.find((tp) => tp.id === message.id);
      if (!templatePreview) {
        return null;
      }

      if (message.isUser && message.type === 'text' && 'text' in message.content) {
        return (
          <View style={[styles.messageContainer, styles.userMessageContainer]} ref={index === aiInteractions.length - 1 ? lastMessageRef : null}>
            <MessageBubble
              key={message.id}
              message={message}
              onDelete={() => handleDeleteMessage(message.id)}
              onRetry={() => handleRetryMessage(message)}
              isUser={true}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleDeleteMessage(message.id)}
                style={styles.messageActionButton}
                accessibilityLabel={t('message.delete')}
              >
                <AntDesign name="delete" size={16} color={theme.colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRetryMessage(message)}
                style={styles.messageActionButton}
                accessibilityLabel={t('message.retry')}
              >
                <AntDesign name="reload1" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      } else if (message.isUser && message.type === 'image' && 'uri' in message.content) {
        return (
          <View style={[styles.messageContainer, styles.userMessageContainer]} ref={index === aiInteractions.length - 1 ? lastMessageRef : null}>
            <Image source={{ uri: message.content.uri }} style={styles.userImage} />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleDeleteMessage(message.id)}
                style={styles.messageActionButton}
                accessibilityLabel={t('message.delete')}
              >
                <AntDesign name="delete" size={16} color={theme.colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRetryMessage(message)}
                style={styles.messageActionButton}
                accessibilityLabel={t('message.retry')}
              >
                <AntDesign name="reload1" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      } else {
        return (
          <SingleTemplatePreview
            key={message.id}
            interaction={message}
            promptType={templatePreview.promptType}
            interactionType={templatePreview.interactionType}
            onPress={() => {
              setToast({
                visible: true,
                message: t('templates.previewOnly'),
                type: 'info',
              });
              analytics.track('Template_Preview_Pressed', { templateId: templatePreview.id });
            }}
            isDarkMode={isDarkMode}
            index={index}
          />
        );
      }
    },
    [templatePreviews, handleDeleteMessage, handleRetryMessage, isDarkMode, t, aiInteractions.length],
  );

  // Render skeleton loader
  const renderSkeletonMessage = useCallback(() => (
    <View style={[styles.messageContainer, { width: MESSAGE_CARD_WIDTH, marginHorizontal: MESSAGE_CARD_MARGIN }]}>
      <Animated.View style={styles.skeletonContainer}>
        <LinearGradient
          colors={['#E0E0E0', '#D1D1D1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.skeletonGradient}
        >
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonContent} />
        </LinearGradient>
      </Animated.View>
    </View>
  ), []);

  // Render empty conversation
  const renderEmptyConversation = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('conversation.empty')}</Text>
      <TouchableOpacity
        style={[globalStyles.button, tw`mt-md`]}
        onPress={() => setIsNewConversationModalVisible(true)}
        accessibilityLabel={t('conversation.new')}
      >
        <Text style={globalStyles.buttonText}>{t('conversation.startNew')}</Text>
      </TouchableOpacity>
    </View>
  ), [t]);

  // Handle loading or error states
  if (!userId || !isReady || isLoading) {
    return (
      <View style={[globalStyles.container, tw`flex-1 justify-center items-center`]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[globalStyles.text, tw`mt-md`]}>{userId ? t('loading') : t('pleaseLogin')}</Text>
      </View>
    );
  }

  if (aiError) {
    return (
      <View style={[globalStyles.container, tw`flex-1 justify-center items-center`]}>
        <Text style={[globalStyles.text, tw`text-error`]}>{t('errors.aiError', { error: aiError })}</Text>
        <TouchableOpacity
          style={[globalStyles.button, tw`mt-md`]}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('navigation.back')}
        >
          <Text style={globalStyles.buttonText}>{t('ok')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, tw`flex-1`]}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
            analytics.track('Navigation_Back', { screen: 'GeminiChat' });
          }}
          style={styles.backButton}
          accessibilityLabel={t('navigation.back')}
          accessibilityRole="button"
        >
          <AntDesign name="arrowleft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[globalStyles.title, tw`text-center flex-1`]}>{t('chat.title')}</Text>
        <TouchableOpacity
          onPress={() => {
            setIsConversationModalVisible(true);
            analytics.track('Conversation_Modal_Opened', {});
          }}
          style={styles.conversationButton}
          accessibilityLabel={t('conversation.manage')}
          accessibilityRole="button"
        >
          <AntDesign name="message1" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Template Carousel */}
      <AITemplateCarousel onAction={handleAction} />

      {/* Conversation Scroll */}
      <Animated.View style={[styles.contentContainer, contentStyle]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.conversationScrollContainer}
        >
          {conversations.map((conversation) => (
            <View key={conversation.id || conversation.title} style={styles.conversationPage}>
              <View style={styles.conversationHeader}>
                <Text style={[globalStyles.title, tw`flex-1`]}>{conversation.title}</Text>
                <TouchableOpacity
                  onPress={() => {
                    deleteConversation(conversation.id || '');
                    analytics.track('Conversation_Deleted', { conversationId: conversation.id });
                  }}
                  style={styles.deleteButton}
                  accessibilityLabel={t('conversation.delete')}
                  accessibilityRole="button"
                >
                  <AntDesign name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              {currentConversation?.id === conversation.id && (
                <>
                  {isLoadingTemplates ? (
                    <FlatList
                      data={Array(3).fill({})}
                      renderItem={renderSkeletonMessage}
                      keyExtractor={(_, index) => `skeleton-${index}`}
                      contentContainerStyle={styles.messageListContainer}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <FlatList
                      ref={messageListRef}
                      data={aiInteractions.filter((msg) => msg.conversationId === conversation.id)}
                      renderItem={renderMessage}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.messageListContainer}
                      showsVerticalScrollIndicator={false}
                      onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
                      ListEmptyComponent={renderEmptyConversation}
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                    />
                  )}
                  {isTyping && (
                    <View style={styles.typingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={[globalStyles.text, tw`ml-sm`]}>{t('aiTyping')}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Message Input */}
      <MessageInput onSendText={handleSendText} onSendImage={handleSendImage} />

      {/* Utility Buttons */}
      <View style={styles.utilityButtons}>
        <TouchableOpacity
          onPress={() => {
            const lastMessage = aiInteractions[aiInteractions.length - 1];
            const textContent =
              typeof lastMessage.content === 'string'
                ? lastMessage.content
                : lastMessage?.content?.type || JSON.stringify(lastMessage?.content) || '';
            speakText(textContent);
          }}
          style={styles.utilityButton}
          disabled={aiInteractions.length === 0}
          accessibilityLabel={isSpeaking ? t('stopSpeaking') : t('speakMessage')}
          accessibilityRole="button"
        >
          <AntDesign
            name={isSpeaking ? 'sound' : 'mute'}
            size={24}
            color={isSpeaking ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => messageListRef.current?.scrollToEnd({ animated: true })}
          style={styles.utilityButton}
          accessibilityLabel={t('scrollToBottom')}
          accessibilityRole="button"
        >
          <AntDesign name="down" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ModalComponent
        visible={isNetworkErrorModalVisible}
        onClose={() => setIsNetworkErrorModalVisible(false)}
        title={t('errors.networkError')}
      >
        <Text style={globalStyles.text}>{networkErrorMessage}</Text>
        <TouchableOpacity
          onPress={() => setIsNetworkErrorModalVisible(false)}
          style={[globalStyles.button, tw`mt-md`]}
        >
          <Text style={globalStyles.buttonText}>{t('ok')}</Text>
        </TouchableOpacity>
      </ModalComponent>

      <ModalComponent
        visible={isConversationModalVisible}
        onClose={() => setIsConversationModalVisible(false)}
        title={t('conversation.manage')}
      >
        <ScrollView contentContainerStyle={styles.modalContent}>
          {conversations.map((item) => (
            <View key={item.id || item.title} style={styles.conversationItem}>
              <Text style={globalStyles.text}>{item.title}</Text>
              <View style={tw`flex-row gap-sm`}>
                <TouchableOpacity
                  onPress={() => deleteConversation(item.id || '')}
                  style={styles.smallButton}
                  accessibilityLabel={t('conversation.delete')}
                  accessibilityRole="button"
                >
                  <AntDesign name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSelectConversation(item.id || '')}
                  style={styles.smallButton}
                  disabled={currentConversation?.id === item.id}
                  accessibilityLabel={t('conversation.select')}
                  accessibilityRole="button"
                >
                  <AntDesign
                    name="arrowright"
                    size={20}
                    color={currentConversation?.id === item.id ? theme.colors.textSecondary : theme.colors.success}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setIsNewConversationModalVisible(true)}
            style={[globalStyles.button, tw`mt-md`]}
            accessibilityLabel={t('conversation.new')}
            accessibilityRole="button"
          >
            <Text style={globalStyles.buttonText}>{t('conversation.new')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ModalComponent>

      <ModalComponent
        visible={isNewConversationModalVisible}
        onClose={() => setIsNewConversationModalVisible(false)}
        title={t('conversation.new')}
      >
        <TextInput
          style={[conversationStyles.aiMessage, tw`mb-md`]}
          placeholder={t('conversation.titlePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={newConversationTitle}
          onChangeText={setNewConversationTitle}
          accessibilityLabel={t('conversation.titleInput')}
          accessibilityRole="text"
        />
        <TouchableOpacity
          onPress={handleNewConversation}
          style={globalStyles.button}
          accessibilityLabel={t('conversation.create')}
          accessibilityRole="button"
        >
          <Text style={globalStyles.buttonText}>{t('conversation.create')}</Text>
        </TouchableOpacity>
      </ModalComponent>

      <ModalComponent
        visible={isTitleMissingModalVisible}
        onClose={() => setIsTitleMissingModalVisible(false)}
        title={t('errors.titleMissing')}
      >
        <Text style={globalStyles.text}>{t('errors.enterTitle')}</Text>
        <TouchableOpacity
          onPress={() => setIsTitleMissingModalVisible(false)}
          style={[globalStyles.button, tw`mt-md`]}
        >
          <Text style={globalStyles.buttonText}>{t('ok')}</Text>
        </TouchableOpacity>
      </ModalComponent>

      {/* Toast Notifications */}
      {toast.visible && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, visible: false })}
          duration={3000}
        />
      )}
    </View>
  );
};

// Comprehensive styles for all UI components
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
    elevation: 4,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
  },
  conversationButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
  },
  contentContainer: {
    flex: 1,
  },
  conversationScrollContainer: {
    flexGrow: 1,
  },
  conversationPage: {
    width,
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
    elevation: 2,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
  },
  messageListContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: theme.spacing.sm,
    maxWidth: MESSAGE_CARD_WIDTH,
    alignSelf: 'flex-end',
  },
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.medium,
    marginLeft: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  actionButtons: {
    flexDirection: 'column',
    marginLeft: theme.spacing.xs,
  },
  messageActionButton: {
    padding: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.surface,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  utilityButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 32,
    right: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  utilityButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalContent: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.sm,
    elevation: 1,
  },
  smallButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.surface,
  },
  skeletonContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    minHeight: 200,
  },
  skeletonGradient: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  skeletonIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#C0C0C0',
    borderRadius: 14,
    marginBottom: theme.spacing.xs,
    alignSelf: 'center',
  },
  skeletonTitle: {
    width: '80%',
    height: 20,
    backgroundColor: '#C0C0C0',
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    alignSelf: 'center',
  },
  skeletonContent: {
    flex: 1,
    backgroundColor: '#D1D1D1',
    borderRadius: 8,
    minHeight: 150,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default memo(GeminiChatScreen);
