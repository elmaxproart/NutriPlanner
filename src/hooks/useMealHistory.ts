import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { HistoriqueRepas } from '../constants/entities';
import { validateHistoriqueRepas } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useMealHistory = (userId: string, familyId: string, menuId?: string) => {
  const [mealHistory, setMealHistory] = useState<HistoriqueRepas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealHistory = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getHistoriqueRepas(menuId || '');
      setMealHistory(data);
      logger.info('Meal history fetched', { count: data.length });
    } catch (err: any) {
      logger.error('Error fetching meal history', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération de l’historique des repas');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId, menuId]);

  useEffect(() => {
    fetchMealHistory();
  }, [fetchMealHistory]);

  const addMealHistory = async (history: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateHistoriqueRepas(history);
    if (errors.length > 0) {
      logger.error('Validation failed for meal history', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const historyId = await firestoreService.addHistoriqueRepas(history);
      await fetchMealHistory();
      logger.info('Meal history added', { historyId });
      return historyId;
    } catch (err: any) {
      logger.error('Error adding meal history', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout de l’historique des repas');
      return null;
    }
  };

  return { mealHistory, loading, error, fetchMealHistory, addMealHistory };
};
