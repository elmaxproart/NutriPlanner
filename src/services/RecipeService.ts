import { Recette, Ingredient } from '../constants/entities';
import { FirestoreService } from './FirestoreService';
import { GeminiService } from './GeminiService';
import { validateRecette } from '../utils/dataValidators';
import { calculateRecipeCost } from '../utils/helpers';
import { logger } from '../utils/logger';

export class RecipeService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async getRecipeById(recipeId: string, userId: string, familyId: string): Promise<Recette | null> {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const recipes = await firestoreService.getRecipes();
      const recipe = recipes.find(r => r.id === recipeId) || null;
      if (recipe) {logger.info('Recipe fetched by ID', { recipeId });}
      return recipe;
    } catch (error) {
      logger.error('Error fetching recipe by ID', { error });
      throw new Error('Failed to fetch recipe');
    }
  }

  async searchRecipes(criteria: { categorie?: string; difficulte?: string; maxTime: number }, userId: string, familyId: string): Promise<Recette[]> {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      let recipes = await firestoreService.getRecipes();
      if (criteria.categorie) {recipes = recipes.filter(r => r.categorie === criteria.categorie);}
      if (criteria.difficulte) {recipes = recipes.filter(r => r.difficulte === criteria.difficulte);}
      if (criteria.maxTime !== undefined) {
        recipes = recipes.filter(r => {
          const prepTime = r.tempsPreparation || 0;
          const cookTime = r.tempsCuisson || 0;
          return prepTime + cookTime <= criteria.maxTime;
        });
      }
      logger.info('Recipes searched', { criteria, count: recipes.length });
      return recipes;
    } catch (error) {
      logger.error('Error searching recipes', { error });
      throw new Error('Failed to search recipes');
    }
  }

  async suggestRecipes(ingredients: Ingredient[], preferences: { niveauEpices: number; cuisinesPreferees: string[] }, userId: string, familyId: string): Promise<Recette[]> {
    try {
      const recipes = await this.geminiService.generateRecipeSuggestions(ingredients, preferences);
      const firestoreService = new FirestoreService(userId, familyId);
      await Promise.all(recipes.map(recipe => firestoreService.addRecipe(recipe)));
      logger.info('Recipes suggested and saved', { count: recipes.length });
      return recipes;
    } catch (error) {
      logger.error('Error suggesting recipes', { error });
      throw new Error('Failed to suggest recipes');
    }
  }

  async analyzeNutritionalValue(recipe: Recette): Promise<{ calories: number; proteins: number; carbs: number; fats: number }> {
    const errors = validateRecette(recipe);
    if (errors.length > 0) {
      logger.error('Validation failed for recipe', { errors });
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    try {
      const analysis = await this.geminiService.analyzeRecipe(recipe);
      const totalCalories = analysis.calories;
      const totalIngredients = recipe.ingredients.length;
      const avgNutritionalValue = totalIngredients > 0 ? {
        proteins: (analysis.calories * 0.2) / totalIngredients, // Approximation
        carbs: (analysis.calories * 0.5) / totalIngredients,
        fats: (analysis.calories * 0.3) / totalIngredients,
      } : { proteins: 0, carbs: 0, fats: 0 };
      logger.info('Nutritional value analyzed', { recipeId: recipe.id });
      return { calories: totalCalories, ...avgNutritionalValue };
    } catch (error) {
      logger.error('Error analyzing nutritional value', { error });
      throw new Error('Failed to analyze nutritional value');
    }
  }

  async estimateRecipeCost(recipe: Recette, userId: string, familyId: string): Promise<number> {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const ingredients = await firestoreService.getIngredients();
      const cost = calculateRecipeCost(recipe, ingredients);
      logger.info('Recipe cost estimated', { recipeId: recipe.id, cost });
      return cost;
    } catch (error) {
      logger.error('Error estimating recipe cost', { error });
      throw new Error('Failed to estimate recipe cost');
    }
  }
}
