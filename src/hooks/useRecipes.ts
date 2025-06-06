import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { RecipeService } from '../services/RecipeService';
import { Recette } from '../constants/entities';
import { validateRecette } from '../utils/dataValidators';
import { calculateRecipeCost } from '../utils/helpers';
import { logger } from '../utils/logger';

export const useRecipes = (userId: string, familyId: string) => {
  const [recipes, setRecipes] = useState<Recette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getRecipes();
      setRecipes(data);
      logger.info('Recipes fetched', { count: data.length });
    } catch (err: any) {
      logger.error('Error fetching recipes', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des recettes');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addRecipe = async (recipe: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateRecette(recipe);
    if (errors.length > 0) {
      logger.error('Validation failed for recipe', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const recipeId = await firestoreService.addRecipe(recipe);
      await fetchRecipes();
      logger.info('Recipe added', { recipeId });
      return recipeId;
    } catch (err: any) {
      logger.error('Error adding recipe', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout de la recette');
      return null;
    }
  };

  const estimateCost = async (recipe: Recette) => {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const ingredients = await firestoreService.getIngredients();
      const cost = calculateRecipeCost(recipe, ingredients);
      logger.info('Recipe cost estimated', { recipeId: recipe.id, cost });
      return cost;
    } catch (err: any) {
      logger.error('Error estimating recipe cost', { error: err.message });
      setError(err.message || 'Erreur lors de l’estimation du coût');
      return 0;
    }
  };

  const analyzeRecipe = async (recipe: Recette) => {
    try {
      const recipeService = new RecipeService();
      const analysis = await recipeService.analyzeNutritionalValue(recipe);
      logger.info('Recipe analyzed', { recipeId: recipe.id });
      return analysis;
    } catch (err: any) {
      logger.error('Error analyzing recipe', { error: err.message });
      setError(err.message || 'Erreur lors de l’analyse de la recette');
      return null;
    }
  };

  return { recipes, loading, error, fetchRecipes, addRecipe, estimateCost, analyzeRecipe };
};
