import { FirestoreService } from './FirestoreService';
import { Budget } from '../constants/entities';
import { validateBudget } from '../utils/dataValidators';
import { formatDateForFirestore, isBudgetExceeded } from '../utils/helpers';
import { logger } from '../utils/logger';

export class BudgetService {
  private firestoreService: FirestoreService;

  constructor(firestoreService: FirestoreService) {
    if (!firestoreService) {
      throw new Error('FirestoreService is required');
    }
    this.firestoreService = firestoreService;
  }

  async createBudget(budget: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string | null> {
    const errors = validateBudget(budget);
    if (errors.length > 0) {
      logger.error('Validation failed for budget', { errors });
      return null;
    }

    try {
      const budgetId = await this.firestoreService.addBudget(budget);
      logger.info('Budget created', { id: budgetId });
      return budgetId;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create budget';
      logger.error('Error creating budget', { error: errorMsg });
      return null;
    }
  }

  async getBudget(mois: string): Promise<Budget | null> {
    if (!mois) {
      logger.error('Month is required for fetching budget');
      return null;
    }

    try {
      const budgets = await this.firestoreService.getBudgets();
      const budget = budgets.find(b => b.mois === mois) || null;
      if (budget && isBudgetExceeded(budget)) {
        logger.warn('Budget exceeded', { id: budget.id, mois });
      }
      if (budget) {
        logger.info('Budget fetched', { id: budget.id, mois });
      } else {
        logger.info('No budget found for month', { mois });
      }
      return budget;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch budget';
      logger.error('Error fetching budget', { error: errorMsg });
      return null;
    }
  }

  async updateBudget(budgetId: string, data: Partial<Budget>): Promise<boolean> {
    if (!budgetId) {
      logger.error('Budget ID is required for update');
      return false;
    }

    const errors = validateBudget(data);
    if (errors.length > 0) {
      logger.error('Validation failed for budget update', { errors });
      return false;
    }

    try {
      await this.firestoreService.updateBudget(budgetId, {
        ...data,
        dateMiseAJour: formatDateForFirestore(new Date()),
      });
      logger.info('Budget updated', { id: budgetId });
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update budget';
      logger.error('Error updating budget', { error: errorMsg });
      return false;
    }
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    if (!budgetId) {
      logger.error('Budget ID is required for deletion');
      return false;
    }

    try {
      const success = await this.firestoreService.deleteBudget(budgetId);
      if (success) {
        logger.info('Budget deleted', { id: budgetId });
      }
      return success;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to delete budget';
      logger.error('Error deleting budget', { error: errorMsg });
      return false;
    }
  }

  async checkBudgetAlerts(budget: Budget): Promise<string[] | null> {
    if (!budget) {
      logger.error('Budget is required for checking alerts');
      return null;
    }

    try {
      const totalSpent = budget.depenses.reduce((sum, dep) => sum + dep.montant, 0);
      const percentageSpent = (totalSpent / budget.plafond) * 100;
      const alerts = budget.alertes?.filter(alert => percentageSpent >= alert.seuil).map(alert => alert.message) || null;
      if (alerts?.length) {
        logger.warn('Budget alerts triggered', { id: budget.id, percentageSpent, alerts });
      }
      return alerts;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to check budget alerts';
      logger.error('Error checking budget alerts', { error: errorMsg });
      return null;
    }
  }
}
