import { useState, useCallback, useMemo } from 'react';
import { GeminiService } from '../services/GeminiService';
import { Ingredient, Recette, Menu, MembreFamille } from '../constants/entities';
import { logger } from '../utils/logger';

export const useGeminiSuggestions = () => {
  const [suggestions, setSuggestions] = useState<(Recette | Menu)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geminiService = useMemo(() => new GeminiService(), []);

  const getMenuSuggestions = useCallback(async (ingredients: Ingredient[], familyData: MembreFamille[]) => {
    setLoading(true);
    try {
      const menus = await geminiService.getMenuSuggestions(ingredients, familyData);
      setSuggestions(menus);
      logger.info('Menu suggestions fetched', { count: menus.length });
      return menus;
    } catch (err: any) {
      logger.error('Error fetching menu suggestions', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des suggestions de menu');
      return [];
    } finally {
      setLoading(false);
    }
  }, [geminiService]);

  const getRecipeSuggestions = useCallback(async (ingredients: Ingredient[], preferences: { niveauEpices: number; cuisinesPreferees: string[] }) => {
    setLoading(true);
    try {
      const recipes = await geminiService.generateRecipeSuggestions(ingredients, preferences);
      setSuggestions(recipes);
      logger.info('Recipe suggestions fetched', { count: recipes.length });
      return recipes;
    } catch (err: any) {
      logger.error('Error fetching recipe suggestions', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des suggestions de recettes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [geminiService]);

  const generateShoppingList = useCallback(async (menu: Menu) => {
    setLoading(true);
    try {
      const shoppingList = await geminiService.generateShoppingList(menu);
      logger.info('Shopping list generated', { menuId: menu.id });
      return shoppingList;
    } catch (err: any) {
      logger.error('Error generating shopping list', { error: err.message });
      setError(err.message || 'Erreur lors de la génération de la liste de courses');
      return [];
    } finally {
      setLoading(false);
    }
  }, [geminiService]);

  return { suggestions, loading, error, getMenuSuggestions, getRecipeSuggestions, generateShoppingList };
};
