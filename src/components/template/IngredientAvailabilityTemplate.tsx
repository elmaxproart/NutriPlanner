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
import { Store, StoreItem, Ingredient } from '../../constants/entities';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import ToastNotification from '../common/ToastNotification';

interface AvailabilityContent {
  type: 'json' | 'ingredient_availability';
  stores: Store[];
  ingredients: Ingredient[]; // Ingrédients recherchés
}

interface IngredientAvailabilityTemplateProps extends TemplateProps {
  onAddToShoppingList?: (storeId: string, items: StoreItem[]) => void;
}

const IngredientAvailabilityTemplate: React.FC<IngredientAvailabilityTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToShoppingList,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [collapsedStores, setCollapsedStores] = useState<Record<string, boolean>>({});
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
  const availabilityContent: AvailabilityContent | null =
    (content as { availability: AvailabilityContent }).availability ||
    ((content as { type: string; availability: AvailabilityContent }).type === 'ingredient_availability'
      ? (content as { type: string; availability: AvailabilityContent }).availability
      : (content as AvailabilityContent).type === 'json'
        ? (content as AvailabilityContent)
        : null);

  // Animation effect
  useEffect(() => {
    if (!availabilityContent) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('ingredientAvailability.loaded'));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, availabilityContent, t]);

  // Action handlers
  const handleAddToShoppingList = useCallback(
    (storeId: string, items: StoreItem[]) => {
      try {
        if (onAddToShoppingList) {
          onAddToShoppingList(storeId, items);
          setToastMessage(t('actions.addedToShoppingList'));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(t('actions.addedToShoppingList'));
        }
      } catch (err) {
        logger.error('Error adding to shopping list', { error: getErrorMessage(err) });
        setToastMessage(t('actions.addToShoppingListError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAddToShoppingList, t],
  );

  const handleCopyAvailability = useCallback(async () => {
    try {
      if (availabilityContent) {
        const text = availabilityContent.stores
          .map(
            (store) =>
              `${store.nom}:\n${store.articles
                .map(
                  (item) =>
                    `- ${item.nom}: ${item.prixUnitaire} ${item.unite} (${item.stockDisponible} en stock)`,
                )
                .join('\n')}`,
          )
          .join('\n\n');
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Error copying availability', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [availabilityContent, handleCopy, t]);

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


  useEffect(() => {
    if (availabilityContent && availabilityContent.stores) {
      const initialCollapsed: Record<string, boolean> = {};
      availabilityContent.stores.forEach((store) => {
        initialCollapsed[store.id] = true;
      });
      setCollapsedStores(initialCollapsed);
    }
  }, [availabilityContent]);

  // Early return for invalid content
  if (!availabilityContent) {
    logger.error('Invalid availability content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidAvailability')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle, tw`mb-md`]}
      accessibilityLabel={t('ingredientAvailability.container')}
      accessibilityHint={t('ingredientAvailability.hint')}
      {...handleSwipe(() => onAction?.('delete', { id })).panHandlers}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('ingredientAvailability.touchable')}
        accessibilityHint={t('ingredientAvailability.longPressHint')}
      >
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="store"
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t('icons.store')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('ingredientAvailability.title', { count: availabilityContent.ingredients.length })}
          </Text>
        </View>

        {/* Ingredients Requested */}
        <View style={[styles.summary, tw`flex-${flexDirection} mb-md`]}>
          <Text style={globalStyles.textSmall}>
            {t('ingredientAvailability.requested', {
              ingredients: availabilityContent.ingredients.map((i) => i.nom).join(', '),
            })}
          </Text>
        </View>

        {/* Stores */}
        {availabilityContent.stores.map((store) => (
          <CollapsibleCard
            key={store.id}
            title={t('ingredientAvailability.store', {
              name: store.nom,
              category: t(`store.categories.${store.categorie}`),
            })}
            initiallyExpanded={!collapsedStores[store.id]}
            onToggle={() =>
              setCollapsedStores((prev) => ({ ...prev, [store.id]: !prev[store.id] }))
            }
            style={tw`mb-md`}
          >
            <View style={tw`p-sm`}>
              {store.articles.map((item) => (
                <View
                  key={item.id}
                  style={[tw`flex-${flexDirection} mb-sm`, styles.item]}
                  accessibilityLabel={t('ingredientAvailability.item', { name: item.nom })}
                >
                  <View style={tw`flex-1`}>
                    <Text style={globalStyles.text}>{item.nom}</Text>
                    <Text style={globalStyles.textSmall}>
                      {t('ingredientAvailability.itemDetails', {
                        price: item.prixUnitaire,
                        unit: item.unite,
                        stock: item.stockDisponible,
                        category: item.categorie
                          ? t(`ingredient.categories.${item.categorie}`)
                          : t('unknown'),
                      })}
                    </Text>
                    {store.promotions
                      ?.filter((promo) => promo.articleId === item.id)
                      .map((promo, promoIndex) => (
                        <Text
                          key={promoIndex}
                          style={[globalStyles.textSmall, tw`text-primary`]}
                        >
                          {t('ingredientAvailability.promotion', {
                            reduction: promo.reduction,
                            endDate: new Date(promo.dateFin ?? '').toLocaleDateString(
                              i18n.language,
                              { dateStyle: 'short' },
                            ),
                            description: promo.description || '',
                          })}
                        </Text>
                      ))}
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[globalStyles.button, tw`mt-sm`]}
                onPress={() => handleAddToShoppingList(store.id, store.articles)}
                accessibilityLabel={t('actions.addToShoppingList')}
                accessibilityHint={t('actions.addToShoppingListHint')}
              >
                <Text style={globalStyles.buttonText}>
                  {t('actions.addToShoppingList')}
                </Text>
              </TouchableOpacity>
            </View>
          </CollapsibleCard>
        ))}

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', availabilityContent)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={handleCopyAvailability}
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
            onPress={handleCopyAvailability}
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
    paddingHorizontal: theme.spacing.sm,
  },
  item: {
    alignItems: 'center',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(IngredientAvailabilityTemplate);
