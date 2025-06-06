import firestore from '@react-native-firebase/firestore';
import { Budget } from '../constants/entities';
import { validateBudget } from '../utils/dataValidators';
import { formatDateForFirestore, isBudgetExceeded } from '../utils/helpers';
import { logger } from '../utils/logger';

export class BudgetService {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {throw new Error('User ID is required');}
    this.userId = userId;
  }

  private getBudgetRef() {
    return firestore().collection('users').doc(this.userId).collection('budgets');
  }

  async createBudget(budget: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour'>): Promise<string> {
    const errors = validateBudget(budget);
    if (errors.length > 0) {
      logger.error('Validation failed for budget', { errors });
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    try {
      const id = firestore().collection('budgets').doc().id;
      const newBudget: Budget = {
        ...budget,
        id,
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
      };
      await this.getBudgetRef().doc(newBudget.id).set(newBudget);
      logger.info('Budget created', { id: newBudget.id });
      return newBudget.id;
    } catch (error) {
      logger.error('Error creating budget', { error });
      throw new Error('Failed to create budget');
    }
  }

  async getBudget(mois: string): Promise<Budget | null> {
    try {
      const snapshot = await this.getBudgetRef().where('mois', '==', mois).get();
      if (snapshot.empty) {return null;}
      const doc = snapshot.docs[0];
      const budget = { id: doc.id, ...doc.data() } as Budget;
      if (isBudgetExceeded(budget)) {
        logger.warn('Budget exceeded', { id: budget.id, mois });
      }
      return budget;
    } catch (error) {
      logger.error('Error fetching budget', { error });
      throw new Error('Failed to fetch budget');
    }
  }

  async updateBudget(budgetId: string, data: Partial<Budget>): Promise<void> {
    const errors = validateBudget(data);
    if (errors.length > 0) {
      logger.error('Validation failed for budget update', { errors });
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    try {
      await this.getBudgetRef().doc(budgetId).update({
        ...data,
        dateMiseAJour: formatDateForFirestore(new Date()),
      });
      logger.info('Budget updated', { id: budgetId });
    } catch (error) {
      logger.error('Error updating budget', { error });
      throw new Error('Failed to update budget');
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    try {
      await this.getBudgetRef().doc(budgetId).delete();
      logger.info('Budget deleted', { id: budgetId });
    } catch (error) {
      logger.error('Error deleting budget', { error });
      throw new Error('Failed to delete budget');
    }
  }

  async checkBudgetAlerts(budget: Budget): Promise<string[] | null> {
    try {
      const totalSpent = budget.depenses.reduce((sum, dep) => sum + dep.montant, 0);
      const percentageSpent = (totalSpent / budget.plafond) * 100;
      const alerts = budget.alertes?.filter(alert => percentageSpent >= alert.seuil).map(alert => alert.message) || null;
      if (alerts) {logger.warn('Budget alert triggered', { percentageSpent, alerts });}
      return alerts;
    } catch (error) {
      logger.error('Error checking budget alerts', { error });
      throw new Error('Failed to check budget alerts');
    }
  }
}
