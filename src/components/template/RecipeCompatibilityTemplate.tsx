
// src/components/template/RecipeCompatibilityTemplate.tsx

import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, StyleSheet, ViewStyle, FlatList } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { tw } from '../../styles/tailwind';
import { globalStyles } from '../../styles/globalStyles';
import { conversationStyles } from '../../styles/conversationStyles';
import { theme } from '../../styles/theme';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { TemplateProps, RecipeCompatibilityContent } from '../../types/messageTypes';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import CollapsibleCard from '../common/CollapsibleCard';
import ToastNotification from '../common/ToastNotification';
import { Ingredient } from '../../constants/entities';
import { templateConfig } from '../../constants/templateConfig';
import AntDesign from 'react-native-vector-icons/AntDesign';

/**
 * Template component for displaying recipe compatibility information.
 * Renders a recipe with compatibility status, reasons, and recommendations.
 */
interface RecipeCompatibilityTemplateProps extends TemplateProps {}

const RecipeCompatibilityTemplate: React.FC<RecipeCompatibilityTemplateProps> = ({
  message,
  onAction,
  id,
  interactionType,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [isContentCollapsed, setIsContentCollapsed] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Entry animations
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
  const content = message.content as RecipeCompatibilityContent;
  const compatibilityContent = content.type === 'recipe_compatibility' ? content : null;

  // Animation effect
  useEffect(() => {
    if (!compatibilityContent) {
      return;
    }
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('recipeCompatibility.loaded'));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, compatibilityContent, t]);

  // Action handlers
  const handleCopyText = useCallback(async () => {
    try {
      if (compatibilityContent) {
        const text = [
          `${t('recipeCompatibility.recipe')}: ${compatibilityContent.recette.nom}`,
          `${t('recipeCompatibility.status')}: ${compatibilityContent.compatibility.isCompatible ? t('recipeCompatibility.compatible') : t('recipeCompatibility.notCompatible')}`,
          compatibilityContent.compatibility.reason?.length
            ? `${t('recipeCompatibility.reasons')}: ${compatibilityContent.compatibility.reason.join(', ')}`
            : '',
          compatibilityContent.compatibility.recommendations?.length
            ? `${t('recipeCompatibility.recommendations')}: ${compatibilityContent.compatibility.recommendations.join(', ')}`
            : '',
        ].filter(Boolean).join('\n');
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
        AccessibilityInfo.announceForAccessibility(t('contextMenu.copySuccess'));
      }
    } catch (err) {
      logger.error('Error copying text', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [compatibilityContent, handleCopy, t]);

  const handleAction = useCallback(
    (action: string, data: any) => {
      try {
        onAction?.(action, data);
        setToastMessage(t(`actions.${action}Success`));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t(`actions.${action}`));
      } catch (err) {
        logger.error(`Error handling action ${action}`, { error: getErrorMessage(err) });
        setToastMessage(t(`actions.${action}Error`));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAction, t],
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

  // Early return for invalid content
  if (!compatibilityContent) {
    logger.error('Invalid recipe compatibility content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidRecipeCompatibilityMessage')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  // RTL support
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // Get icon based on interaction type
  const iconName = templateConfig[interactionType]?.iconName || 'check-circle';

  // Render ingredient item
  const renderIngredient = ({ item }: { item: Ingredient; index: number }) => (
    <View style={tw`p-sm flex-${flexDirection}`}>
      <Text style={globalStyles.text}>
        {item.nom}: {item.quantite} {item.unite}
      </Text>
    </View>
  );

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle]}
      onTouchStart={handleLongPress}
      accessibilityLabel={t('recipeCompatibility.container')}
      accessibilityHint={t('recipeCompatibility.hint')}
      accessibilityRole="summary"
      {...handleSwipe(() => handleAction('delete', { id })).panHandlers}
    >
      {/* Header */}
      <View style={[styles.header, tw`flex-${flexDirection}`]}>
        <MaterialIcons
          name={iconName}
          size={theme.fonts.sizes.large}
          color={theme.colors.textPrimary}
          accessibilityLabel={t(`icons.${iconName}`)}
        />
        <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
          {t('recipeCompatibility.title')}
        </Text>
      </View>

      {/* Recipe Details */}
      <CollapsibleCard
        title={t('recipeCompatibility.recipe', { name: compatibilityContent.recette.nom })}
        initiallyExpanded={true}
        style={tw`mb-md`}
        //accessibilityLabel={t('recipeCompatibility.recipe')}
      >
        <View style={tw`p-sm`}>
          <Text style={globalStyles.text}>
            {t('recipeCompatibility.portions')}: {compatibilityContent.recette.portions}
          </Text>
          <Text style={globalStyles.text}>
            {t('recipeCompatibility.prepTime')}: {compatibilityContent.recette.tempsPreparation} {t('minutes')}
          </Text>
          <FlatList
            data={compatibilityContent.recette.ingredients}
            renderItem={renderIngredient}
            keyExtractor={(item, index) => `${id}-ingredient-${index}`}
            style={tw`mt-sm`}
            accessibilityLabel={t('recipeCompatibility.ingredients')}
          />
        </View>
      </CollapsibleCard>

      {/* Compatibility Status */}
      <CollapsibleCard
        title={t('recipeCompatibility.status')}
        initiallyExpanded={!isContentCollapsed}
        onToggle={() => setIsContentCollapsed(!isContentCollapsed)}
        style={tw`mb-md`}
       //accessibilityLabel={t('recipeCompatibility.status')}
      >
        <View style={tw`p-sm`}>
          <Text style={globalStyles.text}>
            {compatibilityContent.compatibility.isCompatible
              ? t('recipeCompatibility.compatible')
              : t('recipeCompatibility.notCompatible')}
          </Text>
          {Array.isArray(compatibilityContent.compatibility.reason) && compatibilityContent.compatibility.reason.length > 0 && (
            <View style={tw`mt-sm`}>
                <Text style={globalStyles.textBold}>{t('recipeCompatibility.reasons')}</Text>
                {compatibilityContent.compatibility.reason.map((reason, index) => (
                    <View key={`${id}-reason-${index}`} style={[tw`flex-row items-center mt-xs`]}>
                        <AntDesign
                            name="exclamationcircleo"
                            size={18}
                            color={theme.colors.warning}
                            style={tw`mr-xs`}
                        />
                        <Text style={globalStyles.text}>
                            {reason}
                        </Text>
                    </View>
                ))}
            </View>
          )}
          {Array.isArray(compatibilityContent.compatibility.recommendations) && compatibilityContent.compatibility.recommendations.length > 0 && (
            <View style={tw`mt-sm`}>
              <Text style={globalStyles.textBold}>{t('recipeCompatibility.recommendations')}</Text>
              {compatibilityContent.compatibility.recommendations.map((rec, index) => (
                <Text key={`${id}-rec-${index}`} style={globalStyles.text}>
                  - {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      </CollapsibleCard>

      {/* Actions */}
      <View style={[styles.actions, tw`flex-${flexDirection}`]}>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() => handleAction('share', {
            text: [
              `${t('recipeCompatibility.recipe')}: ${compatibilityContent.recette.nom}`,
              `${t('recipeCompatibility.status')}: ${compatibilityContent.compatibility.isCompatible ? t('recipeCompatibility.compatible') : t('recipeCompatibility.notCompatible')}`,
              compatibilityContent.compatibility.reason?.length
                ? `${t('recipeCompatibility.reasons')}: ${compatibilityContent.compatibility.reason.join(', ')}`
                : '',
              compatibilityContent.compatibility.recommendations?.length
                ? `${t('recipeCompatibility.recommendations')}: ${compatibilityContent.compatibility.recommendations.join(', ')}`
                : '',
            ].filter(Boolean).join('\n'),
          })}
          accessibilityLabel={t('actions.share')}
          accessibilityHint={t('actions.shareHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1`]}
          onPress={handleCopyText}
          accessibilityLabel={t('contextMenu.copy')}
          accessibilityHint={t('contextMenu.copyHint')}
        >
          <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
        </TouchableOpacity>
      </View>

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
            onPress={handleCopyText}
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
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(RecipeCompatibilityTemplate);
