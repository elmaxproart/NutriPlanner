
// src/components/template/TroubleshootProblemTemplate.tsx

import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { tw } from '../../styles/tailwind';
import { globalStyles } from '../../styles/globalStyles';
import { conversationStyles } from '../../styles/conversationStyles';
import { theme } from '../../styles/theme';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { TemplateProps, TroubleshootProblemContent } from '../../types/messageTypes';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import CollapsibleCard from '../common/CollapsibleCard';
import ToastNotification from '../common/ToastNotification';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { templateConfig } from '../../constants/templateConfig';

interface TroubleshootProblemTemplateProps extends TemplateProps {}

const TroubleshootProblemTemplate: React.FC<TroubleshootProblemTemplateProps> = ({
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
  const content = message.content as TroubleshootProblemContent;
  const troubleshootContent = content.type === 'troubleshoot_problem' ? content : null;

  // Animation effect
  useEffect(() => {
    if (!troubleshootContent) {
      return;
    }
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('troubleshootProblem.loaded'));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, troubleshootContent, t]);

  // Action handlers
  const handleCopyText = useCallback(async () => {
    try {
      if (troubleshootContent) {
        const text = `${t('troubleshootProblem.question')}: ${troubleshootContent.question}\n${t('troubleshootProblem.solution')}: ${troubleshootContent.solution}`;
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
  }, [troubleshootContent, handleCopy, t]);

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
  if (!troubleshootContent) {
    logger.error('Invalid troubleshoot problem content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidTroubleshootMessage')}
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
  const iconName = templateConfig[interactionType]?.iconName || 'help-outline';

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle]}
      onTouchStart={handleLongPress}
      accessibilityLabel={t('troubleshootProblem.container')}
      accessibilityHint={t('troubleshootProblem.hint')}
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
          {t('troubleshootProblem.title')}
        </Text>
      </View>

      {/* Question */}
      <CollapsibleCard
        title={t('troubleshootProblem.question')}
        initiallyExpanded={true}
        style={tw`mb-md`}
      >
        <MarkdownRenderer
          content={troubleshootContent.question}
          style={tw`p-sm`}
          textStyle={globalStyles.text}
          //accessibilityLabel={t('troubleshootProblem.question')}
        />
      </CollapsibleCard>

      {/* Solution */}
      <CollapsibleCard
        title={t('troubleshootProblem.solution')}
        initiallyExpanded={!isContentCollapsed}
        onToggle={() => setIsContentCollapsed(!isContentCollapsed)}
        style={tw`mb-md`}
      >
        <MarkdownRenderer
          content={troubleshootContent.solution}
          style={tw`p-sm`}
          textStyle={globalStyles.text}
         // accessibilityLabel={t('troubleshootProblem.solution')}
        />
      </CollapsibleCard>

      {/* Actions */}
      <View style={[styles.actions, tw`flex-${flexDirection}`]}>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() => handleAction('share', {
            text: `${t('troubleshootProblem.question')}: ${troubleshootContent.question}\n${t('troubleshootProblem.solution')}: ${troubleshootContent.solution}`,
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

export default memo(TroubleshootProblemTemplate);
