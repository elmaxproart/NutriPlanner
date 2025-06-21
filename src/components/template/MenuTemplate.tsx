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
import { Menu, Recette, Ingredient } from '../../constants/entities';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import ToastNotification from '../common/ToastNotification';

interface MenuContent {
  type: 'menu_suggestion' | 'json';
  menu: Menu;
  description?: string;
  recipes?: Recette[];
}

interface MenuTemplateProps extends TemplateProps {
  onAddToShoppingList?: (items: Ingredient[]) => void;
  onAddFeedback?: (menuId: string, feedback: Menu['feedback']) => void;
}

const MenuTemplate: React.FC<MenuTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToShoppingList,
  onAddFeedback,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [collapsedRecipes, setCollapsedRecipes] = useState<Record<string, boolean>>({});
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

  // Action handlers
  const handleAddToShoppingList = useCallback(
    (menu: Menu) => {
      try {
        if (onAddToShoppingList && menu.aiSuggestions?.ingredientsManquants) {
          onAddToShoppingList(menu.aiSuggestions.ingredientsManquants);
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

  const handleAddFeedback = useCallback(
    (menu: Menu, rating: number, comment: string) => {
      try {
        if (onAddFeedback && menu) {
          const feedback = [
            {
              userId: menu.createurId,
              note: rating,
              date: new Date().toISOString(),
              commentaire: comment,
            },
          ];
          onAddFeedback(menu.id, feedback);
          setToastMessage(t('actions.feedbackAdded'));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(t('actions.feedbackAdded'));
        }
      } catch (err) {
        logger.error('Error adding feedback', { error: getErrorMessage(err) });
        setToastMessage(t('actions.feedbackError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAddFeedback, t],
  );

  const handleCopyMenu = useCallback(
    async (menu: Menu) => {
      try {
        const text = `${t('menu.title', {
          type: t(`menu.types.${menu.typeRepas}`),
          date: new Date(menu.date).toLocaleDateString(i18n.language),
        })}\n${menu.recettes
          .map(
            (recipe) =>
              `- ${recipe.nom}: ${recipe.ingredients
                .map((i) => `${i.nom} (${i.quantite} ${i.unite})`)
                .join(', ')}`,
          )
          .join('\n')}\n${t('menu.cost', {
          estimated: menu.coutTotalEstime || 0,
          actual: menu.coutReel || 0,
        })}`;
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      } catch (err) {
        logger.error('Error copying menu', { error: getErrorMessage(err) });
        setToastMessage(t('contextMenu.copyError'));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [handleCopy, t, i18n.language],
  );

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

  // Content validation
  const content = message.content as unknown;
  const menuContent: MenuContent | null =
    (content as { menu: MenuContent }).menu ||
    ((content as { type: string; menu: MenuContent }).type === 'menu_suggestion'
      ? (content as { type: string; menu: MenuContent }).menu
      : (content as MenuContent).type === 'json'
        ? (content as MenuContent)
        : null);

  // Animation effect
  useEffect(() => {
    if (!menuContent || !menuContent.menu) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(
        t('menu.loaded', { type: t(`menu.types.${menuContent.menu.typeRepas}`) }),
      );
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, menuContent, t]);

  // Initialize collapsed state for recipes
  useEffect(() => {
    if (!menuContent || !menuContent.menu) {return;}
    const initialCollapsed: Record<string, boolean> = {};
    menuContent.menu.recettes.forEach((recipe, index) => {
      initialCollapsed[`recipe-${index}`] = true;
    });
    setCollapsedRecipes(initialCollapsed);
  }, [menuContent]);

  // Early return for invalid content
  if (!menuContent || !menuContent.menu) {
    logger.error('Invalid menu content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidMenu')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  const { menu } = menuContent;

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle, tw`mb-md`]}
      accessibilityLabel={t('menu.container', { type: t(`menu.types.${menu.typeRepas}`) })}
      accessibilityHint={t('menu.hint')}
      {...handleSwipe(() => onAction?.('delete', { id }))}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('menu.touchable')}
        accessibilityHint={t('menu.longPressHint')}
      >
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="calendar-today"
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t('icons.menu')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('menu.title', {
              type: t(`menu.types.${menu.typeRepas}`),
              date: new Date(menu.date).toLocaleDateString(i18n.language),
            })}
          </Text>
        </View>

        {/* Summary */}
        <View style={[styles.summary, tw`flex-${flexDirection} mb-md`]}>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('menu.status', { status: t(`menu.statuses.${menu.statut}`) })}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('menu.cost', {
                estimated: menu.coutTotalEstime || 0,
                actual: menu.coutReel || 0,
              })}
            </Text>
          </View>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('menu.recipes', { count: menu.recettes.length })}
            </Text>
            {menuContent.description && (
              <Text style={globalStyles.textSmall} numberOfLines={2}>
                {menuContent.description}
              </Text>
            )}
          </View>
        </View>

        {/* Recipes */}
        {menu.recettes.map((recipe, index) => (
          <CollapsibleCard
            key={`recipe-${index}`}
            title={t('menu.recipe', {
              name: recipe.nom,
              category: t(`recipe.categories.${recipe.categorie}`),
            })}
            initiallyExpanded={!collapsedRecipes[`recipe-${index}`]}
            onToggle={() =>
              setCollapsedRecipes((prev) => ({
                ...prev,
                [`recipe-${index}`]: !prev[`recipe-${index}`],
              }))
            }
            style={tw`mb-md`}
          >
            <View style={tw`p-sm`}>
              <Text style={globalStyles.textSmall}>
                {t('menu.recipeDetails', {
                  prepTime: recipe.tempsPreparation,
                  portions: recipe.portions,
                  difficulty: t(`recipe.difficulties.${recipe.difficulte}`),
                })}
              </Text>
              <Text style={[globalStyles.text, tw`mt-sm`]}>
                {t('menu.ingredients')}
              </Text>
              {recipe.ingredients.map((ingredient, idx) => (
                <View
                  key={idx}
                  style={[tw`flex-${flexDirection} mb-sm`, styles.item]}
                  accessibilityLabel={t('menu.ingredient', { name: ingredient.nom })}
                >
                  <Text style={globalStyles.textSmall}>
                    {`- ${ingredient.nom}: ${ingredient.quantite} ${ingredient.unite}`}
                  </Text>
                </View>
              ))}
            </View>
          </CollapsibleCard>
        ))}

        {/* Missing Ingredients (AI Suggestions) */}
        {menu.aiSuggestions?.ingredientsManquants && menu.aiSuggestions.ingredientsManquants.length > 0 && (
          <CollapsibleCard
            title={t('menu.missingIngredients', {
              count: menu.aiSuggestions.ingredientsManquants.length,
            })}
            initiallyExpanded={false}
            style={tw`mb-md`}
          >
            <View style={tw`p-sm`}>
              {menu.aiSuggestions.ingredientsManquants.map((ingredient, index) => (
                <View
                  key={index}
                  style={[tw`flex-${flexDirection} mb-sm`, styles.item]}
                  accessibilityLabel={t('menu.ingredient', { name: ingredient.nom })}
                >
                  <Text style={globalStyles.textSmall}>
                    {`- ${ingredient.nom}: ${ingredient.quantite} ${ingredient.unite}`}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={[globalStyles.button, tw`mt-sm`]}
                onPress={() => handleAddToShoppingList(menu)}
                accessibilityLabel={t('actions.addToShoppingList')}
                accessibilityHint={t('actions.addToShoppingListHint')}
              >
                <Text style={globalStyles.buttonText}>
                  {t('actions.addToShoppingList')}
                </Text>
              </TouchableOpacity>
            </View>
          </CollapsibleCard>
        )}

        {/* Feedback */}
        {menu.feedback && menu.feedback.length > 0 && (
          <CollapsibleCard
            title={t('menu.feedback', { count: menu.feedback.length })}
            initiallyExpanded={false}
            style={tw`mb-md`}
          >
            <View style={tw`p-sm`}>
              {menu.feedback.map((fb, index) => (
                <View
                  key={index}
                  style={[tw`flex-${flexDirection} mb-sm`, styles.item]}
                  accessibilityLabel={t('menu.feedbackItem', { note: fb.note })}
                >
                  <Text style={globalStyles.textSmall}>
                    {t('menu.feedbackDetails', {
                      note: fb.note,
                      comment: fb.commentaire,
                      date: new Date(fb.date).toLocaleDateString(i18n.language, {
                        dateStyle: 'short',
                      }),
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </CollapsibleCard>
        )}

        {/* Add Feedback */}
        <TouchableOpacity
          style={[globalStyles.button, tw`mb-md`]}
          onPress={() => handleAddFeedback(menu, 5, 'Excellent repas !')}
          accessibilityLabel={t('actions.addFeedback')}
          accessibilityHint={t('actions.addFeedbackHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.addFeedback')}</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', menuContent)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={() => handleCopyMenu(menu)}
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
          accessibilityLabel={t('contextMenu.title')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={() => handleCopyMenu(menu)}
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
    paddingHorizontal: theme.spacing.lg,
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

export default memo(MenuTemplate);
