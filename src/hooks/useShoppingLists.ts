import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { ListeCourses } from '../constants/entities';
import { validateListeCourses } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ListeCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, getCollection, addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();

  const fetchShoppingLists = useCallback(async () => {
    if (!firestoreService) {
      setError('Service Firestore non initialisé');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCollection<ListeCourses>('ShoppingLists');
      setShoppingLists(data);
      logger.info('Listes de courses récupérées', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération des listes de courses';
      logger.error('Erreur lors de la récupération des listes', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [firestoreService, getCollection]);

  useEffect(() => {
    if (!firestoreLoading && !firestoreError) {
      fetchShoppingLists();
    }
  }, [fetchShoppingLists, firestoreLoading, firestoreError]);

  const addShoppingList = useCallback(
    async (list: Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!firestoreService) {
        setError('Service Firestore non initialisé');
        return null;
      }

      const errors = validateListeCourses(list);
      if (errors.length > 0) {
        const errorMsg = `Validation failed: ${errors.join(', ')}`;
        logger.error('Validation failed pour liste de courses', { errors });
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const listId = await addEntity('ShoppingLists', list);
        if (listId) {
          await fetchShoppingLists();
          logger.info('Liste de courses ajoutée', { listId });
        }
        return listId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout de la liste de courses';
        logger.error('Erreur lors de l’ajout de la liste', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, addEntity, fetchShoppingLists]
  );

  return {
    shoppingLists,
    loading: loading || firestoreLoading,
    error: error || firestoreError,
    fetchShoppingLists,
    addShoppingList,
  };
};
