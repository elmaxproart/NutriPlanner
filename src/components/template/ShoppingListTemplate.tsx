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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TemplateProps } from '../../types/messageTypes';
import { ListeCourses, Ingredient } from '../../constants/entities';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import ShoppingListChecklist from '../common/ShoppingListChecklist';
import ToastNotification from '../common/ToastNotification';

interface ShoppingListContent {
  type: 'shopping_list_suggestion' | 'json';
  shoppingList: ListeCourses;
}

interface ShoppingListTemplateProps extends TemplateProps {
  onToggleItem?: (listId: string, itemId: string) => void;
  onUpdateStatus?: (listId: string, status: ListeCourses['statut']) => void;
  onAddToStore?: (storeId: string, items: Ingredient[]) => void;
}

const ShoppingListTemplate: React.FC<ShoppingListTemplateProps> = ({
  message,
  onAction,
  id,
  onToggleItem,
  onUpdateStatus,
  onAddToStore,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [isItemsCollapsed, setIsItemsCollapsed] = useState(true);
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
  const [{ translateX }, { handleSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu((messageId: string) => onAction?.('delete', { id: messageId }));

  // Content validation
  const content = message.content as unknown;
  const shoppingListContent: ShoppingListContent | null =
    (content as { shoppingList: ShoppingListContent }).shoppingList ||
    ((content as { type: string; shoppingList: ShoppingListContent }).type === 'shopping_list_suggestion'
      ? (content as { type: string; shoppingList: ShoppingListContent }).shoppingList
      : (content as ShoppingListContent).type === 'json'
        ? (content as ShoppingListContent)
        : null);

  // Animation effect
  useEffect(() => {
    if (!shoppingListContent) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(
        t('shoppingList.loaded', { name: shoppingListContent.shoppingList.nom }),
      );
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, shoppingListContent, t]);

  // Action handlers
  const handleToggleItem = useCallback(
    (itemId: string) => {
      try {
        if (onToggleItem && shoppingListContent) {
          onToggleItem(shoppingListContent.shoppingList.id, itemId);
          setToastMessage(t('shoppingList.itemToggledSuccess'));
          setToastType('success');
          setToastVisible(true);
        }
      } catch (err) {
        logger.error('Error toggling item', { error: getErrorMessage(err) });
        setToastMessage(t('shoppingList.itemToggledError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onToggleItem, shoppingListContent, t],
  );

  const handleUpdateStatus = useCallback(
    (status: ListeCourses['statut']) => {
      try {
        if (onUpdateStatus && shoppingListContent) {
          onUpdateStatus(shoppingListContent.shoppingList.id, status);
          setToastMessage(t('shoppingList.statusUpdated', { status: t(`shoppingList.statuses.${status}`) }));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(
            t('shoppingList.statusUpdated', { status: t(`shoppingList.statuses.${status}`) }),
          );
        }
      } catch (err) {
        logger.error('Error updating status', { error: getErrorMessage(err) });
        setToastMessage(t('shoppingList.statusUpdateError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onUpdateStatus, shoppingListContent, t],
  );

  const handleAddToStore = useCallback(
    (storeId: string) => {
      try {
        if (onAddToStore && shoppingListContent) {
          onAddToStore(storeId, shoppingListContent.shoppingList.items);
          setToastMessage(t('shoppingList.addedToStore'));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(t('shoppingList.addedToStore'));
        }
      } catch (err) {
        logger.error('Error adding to store', { error: getErrorMessage(err) });
        setToastMessage(t('shoppingList.addToStoreError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAddToStore, shoppingListContent, t],
  );

  const handleCopyShoppingList = useCallback(async () => {
    try {
      if (shoppingListContent) {
        const text = `${t('shoppingList.title', { name: shoppingListContent.shoppingList.nom })}\n${shoppingListContent.shoppingList.items
          .map((item) => `- ${item.nom}: ${item.quantite} ${item.unite}`)
          .join('\n')}\n${t('shoppingList.budget', {
          estimated: shoppingListContent.shoppingList.budgetEstime || 0,
          actual: shoppingListContent.shoppingList.budgetReel || 0,
        })}`;
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Error copying shopping list', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [shoppingListContent, handleCopy, t]);

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


  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // Early return for invalid content
  if (!shoppingListContent) {
    logger.error('Invalid shopping list content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidShoppingList')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  const { shoppingList } = shoppingListContent;

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle, tw`mb-md`]}
      accessibilityLabel={t('shoppingList.container', { name: shoppingList.nom })}
      accessibilityHint={t('shoppingList.hint')}
      //accessibilityRole="article"
      {...handleSwipe(() => onAction?.('delete', { id })).panHandlers}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('shoppingList.touchable')}
        accessibilityHint={t('shoppingList.longPressHint')}
      >
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="shopping-cart"
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t('icons.shoppingList')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('shoppingList.title', { name: shoppingList.nom })}
          </Text>
        </View>

        {/* Summary */}
        <View style={[styles.summary, tw`flex-${flexDirection} mb-md`]}>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('shoppingList.status', { status: t(`shoppingList.statuses.${shoppingList.statut}`) })}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('shoppingList.budget', {
                estimated: shoppingList.budgetEstime || 0,
                actual: shoppingList.budgetReel || 0,
              })}
            </Text>
          </View>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('shoppingList.items', { count: shoppingList.items.length })}
            </Text>
            {shoppingList.notes && (
              <Text style={globalStyles.textSmall} numberOfLines={2}>
                {shoppingList.notes}
              </Text>
            )}
          </View>
        </View>

        {/* Items */}
        <CollapsibleCard
          title={t('shoppingList.items', { count: shoppingList.items.length })}
          initiallyExpanded={!isItemsCollapsed}
          onToggle={() => setIsItemsCollapsed(!isItemsCollapsed)}
          style={tw`mb-md`}
        >
          <ShoppingListChecklist
            items={shoppingList.items}
            onToggle={handleToggleItem}
            style={tw`p-sm`}
            itemStyle={tw`p-sm`}
            accessibilityLabel={t('shoppingList.itemsList')}
          />
        </CollapsibleCard>

        {/* Status Update */}
        <View style={[styles.statusActions, tw`flex-${flexDirection} mb-md`]}>
          {['en cours', 'terminée', 'archivée'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                globalStyles.button,
                tw`flex-1 mr-sm`,
                shoppingList.statut === status && tw`bg-primary`,
              ]}
              onPress={() => handleUpdateStatus(status as ListeCourses['statut'])}
              accessibilityLabel={t('shoppingList.updateStatus', { status: t(`shoppingList.statuses.${status}`) })}
              accessibilityHint={t('shoppingList.updateStatusHint')}
            >
              <Text
                style={[
                  globalStyles.buttonText,
                  shoppingList.statut === status && tw`text-white`,
                ]}
              >
                {t(`shoppingList.statuses.${status}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add to Store (Example) */}
        <TouchableOpacity
          style={[globalStyles.button, tw`mb-md`]}
          onPress={() => handleAddToStore('example-store-id')} // Remplacer par un sélecteur de magasin
          accessibilityLabel={t('shoppingList.addToStore')}
          accessibilityHint={t('shoppingList.addToStoreHint')}
        >
          <Text style={globalStyles.buttonText}>{t('shoppingList.addToStore')}</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', shoppingListContent)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={handleCopyShoppingList}
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
            onPress={handleCopyShoppingList}
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
  statusActions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(ShoppingListTemplate);
