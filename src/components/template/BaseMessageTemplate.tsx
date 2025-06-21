/* eslint-disable react-native/no-inline-styles */
import React, { memo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  AccessibilityInfo,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { theme } from '../../styles/theme';
import { getTemplate, TemplateConfig } from '../../constants/templateConfig';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import ToastNotification from '../common/ToastNotification';
import CollapsibleCard from '../common/CollapsibleCard';
import { TemplateProps } from '../../types/messageTypes';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AiInteraction } from '../../constants/entities';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useImagePreview } from '../../hooks/useImagePreview';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import { tw } from '../../styles/tailwind';

interface BaseMessageTemplateProps extends TemplateProps {
  onDelete?: (messageId: string) => void;
  onRetry?: (message: AiInteraction) => void;
  isLastMessage?: boolean;
}

const BaseMessageTemplate: React.FC<BaseMessageTemplateProps> = ({
  message,
  promptType,
  interactionType,
  onAction,
  id,
  onDelete,
  onRetry,
  isLastMessage = false,
}) => {
  const { t, i18n } = useTranslation();
  const templateConfig: TemplateConfig = getTemplate(promptType, interactionType);
  const { component: TemplateComponent, iconName, animationType, showActionButtons } = templateConfig;


  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isMetadataExpanded, setIsMetadataExpanded] = React.useState(false);

  // Entry animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animationType === 'slide' ? 50 : 0);
  const scale = useSharedValue(animationType === 'pop' ? 0.8 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      if (animationType === 'slide') {
        translateY.value = withTiming(0, { duration: theme.animation.duration });
      }
      if (animationType === 'pop') {
        scale.value = withTiming(1, { duration: theme.animation.duration });
      }
      AccessibilityInfo.announceForAccessibility(
        t('message.loaded', { type: message.isUser ? 'user' : 'ai' }),
      );
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, scale, animationType, message.isUser, t]);

  // Swipe actions
  const [{ translateX }, { handleSwipe, resetSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: handleSwipe(() => {
      if (onDelete) {
        onDelete(id);
        setToastMessage(t('actions.messageDeleted'));
        setToastType('success');
        setToastVisible(true);
      }
    }).onPanResponderMove,
    onPanResponderRelease: handleSwipe(() => {
      if (onDelete) {
        onDelete(id);
        setToastMessage(t('actions.messageDeleted'));
        setToastType('success');
        setToastVisible(true);
      }
    }).onPanResponderRelease,
    onPanResponderTerminate: () => {
      resetSwipe();
    },
  });

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu(onDelete || (() => {}));

  // Image preview
  const [
    { visible: imageVisible, imageUri, animatedStyle: imageStyle },
    { hideImagePreview },
  ] = useImagePreview();

  // Action handlers
  const handleAction = useCallback(
    (action: string, data: any) => {
      try {
        onAction && onAction(action, data);
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

  const handleRetryPress = useCallback(() => {
    try {
      if (onRetry && message) {
        onRetry(message);
        setToastMessage(t('actions.retrySuccess'));
        setToastType('info');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.retry'));
      }
    } catch (err) {
      logger.error('Error retrying message', { error: getErrorMessage(err) });
      setToastMessage(t('actions.retryError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onRetry, message, t]);

  const handleLongPress = useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      showContextMenu(message, { x: pageX, y: pageY });
      Vibration.vibrate(50);
      AccessibilityInfo.announceForAccessibility(t('contextMenu.opened'));
    },
    [showContextMenu, message, t],
  );

  // Toast handler
  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // RTL support
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // Message metadata
  const metadata = {
    timestamp: new Date(message.timestamp).toLocaleString(i18n.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    type: message.isUser ? t('message.user') : t('message.ai'),
    id: id,
    promptType: promptType || t('message.unknownPrompt'),
  };

  return (
    <Animated.View
      style={[
        conversationStyles.messageContainer,
        message.isUser ? conversationStyles.userMessage : conversationStyles.aiMessage,
        animatedStyle,
        swipeAnimatedStyle as ViewStyle,
        tw`mb-${isLastMessage ? 'xxl' : 'sm'}`,
      ]}
      {...panResponder.panHandlers}
      accessibilityLabel={t('message.container', { type: message.isUser ? 'user' : 'ai' })}
      accessibilityHint={t('message.hint')}
      accessibilityRole="summary"
    >
      <TouchableOpacity activeOpacity={1} onLongPress={handleLongPress} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name={iconName}
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t(`icons.${iconName}`)}
          />
          <Text style={[globalStyles.textBold, tw`ml-sm flex-1`]} numberOfLines={1}>
            {t(`templates.${templateConfig.id}.title`)}
          </Text>
          <TouchableOpacity
            onPress={() => setIsMetadataExpanded(!isMetadataExpanded)}
            accessibilityLabel={t('message.toggleMetadata')}
            accessibilityHint={t('message.metadataHint')}
          >
            <MaterialIcons
              name={isMetadataExpanded ? 'expand-less' : 'expand-more'}
              size={theme.fonts.sizes.medium}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Metadata (collapsible) */}
        <CollapsibleCard
          title={t('message.metadata')}
          initiallyExpanded={isMetadataExpanded}
          onToggle={() => setIsMetadataExpanded(!isMetadataExpanded)}
          style={tw`mb-md`}
        >
          <View style={tw`p-sm`}>
            <Text style={globalStyles.textSmall}>
              {t('message.timestamp')}: {metadata.timestamp}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('message.type')}: {metadata.type}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('message.id')}: {metadata.id}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('message.promptType')}: {metadata.promptType}
            </Text>
          </View>
        </CollapsibleCard>

        {/* Main content */}
        <View style={styles.content}>
          <TemplateComponent
            message={message}
            promptType={promptType}
            interactionType={interactionType}
            onAction={handleAction}
            id={id}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, tw`flex-${flexDirection}`]}>
          <Text style={conversationStyles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {showActionButtons && (
            <View style={[tw`flex-${flexDirection} ml-md`]}>
              <TouchableOpacity
                style={[globalStyles.button, tw`mr-sm`]}
                onPress={() => handleAction('save', message)}
                accessibilityLabel={t('actions.save')}
                accessibilityHint={t('actions.saveHint')}
              >
                <Text style={globalStyles.buttonText}>{t('actions.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, tw`mr-sm`]}
                onPress={() => handleAction('share', message)}
                accessibilityLabel={t('actions.share')}
                accessibilityHint={t('actions.shareHint')}
              >
                <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
              </TouchableOpacity>
              {message.type === 'error' && onRetry && (
                <TouchableOpacity
                  style={globalStyles.button}
                  onPress={handleRetryPress}
                  accessibilityLabel={t('actions.retry')}
                  accessibilityHint={t('actions.retryHint')}
                >
                  <Text style={globalStyles.buttonText}>{t('actions.retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Context menu */}
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={async () => {
              await handleCopy();
              setToastMessage(t('contextMenu.copySuccess'));
              setToastType('success');
              setToastVisible(true);
            }}
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

      {/* Image preview */}
      {imageVisible && imageUri && (
        <Animated.View style={[globalStyles.modalOverlay, imageStyle]}>
          <View style={globalStyles.modalContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
              accessibilityLabel={t('imagePreview.image')}
            />
            <TouchableOpacity
              style={[globalStyles.button, tw`mt-md`]}
              onPress={hideImagePreview}
              accessibilityLabel={t('imagePreview.close')}
              accessibilityHint={t('imagePreview.closeHint')}
            >
              <Text style={globalStyles.buttonText}>{t('imagePreview.close')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Toast notification */}
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
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.medium,
  },
});

export default memo(BaseMessageTemplate);
