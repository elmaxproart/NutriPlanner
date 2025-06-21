import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { HistoriqueRepas } from '../constants/entities';
import { validateHistoriqueRepas } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useMealHistory = (menuId?: string) => {
  const [mealHistory, setMealHistory] = useState<HistoriqueRepas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, getCollection, addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();

  const fetchMealHistory = useCallback(async () => {
    if (!firestoreService) {
      setError('Service Firestore non initialisé');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCollection<HistoriqueRepas>('HistoriqueRepas', menuId);
      setMealHistory(data);
      logger.info('Historique des repas récupéré', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération de l’historique des repas';
      logger.error('Erreur lors de la récupération de l’historique', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [firestoreService, getCollection, menuId]);

  useEffect(() => {
    if (!firestoreLoading && !firestoreError) {
      fetchMealHistory();
    }
  }, [fetchMealHistory, firestoreLoading, firestoreError]);

  const addMealHistory = useCallback(
    async (history: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!firestoreService) {
        setError('Service Firestore non initialisé');
        return null;
      }

      const errors = validateHistoriqueRepas(history);
      if (errors.length > 0) {
        const errorMsg = `Validation failed: ${errors.join(', ')}`;
        logger.error('Validation failed pour historique repas', { errors });
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const historyId = await addEntity('HistoriqueRepas', history);
        if (historyId) {
          await fetchMealHistory();
          logger.info('Historique repas ajouté', { historyId });
        }
        return historyId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout de l’historique des repas';
        logger.error('Erreur lors de l’ajout de l’historique', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, addEntity, fetchMealHistory]
  );

  return {
    mealHistory,
    loading: loading || firestoreLoading,
    error: error || firestoreError,
    fetchMealHistory,
    addMealHistory,
  };
};
