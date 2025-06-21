import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, Animated } from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import { formatBudgetToText } from '../../utils/textFormatter';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TemplateProps } from '../../types/messageTypes';
import { Budget } from '../../constants/entities';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import BudgetChecklist from '../common/BudgetChecklist';
import ToastNotification from '../common/ToastNotification';

interface ExtendedBudget extends Budget {
  id: string;
}

interface BudgetPlanTemplateProps extends TemplateProps {
  onAddToTracker?: (budgetId: string, expenses: Budget['depenses']) => void;
}

const BudgetPlanTemplate: React.FC<BudgetPlanTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToTracker,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [isExpensesCollapsed, setIsExpensesCollapsed] = useState(true);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Swipe actions
  const [{ translateX }, { handleSwipe}] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu((messageId: string) => onAction?.('delete', { id: messageId }));

  // Budget validation
  const content = message.content as unknown;
  const budget: ExtendedBudget | null =
    (content as { budget: ExtendedBudget }).budget ||
    ((content as { type: string; budget: ExtendedBudget }).type === 'budgetPlan'
      ? (content as { type: string; budget: ExtendedBudget }).budget
      : null);

  // Animation effect
  useEffect(() => {
    if (!budget) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(
        t('budget.loaded', { month: budget.mois, currency: budget.devise }),
      );
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, budget, t]);

  // Action handlers
  const handleAddToTracker = useCallback(() => {
    try {
      if (onAddToTracker && budget) {
        onAddToTracker(budget.id, budget.depenses);
        setToastMessage(t('actions.addedToTracker'));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.addedToTracker'));
      }
    } catch (err) {
      logger.error('Error adding to tracker', { error: getErrorMessage(err) });
      setToastMessage(t('actions.addToTrackerError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onAddToTracker, budget, t]);

  const handleCopyBudget = useCallback(async () => {
    try {
      if (budget) {
        const formattedBudget = formatBudgetToText(budget);
        await copyTextToClipboard(formattedBudget.text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Error copying budget', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [budget, handleCopy, t]);

  const handleLongPress = useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      showContextMenu(message, { x: pageX, y: pageY });
      Vibration.vibrate(50);
      AccessibilityInfo.announceForAccessibility(t('contextMenu.opened'));
    },
    [showContextMenu, message, t],
  );

  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // Early return for invalid budget
  if (!budget) {
    logger.error('Invalid budget content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidBudget')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  // Calculate totals
  const totalSpent = budget.depenses.reduce((sum, expense) => sum + expense.montant, 0);
  const remaining = budget.plafond - totalSpent;

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle, tw`mb-md`]}
      accessibilityLabel={t('budget.container', { month: budget.mois })}
      accessibilityHint={t('budget.hint')}
      {...handleSwipe(() => onAction?.('delete', { id })).panHandlers}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('budget.touchable')}
        accessibilityHint={t('budget.longPressHint')}
      >
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="account-balance"
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t('icons.budget')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('budget.title', { month: budget.mois, currency: budget.devise })}
          </Text>
        </View>

        {/* Summary */}
        <View style={[styles.summary, tw`flex-${flexDirection} mb-md`]}>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('budget.total', { amount: budget.plafond, currency: budget.devise })}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('budget.spent', { amount: totalSpent, currency: budget.devise })}
            </Text>
          </View>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('budget.remaining', { amount: remaining, currency: budget.devise })}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('budget.period', { period: budget.mois })}
            </Text>
          </View>
        </View>

        {/* Expenses */}
        <CollapsibleCard
          title={t('budget.expenses', { count: budget.depenses.length })}
          initiallyExpanded={!isExpensesCollapsed}
          onToggle={() => setIsExpensesCollapsed(!isExpensesCollapsed)}
          style={tw`mb-md`}
        >
          <BudgetChecklist
            expenses={budget.depenses}
            onToggle={(expenseId) => onAction?.('toggleExpense', { id: expenseId })}
            style={tw`p-sm`}
            itemStyle={tw`p-sm`}
            accessibilityLabel={t('budget.expensesList')}
          />
          <TouchableOpacity
            style={[globalStyles.button, tw`mt-sm`]}
            onPress={handleAddToTracker}
            accessibilityLabel={t('actions.addToTracker')}
            accessibilityHint={t('actions.addToTrackerHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.addToTracker')}</Text>
          </TouchableOpacity>
        </CollapsibleCard>

        {/* Alerts */}
        {budget.alertes && budget.alertes.length > 0 && (
          <CollapsibleCard
            title={t('budget.alerts', { count: budget.alertes.length })}
            initiallyExpanded={!isAlertsCollapsed}
            onToggle={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
            style={tw`mb-md`}
          >
            {budget.alertes.map((alert, index) => (
              <View key={index} style={[tw`flex-${flexDirection} mb-sm`, styles.alertItem]}>
                <Text style={[globalStyles.text, tw`flex-1`]}>
                  {t('budget.alert', { threshold: alert.seuil, message: alert.message })}
                </Text>
                <Text style={globalStyles.textSmall}>
                  {new Date(alert.date).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}
                </Text>
              </View>
            ))}
          </CollapsibleCard>
        )}

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', budget)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={handleCopyBudget}
            accessibilityLabel={t('contextMenu.copy')}
            accessibilityHint={t('contextMenu.copyHint')}
          >
            <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Context Menu */}
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={handleCopyBudget}
            accessibilityLabel={t('contextMenu.copy')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="content-copy"
              size={theme.fonts.sizes.medium}
              color={theme.colors.textPrimary}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.copy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={async () => {
              await handleShare();
              setToastMessage(t('contextMenu.shareSuccess'));
              setToastType('success');
              setToastVisible(true);
            }}
            accessibilityLabel={t('contextMenu.share')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="share"
              size={theme.fonts.sizes.medium}
              color={theme.colors.textPrimary}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={() => {
              handleDelete();
              setToastMessage(t('contextMenu.deleteSuccess'));
              setToastType('success');
              setToastVisible(true);
            }}
            accessibilityLabel={t('contextMenu.delete')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="delete"
              size={theme.fonts.sizes.medium}
              color={theme.colors.error}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.delete')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Toast Notification */}
      {toastVisible && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onDismiss={handleDismissToast}
          duration={3000}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  summary: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  alertItem: {
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(BudgetPlanTemplate);
