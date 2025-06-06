import PushNotification from 'react-native-push-notification';
import { Budget } from '../constants/entities';
import { BudgetService } from './BudgetService';
import { logger } from '../utils/logger';

export class NotificationService {
  private budgetService: BudgetService;

  constructor(userId: string) {
    this.budgetService = new BudgetService(userId);
  }

  configureNotifications() {
    PushNotification.configure({
      onNotification: (notification) => {
        logger.info('Notification received', { notification });
      },
      requestPermissions: true,
    });
  }

  async scheduleBudgetAlert(budget: Budget): Promise<void> {
    try {
      const alerts = await this.budgetService.checkBudgetAlerts(budget);
      if (alerts) {
        alerts.forEach(alert => {
          PushNotification.localNotificationSchedule({
            message: alert,
            date: new Date(Date.now() + 1000 * 60), // 1 minute
            allowWhileIdle: true,
          });
          logger.info('Budget alert scheduled', { message: alert });
        });
      }
    } catch (error) {
      logger.error('Error scheduling budget alert', { error });
      throw new Error('Failed to schedule budget alert');
    }
  }

  scheduleShoppingReminder(listId: string, date: string): void {
    try {
      PushNotification.localNotificationSchedule({
        message: `Rappel : Vérifiez votre liste de courses ${listId}`,
        date: new Date(date),
        allowWhileIdle: true,
      });
      logger.info('Shopping reminder scheduled', { listId, date });
    } catch (error) {
      logger.error('Error scheduling shopping reminder', { error });
      throw new Error('Failed to schedule shopping reminder');
    }
  }
}
