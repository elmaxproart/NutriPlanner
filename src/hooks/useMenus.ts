import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { MealPlanningService } from '../services/MealPlanningService';
import { Menu, MembreFamille, Ingredient, Recette } from '../constants/entities';
import { validateMenu } from '../utils/dataValidators';
import { calculateMenuCost } from '../utils/helpers';
import { logger } from '../utils/logger';

export const useMenus = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, getCollection, addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();
  const { userId, loading: authLoading } = useAuth();

  const fetchMenus = useCallback(async () => {
    if (!firestoreService || !userId) {
      setError('Service Firestore ou utilisateur non initialisé');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCollection<Menu>('Menus');
      setMenus(data);
      logger.info('Menus récupérés', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération des menus';
      logger.error('Erreur lors de la récupération des menus', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [firestoreService, getCollection, userId]);

  useEffect(() => {
    if (!firestoreLoading && !firestoreError && !authLoading && userId) {
      fetchMenus();
    } else if (firestoreError) {
      setError(firestoreError);
      setLoading(false);
    } else if (authLoading) {
      setLoading(true);
    }
  }, [fetchMenus, firestoreLoading, firestoreError, authLoading, userId]);

  const addMenu = useCallback(
    async (menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        return null;
      }

      const errors = validateMenu(menu);
      if (errors.length > 0) {
        const errorMsg = `Validation échouée: ${errors.join(', ')}`;
        logger.error('Validation échouée pour menu', { errors });
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const menuWithCreator = { ...menu, createurId: userId };
        const menuId = await addEntity('Menus', menuWithCreator);
        if (menuId) {
          await fetchMenus();
          logger.info('Menu ajouté', { menuId });
        }
        return menuId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout du menu';
        logger.error('Erreur lors de l’ajout du menu', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, addEntity, fetchMenus, userId]
  );

  const estimateMenuCost = useCallback(
    async (menu: Menu) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        return 0;
      }

      setLoading(true);
      setError(null);
      try {
        const recipes = await getCollection<Recette>('Recipes');
        const ingredients = await getCollection<Ingredient>('Ingredients');
        const cost = calculateMenuCost(menu, recipes, ingredients);
        logger.info('Coût du menu estimé', { menuId: menu.id, cost });
        return cost;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’estimation du coût du menu';
        logger.error('Erreur lors de l’estimation du coût', { error: errorMsg });
        setError(errorMsg);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, getCollection, userId]
  );

  const optimizeMenu = useCallback(
    async (menu: Menu, familyMembers: MembreFamille[], conversationId?: string) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const mealPlanningService = new MealPlanningService(firestoreService, userId);
        const optimizedMenu = await mealPlanningService.optimizeMenu(menu, familyMembers, conversationId);
        if (optimizedMenu) {
          await fetchMenus();
          logger.info('Menu optimisé', { menuId: optimizedMenu.id });
        }
        return optimizedMenu;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’optimisation du menu';
        logger.error('Erreur lors de l’optimisation du menu', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, fetchMenus, userId]
  );

  const generateWeeklyPlan = useCallback(
    async (familyMembers: MembreFamille[], startDate: string, conversationId?: string) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore ou utilisateur non initialisé');
        return [];
      }

      if (!familyMembers.length || !startDate) {
        setError('Membres de la famille et date de début requis');
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const mealPlanningService = new MealPlanningService(firestoreService, userId);
        const menusGenere = await mealPlanningService.generateWeeklyPlan(familyMembers, startDate, conversationId);
        await fetchMenus();
        logger.info('Plan hebdomadaire généré', { count: menusGenere.length });
        return menusGenere;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la génération du plan hebdomadaire';
        logger.error('Erreur lors de la génération du plan hebdomadaire', { error: errorMsg });
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, fetchMenus, userId]
  );

  return {
    menus,
    loading: loading || firestoreLoading || authLoading,
    error: error || firestoreError,
    fetchMenus,
    addMenu,
    estimateMenuCost,
    optimizeMenu,
    generateWeeklyPlan,
  };
};
