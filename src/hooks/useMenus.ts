import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { MealPlanningService } from '../services/MealPlanningService';
import { Menu, MembreFamille } from '../constants/entities';
import { validateMenu } from '../utils/dataValidators';
import { calculateMenuCost } from '../utils/helpers';
import { logger } from '../utils/logger';

export const useMenus = (userId: string, familyId: string) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getMenus();
      setMenus(data);
      logger.info('Menus fetched', { count: data.length });
    } catch (err: any) {
      logger.error('Error fetching menus', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des menus');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const addMenu = async (menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateMenu(menu);
    if (errors.length > 0) {
      logger.error('Validation failed for menu', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const menuId = await firestoreService.addMenu(menu);
      await fetchMenus();
      logger.info('Menu added', { menuId });
      return menuId;
    } catch (err: any) {
      logger.error('Error adding menu', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout du menu');
      return null;
    }
  };

  const estimateMenuCost = async (menu: Menu) => {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const recipes = await firestoreService.getRecipes();
      const ingredients = await firestoreService.getIngredients();
      const cost = calculateMenuCost(menu, recipes, ingredients);
      logger.info('Menu cost estimated', { menuId: menu.id, cost });
      return cost;
    } catch (err: any) {
      logger.error('Error estimating menu cost', { error: err.message });
      setError(err.message || 'Erreur lors de l’estimation du coût du menu');
      return 0;
    }
  };

  const optimizeMenu = async (menu: Menu, familyMembers: MembreFamille[]) => {
    try {
      const mealPlanningService = new MealPlanningService(userId, familyId);
      const optimizedMenu = await mealPlanningService.optimizeMenu(menu, familyMembers);
      await fetchMenus();
      logger.info('Menu optimized', { menuId: menu.id });
      return optimizedMenu;
    } catch (err: any) {
      logger.error('Error optimizing menu', { error: err.message });
      setError(err.message || 'Erreur lors de l’optimisation du menu');
      return null;
    }
  };

  return { menus, loading, error, fetchMenus, addMenu, estimateMenuCost, optimizeMenu };
};
