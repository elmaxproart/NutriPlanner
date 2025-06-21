import React, { memo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, Animated } from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import BaseMessageTemplate from '../template/BaseMessageTemplate';
import { TemplateProps } from '../../types/messageTypes';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AiInteraction } from '../../constants/entities';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';

interface MessageBubbleProps extends TemplateProps {
  onDelete: (messageId: string) => void;
  onRetry?: (message: AiInteraction) => void;
  isLastMessage?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
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

  // Animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(
        t('message.loaded', { type: message.isUser ? 'user' : 'ai' }),
      );
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
    }
  }, [opacity, translateY, message.isUser, t]);

  // Swipe actions
  const [{ translateX }, { handleSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = useCallback(() => {
    onDelete(id);
    AccessibilityInfo.announceForAccessibility(t('actions.delete'));
  }, [onDelete, id, t]);

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete: handleContextDelete },
  ] = useContextMenu(handleDelete);

  const handleLongPress = useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      showContextMenu(message, { x: pageX, y: pageY });
      Vibration.vibrate(50);
    },
    [showContextMenu, message],
  );

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Animated.View
      style={[
        conversationStyles.messageContainer,
        message.isUser ? conversationStyles.userMessage : conversationStyles.aiMessage,
        animatedStyle,
        swipeAnimatedStyle as ViewStyle, // Cast to ViewStyle to resolve type mismatch
        tw`mb-${isLastMessage ? 'xxl' : 'sm'}`,
      ]}
      accessibilityLabel={t('message.bubble', { type: message.isUser ? 'user' : 'ai' })}
      accessibilityHint={t('message.hint')}
      accessibilityRole="menu"
      {...handleSwipe(handleDelete).panHandlers} // Swipe gestures
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('message.touchable')}
        accessibilityHint={t('message.longPressHint')}
      >
        <View style={[tw`flex-${flexDirection} mb-sm`]}>
          <MaterialIcons
            name={message.isUser ? 'person' : 'smart-toy'}
            size={theme.fonts.sizes.medium}
            color={theme.colors.textPrimary}
            accessibilityLabel={t(`icons.${message.isUser ? 'person' : 'smart-toy'}`)}
          />
          <Text style={[globalStyles.textSmall, tw`ml-sm`]}>
            {message.isUser ? t('message.user') : t('message.ai')}
          </Text>
        </View>
        <BaseMessageTemplate
          message={message}
          promptType={promptType}
          interactionType={interactionType}
          onAction={onAction}
          id={id}
          onDelete={onDelete}
          onRetry={onRetry}
          isLastMessage={isLastMessage}
        />
        <Text style={conversationStyles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString(i18n.language, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={handleCopy}
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
            onPress={handleShare}
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
            onPress={handleContextDelete}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    flex: 1,
  },
});

export default memo(MessageBubble);
