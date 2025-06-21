import { PromptType } from '../services/prompts';
import RecipeTemplate from '../components/template/RecipeTemplate';
import MenuTemplate from '../components/template/MenuTemplate';
import ShoppingListTemplate from '../components/template/ShoppingListTemplate';
import BudgetPlanTemplate from '../components/template/BudgetPlanTemplate';
import IngredientAvailabilityTemplate from '../components/template/IngredientAvailabilityTemplate';
import NutritionAnalysisTemplate from '../components/template/NutritionAnalysisTemplate';
import FoodTrendsTemplate from '../components/template/FoodTrendsTemplate';
import TextMessageTemplate from '../components/template/TextMessageTemplate';
import ErrorMessageTemplate from '../components/template/ErrorMessageTemplate';
import ImageMessageTemplate from '../components/template/ImageMessageTemplate';
import TroubleshootProblemTemplate from '../components/template/TroubleshootProblemTemplate';
import CreativeIdeasTemplate from '../components/template/CreativeIdeasTemplate';
import StoreSuggestionTemplate from '../components/template/StoreSuggestionTemplate';
import RecipeCompatibilityTemplate from '../components/template/RecipeCompatibilityTemplate';
import { theme } from '../styles/theme';
import { TemplateProps } from '../types/messageTypes';
import { AiInteractionType } from './entities';

/**
 * Interface defining the configuration for a message template.
 * Each template specifies its component, styling, and behavior.
 */
export interface TemplateConfig {
  id: string; // Unique identifier for the template
  component: React.FC<TemplateProps>; // React component to render the template
  backgroundColor: string; // Background color from theme or custom hex
  iconName: string;
  showActionButtons: boolean; // Whether to display action buttons (e.g., share, copy)
  animationType: 'fade' | 'slide' | 'pop' | 'none'; // Animation type for entry
}

/**
 * Mapping of PromptType and interaction types to their respective template configurations.
 * Used by getTemplate to select the appropriate template based on prompt or interaction type.
 */
export const templateConfig: Record<string, TemplateConfig> = {
  [PromptType.RECIPE_PERSONALIZED]: {
    id: 'recipe_personalized',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'restaurant',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.QUICK_RECIPE]: {
    id: 'quick_recipe',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'timer',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.KIDS_RECIPE]: {
    id: 'kids_recipe',
    component: RecipeTemplate,
    backgroundColor: theme.colors.warning,
    iconName: 'child-friendly',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.INGREDIENT_BASED_RECIPE]: {
    id: 'ingredient_based_recipe',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'kitchen',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.SPECIFIC_DIET_RECIPE]: {
    id: 'specific_diet_recipe',
    component: RecipeTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'healing',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.RECIPE_SUGGESTION]: {
    id: 'recipe_suggestion',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'lightbulb-outline',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.RECIPE_FROM_IMAGE]: {
    id: 'recipe_from_image',
    component: RecipeTemplate,
    backgroundColor: theme.colors.error,
    iconName: 'camera-alt',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.LEFTOVER_RECIPE]: {
    id: 'leftover_recipe',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'recycle',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.GUEST_RECIPE]: {
    id: 'guest_recipe',
    component: RecipeTemplate,
    backgroundColor: '#9C27B0',
    iconName: 'group',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.INVENTORY_OPTIMIZATION]: {
    id: 'inventory_optimization',
    component: RecipeTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'inventory',
    showActionButtons: true,
    animationType: 'pop',
  },
  [PromptType.WEEKLY_MENU]: {
    id: 'weekly_menu',
    component: MenuTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'calendar-today',
    showActionButtons: true,
    animationType: 'slide',
  },
  [PromptType.SPECIAL_OCCASION_MENU]: {
    id: 'special_occasion_menu',
    component: MenuTemplate,
    backgroundColor: theme.colors.warning,
    iconName: 'celebration',
    showActionButtons: true,
    animationType: 'slide',
  },
  [PromptType.BUDGET_MENU]: {
    id: 'budget_menu',
    component: MenuTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'attach-money',
    showActionButtons: true,
    animationType: 'slide',
  },
  [PromptType.BALANCED_DAILY_MENU]: {
    id: 'balanced_daily_menu',
    component: MenuTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'balance',
    showActionButtons: true,
    animationType: 'slide',
  },
  [PromptType.SHOPPING_LIST]: {
    id: 'shopping_list',
    component: ShoppingListTemplate,
    backgroundColor: theme.colors.error,
    iconName: 'shopping-cart',
    showActionButtons: true,
    animationType: 'slide',
  },
  [PromptType.BUDGET_PLANNING]: {
    id: 'budget_planning',
    component: BudgetPlanTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'account-balance',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.INGREDIENT_AVAILABILITY]: {
    id: 'ingredient_availability',
    component: IngredientAvailabilityTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'store',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.RECIPE_NUTRITION_ANALYSIS]: {
    id: 'recipe_nutrition_analysis',
    component: NutritionAnalysisTemplate,
    backgroundColor: '#9C27B0',
    iconName: 'analytics',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.MEAL_ANALYSIS]: {
    id: 'meal_analysis',
    component: NutritionAnalysisTemplate,
    backgroundColor: '#9C27B0',
    iconName: 'analytics',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.FOOD_TREND_ANALYSIS]: {
    id: 'food_trend_analysis',
    component: FoodTrendsTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'trending-up',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.NUTRITIONAL_INFO]: {
    id: 'nutritional_info',
    component: NutritionAnalysisTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'info',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.TROUBLESHOOT_PROBLEM]: {
    id: 'troubleshoot_problem',
    component: TroubleshootProblemTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'help-outline',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.CREATIVE_IDEAS]: {
    id: 'creative_ideas',
    component: CreativeIdeasTemplate,
    backgroundColor: theme.colors.warning,
    iconName: 'lightbulb-outline',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.STORE_SUGGESTION]: {
    id: 'store_suggestion',
    component: StoreSuggestionTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'storefront',
    showActionButtons: true,
    animationType: 'fade',
  },
  [PromptType.RECIPE_COMPATIBILITY]: {
    id: 'recipe_compatibility',
    component: RecipeCompatibilityTemplate,
    backgroundColor: theme.colors.secondary,
    iconName: 'check-circle',
    showActionButtons: true,
    animationType: 'pop',
  },
  text: {
    id: 'text',
    component: TextMessageTemplate,
    backgroundColor: '#333',
    iconName: 'chat',
    showActionButtons: false,
    animationType: 'none',
  },
  error: {
    id: 'error',
    component: ErrorMessageTemplate,
    backgroundColor: theme.colors.error,
    iconName: 'error-outline',
    showActionButtons: false,
    animationType: 'none',
  },
  json: {
    id: 'json',
    component: TextMessageTemplate,
    backgroundColor: '#333',
    iconName: 'code',
    showActionButtons: true,
    animationType: 'none',
  },
  image: {
    id: 'image',
    component: ImageMessageTemplate,
    backgroundColor: '#333',
    iconName: 'image',
    showActionButtons: true,
    animationType: 'none',
  },
  menu_suggestion: {
    id: 'menu_suggestion',
    component: MenuTemplate,
    backgroundColor: theme.colors.info,
    iconName: 'calendar-today',
    showActionButtons: true,
    animationType: 'slide',
  },
  shopping_list_suggestion: {
    id: 'shopping_list_suggestion',
    component: ShoppingListTemplate,
    backgroundColor: theme.colors.error,
    iconName: 'shopping-cart',
    showActionButtons: true,
    animationType: 'slide',
  },
  recipe_analysis: {
    id: 'recipe_analysis',
    component: NutritionAnalysisTemplate,
    backgroundColor: '#9C27B0',
    iconName: 'analytics',
    showActionButtons: true,
    animationType: 'fade',
  },
  tool_use: {
    id: 'tool_use',
    component: TextMessageTemplate,
    backgroundColor: '#333',
    iconName: 'build',
    showActionButtons: false,
    animationType: 'none',
  },
  tool_response: {
    id: 'tool_response',
    component: TextMessageTemplate,
    backgroundColor: '#333',
    iconName: 'build',
    showActionButtons: false,
    animationType: 'none',
  },
};

/**
 * Retrieves the appropriate template configuration based on prompt or interaction type.
 * Falls back to the default 'text' template if no specific mapping is found.
 * @param promptType - The PromptType, if available
 * @param interactionType - The interaction type (e.g., 'text', 'image')
 * @returns The corresponding TemplateConfig
 */
export const getTemplate = (
  promptType: PromptType | undefined,
  interactionType: AiInteractionType,
): TemplateConfig => {
  return promptType && templateConfig[promptType]
    ? templateConfig[promptType]
    : templateConfig[interactionType] || templateConfig.text;
};
