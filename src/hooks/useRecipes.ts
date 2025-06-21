import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { RecipeService } from '../services/RecipeService';
import { Recette, Ingredient } from '../constants/entities';
import { logger } from '../utils/logger';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recette[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, getCollection, addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();
  const { userId, loading: authLoading } = useAuth();

  const recipeService = useMemo(() => {
    return firestoreService && userId ? new RecipeService(firestoreService, userId) : null;
  }, [firestoreService, userId]);

  const fetchRecipes = useCallback(async () => {
    if (!firestoreService || !recipeService || !userId) {
      setError('Service Firestore ou utilisateur non initialisé');
      logger.warn('FirestoreService, RecipeService, or userId not initialized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCollection<Recette>('Recipes');
      setRecipes(data);
      logger.info('Recettes récupérées', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération des recettes';
      logger.error('Erreur lors de la récupération des recettes', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [firestoreService, recipeService, getCollection, userId]);

  useEffect(() => {
    if (!firestoreLoading && !firestoreError && !authLoading && userId) {
      fetchRecipes();
    } else if (firestoreError) {
      setError(firestoreError);
      setLoading(false);
    } else if (authLoading) {
      setLoading(true);
    }
  }, [fetchRecipes, firestoreLoading, firestoreError, authLoading, userId]);

  const addRecipe = useCallback(
    async (recipe: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>) => {
      if (!firestoreService || !recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('FirestoreService, RecipeService, or userId not initialized');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const recipeWithCreator = { ...recipe, createurId: userId };
        const recipeId = await addEntity('Recipes', recipeWithCreator);
        if (recipeId) {
          await fetchRecipes();
          logger.info('Recette ajoutée', { recipeId });
        }
        return recipeId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout de la recette';
        logger.error('Erreur lors de l’ajout de la recette', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, recipeService, addEntity, fetchRecipes, userId]
  );

  const getRecipeById = useCallback(
    async (recipeId: string) => {
      if (!recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('RecipeService or userId not initialized');
        return null;
      }

      if (!recipeId) {
        setError('ID de recette requis');
        logger.warn('Recipe ID is required');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const recipe = await recipeService.getRecipeById(recipeId);
        if (recipe) {
          logger.info('Recette récupérée par ID', { recipeId });
        } else {
          logger.info('Aucune recette trouvée pour cet ID', { recipeId });
        }
        return recipe;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la récupération de la recette';
        logger.error('Erreur lors de la récupération de la recette', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [recipeService, userId]
  );

  const searchRecipes = useCallback(
    async (criteria: { categorie?: string; difficulte?: string; maxTime?: number }) => {
      if (!recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('RecipeService or userId not initialized');
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const results = await recipeService.searchRecipes(criteria);
        logger.info('Recherche de recettes effectuée', { criteria, count: results.length });
        return results;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la recherche des recettes';
        logger.error('Erreur lors de la recherche des recettes', { error: errorMsg });
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [recipeService, userId]
  );

  const suggestRecipes = useCallback(
    async (
      ingredients: Ingredient[],
      preferences: { niveauEpices: string; cuisinesPreferees: string[]; mealType?: string },
      conversationId?: string
    ) => {
      if (!recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('RecipeService or userId not initialized');
        return [];
      }

      if (!ingredients.length || !preferences) {
        setError('Ingrédients et préférences requis');
        logger.warn('Ingredients and preferences are required');
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const suggestions = await recipeService.suggestRecipes(ingredients, preferences, conversationId);
        await fetchRecipes();
        logger.info('Suggestions de recettes générées', { count: suggestions.length });
        return suggestions;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la suggestion des recettes';
        logger.error('Erreur lors de la suggestion des recettes', { error: errorMsg });
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [recipeService, fetchRecipes, userId]
  );

  const estimateCost = useCallback(
    async (recipeId: string) => {
      if (!recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('RecipeService or userId not initialized');
        return 0;
      }

      if (!recipeId) {
        setError('ID de recette requis pour l’estimation du coût');
        logger.warn('Recipe ID is required for cost estimation');
        return 0;
      }

      setLoading(true);
      setError(null);
      try {
        const cost = await recipeService.estimateRecipeCost(recipeId);
        if (cost !== null) {
          logger.info('Coût de la recette estimé', { recipeId, cost });
          return cost;
        }
        logger.info('Impossible d’estimer le coût de la recette', { recipeId });
        return 0;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’estimation du coût';
        logger.error('Erreur lors de l’estimation du coût', { error: errorMsg });
        setError(errorMsg);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [recipeService, userId]
  );

  const analyzeRecipe = useCallback(
    async (recipe: Recette, conversationId?: string) => {
      if (!recipeService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        logger.warn('RecipeService or userId not initialized');
        return null;
      }

      if (!recipe) {
        setError('Recette requise pour l’analyse');
        logger.warn('Recipe is required for analysis');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const analysis = await recipeService.analyzeNutritionalInfo(recipe, conversationId);
        if (analysis) {
          logger.info('Recette analysée', { recipeId: recipe.id });
          return analysis;
        }
        logger.info('Aucune analyse disponible pour la recette', { recipeId: recipe.id });
        return null;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’analyse de la recette';
        logger.error('Erreur lors de l’analyse de la recette', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [recipeService, userId]
  );

  return {
    recipes,
    loading: loading || firestoreLoading || authLoading,
    error: error || firestoreError,
    fetchRecipes,
    addRecipe,
    getRecipeById,
    searchRecipes,
    suggestRecipes,
    estimateCost,
    analyzeRecipe,
  };
};
