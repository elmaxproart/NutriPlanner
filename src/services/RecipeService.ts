import { FirestoreService } from './FirestoreService';
import { GeminiService } from './GeminiService';
import { Recette, Ingredient } from '../constants/entities';
import { validateRecette } from '../utils/dataValidators';
import { calculateRecipeCost } from '../utils/helpers';
import { logger } from '../utils/logger';

export class RecipeService {
  private firestoreService: FirestoreService;
  private geminiService: GeminiService;
  private userId: string;

  constructor(firestoreService: FirestoreService, userId: string) {
    if (!firestoreService) {
      throw new Error('FirestoreService is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.firestoreService = firestoreService;
    this.geminiService = new GeminiService(userId);
    this.userId = userId;
  }

  async getRecipeById(recipeId: string): Promise<Recette | null> {
    if (!recipeId) {
      logger.error('Recipe ID is required');
      return null;
    }

    try {

      const recipes = await this.firestoreService.getRecipes();
      const recipe = recipes.find((r) => r.id === recipeId) || null;
      if (recipe) {
        logger.info('Recipe fetched by ID', { recipeId });
      } else {
        logger.info('No recipe found for ID', { recipeId });
      }
      return recipe;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch recipe';
      logger.error('Error fetching recipe by ID', { error: errorMsg });
      return null;
    }
  }

  async searchRecipes(criteria: { categorie?: string; difficulte?: string; maxTime?: number }): Promise<Recette[]> {
    try {
      let recipes = await this.firestoreService.getRecipes();
      if (criteria.categorie) {
        recipes = recipes.filter((r) => r.categorie === criteria.categorie);
      }
      if (criteria.difficulte) {
        recipes = recipes.filter((r) => r.difficulte === criteria.difficulte);
      }
      if (criteria.maxTime !== undefined) {
        recipes = recipes.filter((r) => {
          const prepTime = r.tempsPreparation || 0;
          const cookTime = r.tempsCuisson || 0;
          return prepTime + cookTime <= criteria.maxTime!;
        });
      }
      logger.info('Recipes searched', { criteria, count: recipes.length });
      return recipes;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to search recipes';
      logger.error('Error searching recipes', { error: errorMsg });
      return [];
    }
  }

  async suggestRecipes(
    ingredients: Ingredient[],
    preferences: { niveauEpices: string; cuisinesPreferees: string[]; mealType?: string },
    conversationId?: string
  ): Promise<Recette[]> {
    if (!ingredients.length || !preferences) {
      logger.error('Ingredients and preferences are required for recipe suggestions');
      return [];
    }

    try {
      // Convert niveauEpices from string to number
      const niveauEpicesMap: { [key: string]: number } = {
        low: 1,
        medium: 2,
        high: 3,
      };
      const niveauEpices = niveauEpicesMap[preferences.niveauEpices.toLowerCase()] || 2; // Default to medium

      const recipes = await this.geminiService.generateRecipeSuggestionsFromAI(
        this.userId,
        ingredients,
        {
          niveauEpices,
          cuisinesPreferees: preferences.cuisinesPreferees,
          mealType: preferences.mealType,
        },
        conversationId
      );

      const savedRecipes = await Promise.all(
        recipes.map(async (recipe) => {
          const recipeId = await this.firestoreService.addRecipe(recipe);
          return recipeId ? { ...recipe, id: recipeId, createurId: this.userId } : null;
        })
      );
      const validRecipes = savedRecipes.filter((recipe): recipe is Recette => recipe !== null);
      logger.info('Recipes suggested and saved', { count: validRecipes.length });
      return validRecipes;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to suggest recipes';
      logger.error('Error suggesting recipes', { error: errorMsg });
      return [];
    }
  }

  async analyzeNutritionalInfo(
    recipe: Recette,
    conversationId?: string
  ): Promise<{ calories: number; proteins: number; carbs: number; fats: number } | null> {
    const errors = validateRecette(recipe);
    if (errors.length > 0) {
      logger.error('Validation failed for recipe', { errors });
      return null;
    }

    try {
      const analysis = await this.geminiService.analyzeRecipeWithAI(this.userId, recipe, [], conversationId);
      const totalCalories = analysis.calories;
      const totalIngredients = recipe.ingredients.length;
      const avgNutritionalValue = totalIngredients > 0
        ? {
            proteins: (totalCalories * 0.2) / totalIngredients, // Estimate: 20% calories from proteins
            carbs: (totalCalories * 0.5) / totalIngredients, // Estimate: 50% calories from carbs
            fats: (totalCalories * 0.3) / totalIngredients, // Estimate: 30% calories from fats
          }
        : { proteins: 0, carbs: 0, fats: 0 };
      logger.info('Nutritional info analyzed', { recipeId: recipe.id });
      return { calories: totalCalories, ...avgNutritionalValue };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to analyze nutritional info';
      logger.error('Error analyzing nutritional info', { error: errorMsg });
      return null;
    }
  }

  async estimateRecipeCost(recipeId: string): Promise<number | null> {
    if (!recipeId) {
      logger.error('Recipe ID is required for cost estimation');
      return null;
    }

    try {
      const recipe = await this.getRecipeById(recipeId);
      if (!recipe) {
        logger.error('Recipe not found for cost estimation', { recipeId });
        return null;
      }
      const ingredients = await this.firestoreService.getIngredients();
      const cost = calculateRecipeCost(recipe, ingredients);
      logger.info('Recipe cost estimated', { recipeId, cost });
      return cost;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to estimate recipe cost';
      logger.error('Error estimating recipe cost', { error: errorMsg });
      return null;
    }
  }
}
