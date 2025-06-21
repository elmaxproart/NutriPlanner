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
import { AiInteraction } from '../../constants/entities';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ToastNotification from '../common/ToastNotification';

interface ErrorContent {
  errorMessage: string;
  errorCode?: string;
}

interface ErrorMessageTemplateProps extends TemplateProps {
  onRetry?: (message: AiInteraction) => void;
}

const ErrorMessageTemplate: React.FC<ErrorMessageTemplateProps> = ({
  message,
  onAction,
  id,
  onRetry,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
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

  // Error content validation
  const content = message.content as unknown;
  const errorContent: ErrorContent | null =
    (content as { error: ErrorContent }).error ||
    ((content as { type: string; error: ErrorContent }).type === 'error'
      ? (content as { type: string; error: ErrorContent }).error
      : null);

  // Animation effect
  useEffect(() => {
    if (!errorContent) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('error.loaded'));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, errorContent, t]);

  // Action handlers
  const handleRetry = useCallback(() => {
    try {
      if (onRetry && message) {
        onRetry(message);
        setToastMessage(t('actions.retrySuccess'));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.retry'));
      }
    } catch (err) {
      logger.error('Error retrying', { error: getErrorMessage(err) });
      setToastMessage(t('actions.retryError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onRetry, message, t]);

  const handleCopyError = useCallback(async () => {
    try {
      if (errorContent) {
        const text = errorContent.errorCode
          ? `${errorContent.errorMessage} (Code: ${errorContent.errorCode})`
          : errorContent.errorMessage;
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Error copying error message', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [errorContent, handleCopy, t]);

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

  // Early return for invalid error content
  if (!errorContent) {
    logger.error('Invalid error content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidError')}
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
      accessibilityLabel={t('error.container')}
      accessibilityHint={t('error.hint')}
      {...handleSwipe(() => onAction?.('delete', { id })).panHandlers}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('error.touchable')}
        accessibilityHint={t('error.longPressHint')}
      >
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="error-outline"
            size={theme.fonts.sizes.large}
            color={theme.colors.error}
            accessibilityLabel={t('icons.error')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('error.title')}
          </Text>
        </View>

        {/* Error Message */}
        <View style={[styles.content, tw`mb-md`]}>
          <MarkdownRenderer
            content={errorContent.errorMessage}
            style={tw`p-sm`}
            textStyle={globalStyles.text}
          />
          {errorContent.errorCode && (
            <Text style={[globalStyles.textSmall, tw`mt-sm`]}>
              {t('error.code', { code: errorContent.errorCode })}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          {onRetry && (
            <TouchableOpacity
              style={[globalStyles.button, tw`flex-1 mr-sm`]}
              onPress={handleRetry}
              accessibilityLabel={t('actions.retry')}
              accessibilityHint={t('actions.retryHint')}
            >
              <Text style={globalStyles.buttonText}>{t('actions.retry')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', errorContent)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={handleCopyError}
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
            onPress={handleCopyError}
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
  content: {
    paddingHorizontal: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(ErrorMessageTemplate);
