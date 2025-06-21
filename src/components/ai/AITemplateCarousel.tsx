// AITemplateCarousel.tsx
// Carrousel pour afficher les templates IA en aperçu, avec navigation vers la page de chat après ouverture des modals nécessaires.

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { commonStyles } from '../../styles/commonStyles';
import { theme } from '../../styles/theme';
import { useAIConversation } from '../../hooks/useAIConversation';
import { AITemplate } from '../../constants/mockData';
import { PromptType } from '../../services/prompts';

import InputQueryModal from './modals/InputQueryModal';
import SelectBudgetModal from './modals/SelectBudgetModal';
import SelectDateModal from './modals/SelectDateModal';
import SelectDietModal from './modals/SelectDietModal';
import SelectFamilyMemberModal from './modals/SelectFamilyMemberModal';
import SelectFamilyMembersModal from './modals/SelectFamilyMembersModal';
import SelectGuestCountModal from './modals/SelectGuestCountModal';
import SelectImageModal from './modals/SelectImageModal';
import SelectIngredientModal from './modals/SelectIngredientModal';
import SelectIngredientsModal from './modals/SelectIngredientsModal';
import SelectLocationModal from './modals/SelectLocationModal';
import SelectMealModal from './modals/SelectMealModal';
import SelectMenuModal from './modals/SelectMenuModal';
import SelectMonthModal from './modals/SelectMonthModal';
import SelectOccasionModal from './modals/SelectOccasionModal';
import SelectPreferencesModal from './modals/SelectPreferencesModal';
import SelectRecipeModal from './modals/SelectRecipeModal';
import { RootStackParamList } from '../../App';
import { generateUniqueId, getErrorMessage } from '../../utils/helpers';
import { AiInteractionContent, AiInteractionType, AiInteraction } from '../../constants/entities';
import { useTranslation } from 'react-i18next';
import { Ingredient, MembreFamille, Menu, Recette, HistoriqueRepas } from '../../constants/entities';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

// Interface pour les props du composant
interface AITemplateCarouselProps {
  templates?: AITemplate[];
}

// Type de navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface pour la carte du carrousel
interface TemplateCardProps {
  item: AITemplate;
  onPress: (template: AITemplate) => void;
  isActive: boolean;
}

// Composant pour chaque carte du carrousel
const TemplateCard: React.FC<TemplateCardProps> = ({ item, onPress, isActive }) => {
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);
  const { t } = useTranslation();

  // Animation de la carte
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isActive ? withSpring(1.1) : withSpring(1) }],
    opacity: isActive ? 1 : 0.7,
  }));

  return (
    <TouchableOpacity
      style={[styles.card, isPressed && styles.cardPressed]}
      onPress={() => onPress(item)}
      onPressIn={() => {
        setIsPressed(true);
        scale.value = withSpring(1.05);
      }}
      onPressOut={() => {
        setIsPressed(false);
        scale.value = withSpring(1);
      }}
      accessibilityLabel={t(`templates.${item.id}.title`)}
      accessibilityHint={t(`templates.${item.id}.description`)}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      activeOpacity={1}
    >
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <LinearGradient
          colors={[item.backgroundColor, theme.colors.gradientEnd]}
          style={styles.cardGradient}
        >
          <MaterialCommunityIcons
            name={item.iconName}
            size={40}
            color={theme.colors.white}
            style={styles.icon}
          />
          <Text style={styles.cardTitle}>{t(`templates.${item.id}.title`)}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {t(`templates.${item.id}.description`)}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Composant principal du carrousel
const AITemplateCarousel: React.FC<AITemplateCarouselProps> = ({ templates: propTemplates }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {
    isReady,
    loading,
    error,
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
  } = useAIConversation();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState<{
    type: PromptType | 'AIActionModal' | null;
    template?: AITemplate;
    modalData?: any;
  }>({ type: null });


  const defaultTemplates: AITemplate[] = [
    {
      id: PromptType.RECIPE_PERSONALIZED,
      title: t('templates.recipe_personalized.title'),
      description: t('templates.recipe_personalized.description'),
      iconName: 'chef-hat',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.WEEKLY_MENU,
      title: t('templates.weekly_menu.title'),
      description: t('templates.weekly_menu.description'),
      iconName: 'calendar',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.SHOPPING_LIST,
      title: t('templates.shopping_list.title'),
      description: t('templates.shopping_list.description'),
      iconName: 'cart',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.RECIPE_NUTRITION_ANALYSIS,
      title: t('templates.recipe_nutrition_analysis.title'),
      description: t('templates.recipe_nutrition_analysis.description'),
      iconName: 'nutrition',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.RECIPE_SUGGESTION,
      title: t('templates.recipe_suggestion.title'),
      description: t('templates.recipe_suggestion.description'),
      iconName: 'lightbulb',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.QUICK_RECIPE,
      title: t('templates.quick_recipe.title'),
      description: t('templates.quick_recipe.description'),
      iconName: 'clock-fast',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.BUDGET_PLANNING,
      title: t('templates.budget_planning.title'),
      description: t('templates.budget_planning.description'),
      iconName: 'cash',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.STORE_SUGGESTION,
      title: t('templates.store_suggestion.title'),
      description: t('templates.store_suggestion.description'),
      iconName: 'store',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.MEAL_ANALYSIS,
      title: t('templates.meal_analysis.title'),
      description: t('templates.meal_analysis.description'),
      iconName: 'food-fork-drink',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.KIDS_RECIPE,
      title: t('templates.kids_recipe.title'),
      description: t('templates.kids_recipe.description'),
      iconName: 'teddy-bear',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.SPECIAL_OCCASION_MENU,
      title: t('templates.special_occasion_menu.title'),
      description: t('templates.special_occasion_menu.description'),
      iconName: 'party-popper',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.INVENTORY_OPTIMIZATION,
      title: t('templates.inventory_optimization.title'),
      description: t('templates.inventory_optimization.description'),
      iconName: 'recycle',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.INGREDIENT_BASED_RECIPE,
      title: t('templates.ingredient_based_recipe.title'),
      description: t('templates.ingredient_based_recipe.description'),
      iconName: 'food-apple',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.BUDGET_MENU,
      title: t('templates.budget_menu.title'),
      description: t('templates.budget_menu.description'),
      iconName: 'wallet',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.RECIPE_COMPATIBILITY,
      title: t('templates.recipe_compatibility.title'),
      description: t('templates.recipe_compatibility.description'),
      iconName: 'check-circle',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.SPECIFIC_DIET_RECIPE,
      title: t('templates.specific_diet_recipe.title'),
      description: t('templates.specific_diet_recipe.description'),
      iconName: 'leaf',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.BALANCED_DAILY_MENU,
      title: t('templates.balanced_daily_menu.title'),
      description: t('templates.balanced_daily_menu.description'),
      iconName: 'scale-balance',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.RECIPE_FROM_IMAGE,
      title: t('templates.recipe_from_image.title'),
      description: t('templates.recipe_from_image.description'),
      iconName: 'image',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.LEFTOVER_RECIPE,
      title: t('templates.leftover_recipe.title'),
      description: t('templates.leftover_recipe.description'),
      iconName: 'food-variant',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.GUEST_RECIPE,
      title: t('templates.guest_recipe.title'),
      description: t('templates.guest_recipe.description'),
      iconName: 'account-group',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.INGREDIENT_AVAILABILITY,
      title: t('templates.ingredient_availability.title'),
      description: t('templates.ingredient_availability.description'),
      iconName: 'magnify',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
    {
      id: PromptType.NUTRITIONAL_INFO,
      title: t('templates.nutritional_info.title'),
      description: t('templates.nutritional_info.description'),
      iconName: 'information',
      backgroundColor: theme.colors.primary,
      animationType: 'slide',
    },
    {
      id: PromptType.TROUBLESHOOT_PROBLEM,
      title: t('templates.troubleshoot_problem.title'),
      description: t('templates.troubleshoot_problem.description'),
      iconName: 'wrench',
      backgroundColor: theme.colors.gradientEnd,
      animationType: 'fade',
    },
    {
      id: PromptType.CREATIVE_IDEAS,
      title: t('templates.creative_ideas.title'),
      description: t('templates.creative_ideas.description'),
      iconName: 'lightbulb-on',
      backgroundColor: theme.colors.surface,
      animationType: 'slide',
    },
    {
      id: PromptType.FOOD_TREND_ANALYSIS,
      title: t('templates.food_trend_analysis.title'),
      description: t('templates.food_trend_analysis.description'),
      iconName: 'chart-line',
      backgroundColor: theme.colors.gradientStart,
      animationType: 'pop',
    },
  ];

  const templates = propTemplates || defaultTemplates;

  // Formatage d’une interaction IA
  const formatAiInteraction = useCallback(
    (content: AiInteractionContent, type: AiInteractionType, conversationId: string = generateUniqueId()): AiInteraction => {
      const timestamp = new Date().toISOString();
      return {
        id: generateUniqueId(),
        content,
        isUser: false,
        timestamp,
        type,
        dateCreation: timestamp,
        dateMiseAJour: timestamp,
        conversationId,
      };
    },
    [],
  );

  // Gestion du défilement
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / SNAP_INTERVAL);
      setActiveIndex(index);
    },
  });

  // Navigation vers GeminiChat
  const navigateToChat = useCallback(
    (interaction: AiInteraction, promptType: PromptType) => {
      navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType });
      AccessibilityInfo.announceForAccessibility(t('navigation.chat', { promptType }));
    },
    [navigation, t],
  );

  // Gestion des sélections de templates
  const handleTemplatePress = useCallback(
    (template: AITemplate) => {
      setModalVisible({ type: template.id, template, modalData: {} });
      AccessibilityInfo.announceForAccessibility(t('modal.opened', { title: template.title }));
    },
    [t],
  );

  // Gestion de la soumission et navigation entre modals
  const handleModalSubmit = useCallback(
    async (modalType: PromptType, data: any, isFinalStep: boolean = false) => {
      try {
        let interaction: AiInteraction | null = null;
        const conversationId = generateUniqueId();
        const currentModalData = { ...modalVisible.modalData, ...data };

        if (isFinalStep) {
          switch (modalType) {
            case PromptType.RECIPE_PERSONALIZED: {
              const recette = await generatePersonalizedRecipe(data.member as MembreFamille);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.WEEKLY_MENU: {
              const menu = await generateWeeklyMenu(data.members as MembreFamille[], data.dateStart as string);
              interaction = formatAiInteraction(
                { type: 'menu_suggestion', menu, description: t('templates.weekly_menu.description'), recipes: menu.recettes || [] },
                'menu_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.SHOPPING_LIST: {
              const items = await generateShoppingList(data.menu as Menu, data.currentIngredients as Ingredient[]);
              interaction = formatAiInteraction(
                { type: 'shopping_list_suggestion', listId: generateUniqueId(), items },
                'shopping_list_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.RECIPE_NUTRITION_ANALYSIS: {
              const analysis = await analyzeRecipe(data.recipe as Recette, data.familyData as MembreFamille[]);
              interaction = formatAiInteraction(
                { type: 'recipe_analysis', recipeId: data.recipe.id, analysis },
                'recipe_analysis',
                conversationId,
              );
              break;
            }
            case PromptType.RECIPE_SUGGESTION: {
              const recette = await generateRecipeSuggestions(data.ingredients as Ingredient[], data.preferences as { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string });
              interaction = formatAiInteraction(
                {
                  type: 'recipe_suggestion',
                  recipeId: recette.id,
                  name: recette.nom,
                  description: t('templates.recipe_suggestion.description'),
                  ingredients: recette.ingredients,
                },
                'recipe_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.QUICK_RECIPE: {
              const recette = await generateQuickRecipe(data.member as MembreFamille);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.BUDGET_PLANNING: {
              const budget = await generateBudgetPlan(data.budgetLimit as number, data.month as string);
              interaction = formatAiInteraction({ type: 'budget', budget }, 'budget', conversationId);
              break;
            }
            case PromptType.STORE_SUGGESTION: {
              const stores = await suggestStore(data.ingredient as Ingredient);
              interaction = formatAiInteraction(
                { type: 'stores', stores, recommendation: t('templates.store_suggestion.recommendation', { ingredient: data.ingredient.nom }) },
                'stores',
                conversationId,
              );
              break;
            }
            case PromptType.MEAL_ANALYSIS: {
              const analysis = await analyzeMeal(data.historiqueRepas as HistoriqueRepas, data.member as MembreFamille);
              interaction = formatAiInteraction(
                { type: 'recipe_analysis', recipeId: data.historiqueRepas.id, analysis },
                'recipe_analysis',
                conversationId,
              );
              break;
            }
            case PromptType.KIDS_RECIPE: {
              const recette = await generateKidsRecipe(data.member as MembreFamille);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.SPECIAL_OCCASION_MENU: {
              const menu = await generateSpecialOccasionMenu(data.members as MembreFamille[], data.occasion as string, data.date as string);
              interaction = formatAiInteraction(
                { type: 'menu_suggestion', menu, description: t('templates.special_occasion_menu.description', { occasion: data.occasion }), recipes: menu.recettes || [] },
                'menu_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.INVENTORY_OPTIMIZATION: {
              const recette = await optimizeInventory(data.ingredients as Ingredient[]);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.INGREDIENT_BASED_RECIPE: {
              const recette = await generateIngredientBasedRecipe(data.ingredient as Ingredient, data.member as MembreFamille);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.BUDGET_MENU: {
              const menu = await generateBudgetMenu(data.members as MembreFamille[], data.budget as number);
              interaction = formatAiInteraction(
                { type: 'menu_suggestion', menu, description: t('templates.budget_menu.description'), recipes: menu.recettes || [] },
                'menu_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.RECIPE_COMPATIBILITY: {
              const compatibility = await checkRecipeCompatibility(data.recipe as Recette, data.members as MembreFamille[]);
              interaction = formatAiInteraction(
                { type: 'recipe_compatibility', recette: data.recipe, compatibility },
                'recipe_compatibility',
                conversationId,
              );
              break;
            }
            case PromptType.SPECIFIC_DIET_RECIPE: {
              const recette = await generateSpecificDietRecipe(data.member as MembreFamille, data.diet as string);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.BALANCED_DAILY_MENU: {
              const menu = await generateBalancedDailyMenu(data.member as MembreFamille, data.date as string);
              interaction = formatAiInteraction(
                { type: 'menu_suggestion', menu, description: t('templates.balanced_daily_menu.description'), recipes: menu.recettes || [] },
                'menu_suggestion',
                conversationId,
              );
              break;
            }
            case PromptType.RECIPE_FROM_IMAGE: {
              const recette = await generateRecipeFromImage(data.imageUrl as string, data.member as MembreFamille);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.LEFTOVER_RECIPE: {
              const recette = await generateLeftoverRecipe(data.ingredients as Ingredient[]);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.GUEST_RECIPE: {
              const recette = await generateGuestRecipe(data.members as MembreFamille[], data.guestCount as number);
              interaction = formatAiInteraction({ type: 'recipe', recette }, 'recipe', conversationId);
              break;
            }
            case PromptType.INGREDIENT_AVAILABILITY: {
              const availability = await checkIngredientAvailability(data.ingredientName as string, data.location as { latitude: number; longitude: number });
              interaction = formatAiInteraction(
                { type: 'ingredient_availability', stores: availability.stores, ingredients: availability.ingredients },
                'ingredient_availability',
                conversationId,
              );
              break;
            }
            case PromptType.NUTRITIONAL_INFO: {
              const analysis = await getNutritionalInfo(data.query as string);
              interaction = formatAiInteraction({ type: 'nutritional_info', analysis }, 'nutritional_info', conversationId);
              break;
            }
            case PromptType.TROUBLESHOOT_PROBLEM: {
              const solution = await troubleshootProblem(data.query as string);
              interaction = formatAiInteraction(
                { type: 'troubleshoot_problem', question: data.query, solution },
                'troubleshoot_problem',
                conversationId,
              );
              break;
            }
            case PromptType.CREATIVE_IDEAS: {
              const ideas = await getCreativeIdeas(data.query as string);
              interaction = formatAiInteraction(
                { type: 'creative_ideas', ideas: ideas.map((idea) => ({ name: idea.name, description: idea.description })) },
                'creative_ideas',
                conversationId,
              );
              break;
            }
            case PromptType.FOOD_TREND_ANALYSIS: {
              const trends = await analyzeFoodTrends(data.members as MembreFamille[]);
              interaction = formatAiInteraction(
                {
                  type: 'food_trends',
                  trends: trends.map((trend: any) => ({
                    id: generateUniqueId(),
                    name: trend.name,
                    description: trend.description,
                    popularity: trend.popularity || 80,
                  })),
                },
                'food_trends',
                conversationId,
              );
              break;
            }
            default:
              throw new Error(t('errors.unsupportedModalType', { modalType }));
          }

          if (interaction) {
            navigateToChat(interaction, modalType);
          }
        } else {
          // Navigation vers le modal suivant
          let nextModalType: PromptType | null = null;
          switch (modalType) {
            case PromptType.WEEKLY_MENU:
              nextModalType = PromptType.WEEKLY_MENU; // Rester sur le même pour passer à SelectDateModal
              break;
            case PromptType.SHOPPING_LIST:
              nextModalType = PromptType.SHOPPING_LIST; // Passer à SelectIngredientsModal
              break;
            case PromptType.RECIPE_SUGGESTION:
              nextModalType = PromptType.RECIPE_SUGGESTION; // Passer à SelectPreferencesModal
              break;
            case PromptType.SPECIAL_OCCASION_MENU:
              if (!currentModalData.occasion) {
                nextModalType = PromptType.SPECIAL_OCCASION_MENU; // Passer à SelectOccasionModal
              } else {
                nextModalType = PromptType.SPECIAL_OCCASION_MENU; // Passer à SelectDateModal
              }
              break;
            case PromptType.BUDGET_MENU:
              nextModalType = PromptType.BUDGET_MENU; // Passer à SelectBudgetModal
              break;
            case PromptType.BALANCED_DAILY_MENU:
              nextModalType = PromptType.BALANCED_DAILY_MENU; // Passer à SelectDateModal
              break;
            case PromptType.INGREDIENT_BASED_RECIPE:
              nextModalType = PromptType.INGREDIENT_BASED_RECIPE; // Passer à SelectIngredientModal
              break;
            case PromptType.SPECIFIC_DIET_RECIPE:
              nextModalType = PromptType.SPECIFIC_DIET_RECIPE; // Passer à SelectDietModal
              break;
            case PromptType.GUEST_RECIPE:
              nextModalType = PromptType.GUEST_RECIPE; // Passer à SelectGuestCountModal
              break;
            case PromptType.BUDGET_PLANNING:
              nextModalType = PromptType.BUDGET_PLANNING; // Passer à SelectMonthModal
              break;
            case PromptType.RECIPE_COMPATIBILITY:
              nextModalType = PromptType.RECIPE_COMPATIBILITY; // Passer à SelectRecipeModal
              break;
            case PromptType.MEAL_ANALYSIS:
              nextModalType = PromptType.MEAL_ANALYSIS; // Passer à SelectMealModal
              break;
            case PromptType.RECIPE_FROM_IMAGE:
              nextModalType = PromptType.RECIPE_FROM_IMAGE; // Passer à SelectImageModal
              break;
            case PromptType.INGREDIENT_AVAILABILITY:
              nextModalType = PromptType.INGREDIENT_AVAILABILITY; // Passer à SelectLocationModal
              break;
            default:
              throw new Error(t('errors.noNextModal', { modalType }));
          }

          setModalVisible({ type: nextModalType, template: modalVisible.template, modalData: currentModalData });
        }
      } catch (err) {
        console.error(t('errors.modalSubmission', { modalType }), err);
        const errorInteraction = formatAiInteraction(
          { type: 'error', message: getErrorMessage(err) },
          'error',
          generateUniqueId(),
        );
        navigateToChat(errorInteraction, modalType);
        AccessibilityInfo.announceForAccessibility(t('errors.actionExecution'));
      } finally {
        if (isFinalStep) {
          setModalVisible({ type: null });
        }
      }
    },
    [
      modalVisible,
      navigateToChat,
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
      formatAiInteraction,
      t,
    ],
  );

  // Gestion de la fermeture des modals
  const handleModalClose = useCallback(() => {
    setModalVisible({ type: null });
    AccessibilityInfo.announceForAccessibility(t('modal.closed'));
  }, [t]);

  // Rendu des modals en fonction du type et de l'étape
  const renderModal = () => {
    if (!modalVisible.type || !modalVisible.template) {return null;}

    const modalData = modalVisible.modalData || {};
    const modalProps = {
      visible: !!modalVisible.type,
      onClose: handleModalClose,
      onSelect: (data: any, isFinalStep: boolean = false) =>
        handleModalSubmit(modalVisible.type as PromptType, data, isFinalStep),
      modalData,
    };

    switch (modalVisible.type) {
      case PromptType.RECIPE_PERSONALIZED:
        return <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />;
      case PromptType.WEEKLY_MENU:
        return modalData.members ? (
          <SelectDateModal {...modalProps} title={t('modals.selectDate')} isFinalStep />
        ) : (
          <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} />
        );
      case PromptType.SHOPPING_LIST:
        return modalData.menu ? (
          <SelectIngredientsModal {...modalProps} title={t('modals.selectIngredients')} isFinalStep />
        ) : (
          <SelectMenuModal {...modalProps} title={t('modals.selectMenu')} />
        );
      case PromptType.RECIPE_NUTRITION_ANALYSIS:
        return <SelectRecipeModal {...modalProps} title={t('modals.selectRecipe')} isFinalStep />;
      case PromptType.RECIPE_SUGGESTION:
        return modalData.ingredients ? (
          <SelectPreferencesModal {...modalProps} title={t('modals.selectPreferences')} isFinalStep />
        ) : (
          <SelectIngredientsModal {...modalProps} title={t('modals.selectIngredients')} />
        );
      case PromptType.QUICK_RECIPE:
        return <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} isFinalStep />;
      case PromptType.BUDGET_PLANNING:
        return modalData.budgetLimit ? (
          <SelectMonthModal {...modalProps} title={t('modals.selectMonth')} isFinalStep />
        ) : (
          <SelectBudgetModal {...modalProps} title={t('modals.selectBudget')} />
        );
      case PromptType.STORE_SUGGESTION:
        return <SelectIngredientModal {...modalProps} title={t('modals.selectIngredient')} isFinalStep />;
      case PromptType.MEAL_ANALYSIS:
        return modalData.member ? (
          <SelectMealModal {...modalProps} title={t('modals.selectMeal')} isFinalStep />
        ) : (
          <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />
        );
      case PromptType.KIDS_RECIPE:
        return <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} isFinalStep />;
      case PromptType.SPECIAL_OCCASION_MENU:
        if (modalData.occasion) {
          return <SelectDateModal {...modalProps} title={t('modals.selectDate')} isFinalStep />;
        } else if (modalData.members) {
          return <SelectOccasionModal {...modalProps} title={t('modals.selectOccasion')} />;
        } else {
          return <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} />;
        }
      case PromptType.INVENTORY_OPTIMIZATION:
        return <SelectIngredientsModal {...modalProps} title={t('modals.selectIngredients')} isFinalStep />;
      case PromptType.INGREDIENT_BASED_RECIPE:
        return modalData.member ? (
          <SelectIngredientModal {...modalProps} title={t('modals.selectIngredient')} isFinalStep />
        ) : (
          <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />
        );
      case PromptType.BUDGET_MENU:
        return modalData.members ? (
          <SelectBudgetModal {...modalProps} title={t('modals.selectBudget')} isFinalStep />
        ) : (
          <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} />
        );
      case PromptType.RECIPE_COMPATIBILITY:
        return modalData.members ? (
          <SelectRecipeModal {...modalProps} title={t('modals.selectRecipe')} isFinalStep />
        ) : (
          <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} />
        );
      case PromptType.SPECIFIC_DIET_RECIPE:
        return modalData.member ? (
          <SelectDietModal {...modalProps} title={t('modals.selectDiet')} isFinalStep />
        ) : (
          <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />
        );
      case PromptType.BALANCED_DAILY_MENU:
        return modalData.member ? (
          <SelectDateModal {...modalProps} title={t('modals.selectDate')} isFinalStep />
        ) : (
          <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />
        );
      case PromptType.RECIPE_FROM_IMAGE:
        return modalData.member ? (
          <SelectImageModal {...modalProps} title={t('modals.selectImage')} isFinalStep />
        ) : (
          <SelectFamilyMemberModal {...modalProps} title={t('modals.selectFamilyMember')} />
        );
      case PromptType.LEFTOVER_RECIPE:
        return <SelectIngredientsModal {...modalProps} title={t('modals.selectIngredients')} isFinalStep />;
      case PromptType.GUEST_RECIPE:
        return modalData.members ? (
          <SelectGuestCountModal {...modalProps} title={t('modals.selectGuestCount')} isFinalStep />
        ) : (
          <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} />
        );
      case PromptType.INGREDIENT_AVAILABILITY:
        return modalData.ingredientName ? (
          <SelectLocationModal availableLocations={[]} {...modalProps} title={t('modals.selectLocation')} isFinalStep />
        ) : (
          <SelectIngredientModal {...modalProps} title={t('modals.selectIngredient')} />
        );
      case PromptType.NUTRITIONAL_INFO:
        return <InputQueryModal {...modalProps} title={t('modals.inputQuery')} isFinalStep />;
      case PromptType.TROUBLESHOOT_PROBLEM:
        return <InputQueryModal {...modalProps} title={t('modals.inputQuery')} isFinalStep />;
      case PromptType.CREATIVE_IDEAS:
        return <InputQueryModal {...modalProps} title={t('modals.inputQuery')} isFinalStep />;
      case PromptType.FOOD_TREND_ANALYSIS:
        return <SelectFamilyMembersModal {...modalProps} title={t('modals.selectFamilyMembers')} isFinalStep />;
      default:
        return null;
    }
  };

  // Gestion de l’état de chargement ou d’erreur
  if (!isReady || loading) {
    return (
      <View style={commonStyles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.centeredContainer}>
        <Text style={commonStyles.loadingText}>{t('errors.loadingTemplates')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={templates}
        renderItem={({ item, index }) => (
          <TemplateCard
            item={item}
            onPress={handleTemplatePress}
            isActive={index === activeIndex}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onScroll={scrollHandler}
        contentContainerStyle={styles.flatListContent}
      />
      {renderModal()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: theme.spacing.xxl,
  },
  flatListContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingVertical: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: theme.colors.surface,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.large,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.white,
    textAlign: 'center',
  },
});

export default AITemplateCarousel;
