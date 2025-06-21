
import { AiInteraction, AiInteractionType, Budget, Ingredient, ListeCourses, MembreFamille, Menu, Recette, Store } from '../constants/entities';
import { Unit } from '../constants/units';
import { PromptType } from '../services/prompts';

/**
 * Props interface for template components.
 * Defines the data passed to each template for rendering AI interactions.
 */
export interface TemplateProps {
  message: AiInteraction; // The AI interaction containing content and metadata
  promptType?: PromptType; // Optional PromptType for specific prompts
  interactionType: AiInteractionType; // Interaction type (e.g., 'text', 'image')
  onAction?: (action: string, data: any) => void; // Callback for user actions (e.g., share, delete)
  id: string; // Unique identifier for the message
}


export interface AudioContent {
  type: 'audio';
  uri: string;
  mimeType: string;
}
/**
 * Interface for nutritional data used in analysis templates.
 */
export interface NutritionData {
  id: string; // Unique identifier for the nutrient
  name: string; // Name of the nutrient (e.g., 'Protein')
  value: number; // Quantity of the nutrient
  unit: Unit; // Unit of measurement (e.g., 'g')
}

/**
 * Interface for food trends used in FoodTrendsTemplate.
 */
export interface FoodTrend {
  id: string; // Unique identifier for the trend
  name: string; // Name of the trend (e.g., 'Plant-based diets')
  description: string; // Description of the trend
  popularity: number; // Popularity score (e.g., 1-100)
}



/**
 * Content type for simple text messages.
 */
export interface TextContent {
  type: 'text';
  message: string; // Text content of the message
}

/**
 * Content type for JSON data.
 */
export interface JsonContent {
  type: 'json';
  data: object; // Structured JSON data
}

/**
 * Content type for images.
 */
export interface ImageContent {
  type: 'image';
  uri: string; // URL or local path to the image
  mimeType: string; // MIME type (e.g., 'image/jpeg')
  data?: string; // Optional base64-encoded image data
  description?: string; // Optional text description of the image
}

/**
 * Content type for menu suggestions.
 */
export interface MenuSuggestionContent {
  type: 'menu_suggestion';
  menu: Menu; // Menu entity
  description: string; // Description of the menu
  recipes: Recette[]; // Associated recipes
}

/**
 * Content type for shopping list suggestions.
 */
export interface ShoppingListSuggestionContent {
  type: 'shopping_list_suggestion';
  listId: string; // Unique identifier for the list
  items: { name: string; quantity: number; unit: string; magasins: string }[]; // List items
}

/**
 * Content type for recipe analysis.
 */
export interface RecipeAnalysisContent {
  type: 'recipe_analysis';
  recipeId: string; // ID of the analyzed recipe
  analysis: {
    calories: number; // Total calories
    nutrients: NutritionData[]; // Nutritional breakdown
    description: string; // Analysis summary
  };
}

/**
 * Content type for recipe suggestions.
 */
export interface RecipeSuggestionContent {
  type: 'recipe_suggestion';
  recipeId: string; // ID of the suggested recipe
  name: string; // Name of the recipe
  description: string; // Description of the recipe
  ingredients: Ingredient[]; // Required ingredients
}

export interface RecipePersonnalizedContent {
  type: 'recipe_personalized';
  recipeId: string;
  name: string;
  description: string;
  membre: MembreFamille;
}

/**
 * Content type for tool usage by the AI.
 */
export interface ToolUseContent {
  type: 'tool_use';
  toolName: string; // Name of the tool (e.g., 'nutrition_api')
  parameters: object; // Parameters sent to the tool
}

/**
 * Content type for tool responses.
 */
export interface ToolResponseContent {
  type: 'tool_response';
  toolName: string; // Name of the tool
  result: object; // Result returned by the tool
}

/**
 * Content type for error messages.
 */
export interface ErrorContent {
  type: 'error';
  message: string; // Error message
  code?: string; // Optional error code
}

/**
 * Content type for recipe entities.
 */
export interface RecipeContent {
  type: 'recipe';
  recette: Recette; // Recipe entity
}

/**
 * Content type for menu entities.
 */
export interface MenuContent {
  type: 'menu';
  menu: Menu; // Menu entity
}

/**
 * Content type for shopping list entities.
 */
export interface ShoppingListContent {
  type: 'shopping';
  listeCourses: ListeCourses; // Shopping list entity
}

/**
 * Content type for budget entities.
 */
export interface BudgetContent {
  type: 'budget';
  budget: Budget; // Budget entity
}

/**
 * Content type for ingredient availability checks.
 */
export interface IngredientAvailabilityContent {
  type: 'ingredient_availability';
  stores: Store[]; // Available stores
  ingredients: { nom: string; disponible: boolean; magasin?: string }[]; // Ingredient availability
}

/**
 * Content type for food trends.
 */
export interface FoodTrendsContent {
  type: 'food_trends';
  trends: FoodTrend[];
}

/**
 * Content type for nutritional information.
 */
export interface NutritionalInfoContent {
  type: 'nutritional_info';
  recipeId?: string; // Optional recipe ID
  analysis: {
    calories: number; // Total calories
    nutrients: NutritionData[]; // Nutritional breakdown
    description?: string; // Optional description
  };
}

/**
 * Content type for troubleshooting problems.
 */
export interface TroubleshootProblemContent {
  type: 'troubleshoot_problem';
  question: string; // User's question or issue
  solution: string; // Proposed solution
}

/**
 * Content type for creative ideas.
 */
export interface CreativeIdeasContent {
  type: 'creative_ideas';
  ideas: { name: string; description: string }[]; // List of ideas
}

/**
 * Content type for store suggestions.
 */
export interface StoreSuggestionContent {
  type: 'stores';
  stores: Store[];
  recommendation?: string; // Optional recommendation text
}

/**
 * Content type for recipe compatibility checks.
 */
export interface RecipeCompatibilityContent {
  type: 'recipe_compatibility';
  recette: Recette;
  compatibility: {
    isCompatible: boolean; // Compatibility status
    reason?: string[]; // Optional issues with compatibility
    recommendations?: string[]; // Suggestions for improvement
  };
}
