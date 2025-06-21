import { useState, useEffect, useCallback } from 'react';
import { Budget } from '../constants/entities';
import { validateBudget } from '../utils/dataValidators';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';
import { FirestoreService } from '../services/FirestoreService';
import { useAuth } from './useAuth';

export const useBudget = () => {
  const { userId } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null);

  useEffect(() => {
    if (userId) {
      setFirestoreService(new FirestoreService(userId));
    } else {
      setFirestoreService(null);
    }
  }, [userId]);

  const fetchBudgets = useCallback(async () => {
    if (!firestoreService) {
      setError('FirestoreService non initialisé.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await firestoreService.getBudgets();
      setBudgets(data);
      logger.info('Budgets récupérés avec succès', { count: data.length });
    } catch (err: any) {
      logger.error('Erreur lors de la récupération des budgets', { error: err.message, stack: err.stack });
      setError(err.message || 'Erreur lors de la récupération des budgets.');
    } finally {
      setLoading(false);
    }
  }, [firestoreService]);

  // Exécuter fetchBudgets au montage du composant
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Ajout d'un budget
  const addBudget = async (budget: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    // Créer un objet Budget complet avec les dates avant la validation et la soumission
    const newBudgetWithDates: Budget = {
      ...budget,
      id: '', // L'ID sera généré par Firestore
      dateCreation: formatDate(new Date()),
      dateMiseAJour: formatDate(new Date()),
    };

    // Validation
    const errors = validateBudget(newBudgetWithDates);
    if (errors.length > 0) {
      setError(`Validation échouée : ${errors.join(', ')}`);
      return null;
    }

    if (!firestoreService) {
      setError('FirestoreService non initialisé.');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const budgetId = await firestoreService.addBudget(newBudgetWithDates);
      await fetchBudgets(); // Rafraîchir la liste après l'ajout
      logger.info('Budget ajouté avec succès', { budgetId });
      return budgetId;
    } catch (err: any) {
      logger.error('Erreur lors de l’ajout du budget', { error: err.message, stack: err.stack });
      setError(err.message || 'Erreur lors de l’ajout du budget.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier les alertes budgétaires (logique purement client-side)
  const checkBudgetAlerts = useCallback((budget: Budget): string[] => {
    const alerts: string[] = [];
    const totalSpent = budget.depenses.reduce((sum, d) => sum + d.montant, 0);
    const plafond = budget.plafond;

    if (totalSpent > plafond) {
      alerts.push(`Le budget de ${budget.mois} est **dépassé** de ${(totalSpent - plafond).toFixed(2)} ${budget.devise}.`);
    } else if (plafond > 0 && totalSpent >= plafond * 0.9) {
      alerts.push(`Attention : Vous avez atteint 90% de votre budget pour ${budget.mois}. Total dépensé : ${totalSpent.toFixed(2)} ${budget.devise}.`);
    } else if (plafond > 0 && totalSpent >= plafond * 0.75) {
        alerts.push(`Alerte : Vous avez dépensé plus de 75% de votre budget pour ${budget.mois}.`);
    }

    logger.info('Vérification des alertes budgétaires effectuée localement', { budgetId: budget.id, alerts });
    return alerts;
  }, []);

  return { budgets, loading, error, fetchBudgets, addBudget, checkBudgetAlerts };
};



