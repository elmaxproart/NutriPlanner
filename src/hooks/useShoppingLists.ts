import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { ListeCourses } from '../constants/entities';
import { validateListeCourses } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useShoppingLists = (userId: string, familyId: string) => {
  const [shoppingLists, setShoppingLists] = useState<ListeCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShoppingLists = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getShoppingLists();
      setShoppingLists(data);
      logger.info('Shopping lists fetched', { count: data.length });
    } catch (err: any) {
      logger.error('Error fetching shopping lists', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des listes de courses');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  const addShoppingList = async (list: Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateListeCourses(list);
    if (errors.length > 0) {
      logger.error('Validation failed for shopping list', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const listId = await firestoreService.addShoppingList(list);
      await fetchShoppingLists();
      logger.info('Shopping list added', { listId });
      return listId;
    } catch (err: any) {
      logger.error('Error adding shopping list', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout de la liste de courses');
      return null;
    }
  };

  return { shoppingLists, loading, error, fetchShoppingLists, addShoppingList };
};
