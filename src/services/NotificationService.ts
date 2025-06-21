import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { BudgetService } from './BudgetService';
import { Budget } from '../constants/entities';
import { logger } from '../utils/logger';

export class NotificationService {
  private budgetService: BudgetService;

  constructor(budgetService: BudgetService) {
    if (!budgetService) {
      throw new Error('BudgetService is required');
    }
    this.budgetService = budgetService;
    this.configureNotifications();
  }

  private configureNotifications() {
    PushNotification.configure({
      onNotification: (notification) => {
        logger.info('Notification received', { notification });
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      requestPermissions: Platform.OS === 'ios',
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
    });
  }

  async scheduleBudgetAlert(budget: Budget): Promise<boolean> {
    if (!budget) {
      logger.error('Budget is required for scheduling alert');
      return false;
    }

    try {
      const alerts = await this.budgetService.checkBudgetAlerts(budget);
      if (alerts?.length) {
        alerts.forEach((alert) => {
          PushNotification.localNotificationSchedule({
            message: alert,
            date: new Date(Date.now() + 60 * 1000), // 1 minute delay
            allowWhileIdle: true,
            userInfo: { budgetId: budget.id },
            soundName: 'default',
          });
          logger.info('Budget alert scheduled', { message: alert, budgetId: budget.id });
        });
        return true;
      }
      logger.info('No budget alerts to schedule', { budgetId: budget.id });
      return false;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to schedule budget alert';
      logger.error('Error scheduling budget alert', { error: errorMsg });
      return false;
    }
  }

  async scheduleShoppingReminder(listId: string, date: string): Promise<boolean> {
    if (!listId || !date) {
      logger.error('List ID and date are required for shopping reminder');
      return false;
    }

    try {
      const reminderDate = new Date(date);
      if (isNaN(reminderDate.getTime())) {
        logger.error('Invalid date format for shopping reminder', { date });
        return false;
      }
      PushNotification.localNotificationSchedule({
        message: `Rappel : Vérifiez votre liste de courses ${listId}`,
        date: reminderDate,
        allowWhileIdle: true,
        userInfo: { listId },
        soundName: 'default',
      });
      logger.info('Shopping reminder scheduled', { listId, date });
      return true;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to schedule shopping reminder';
      logger.error('Error scheduling shopping reminder', { error: errorMsg });
      return false;
    }
  }
}
