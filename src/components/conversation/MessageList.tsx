// src/components/conversation/MessageList.tsx

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { FlatList, View, Text, AccessibilityInfo } from 'react-native';
import { tw } from '../../styles/tailwind';
import MessageBubble from './MessageBubble';
import { PromptType } from '../../services/prompts';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { AiInteraction } from '../../constants/entities';
import { globalStyles } from '../../styles/globalStyles';

interface MessageListProps {
  messages: AiInteraction[];
  onAction: (action: string, data: any) => void;
  onDelete: (messageId: string) => void;
  onRetry: (message: AiInteraction) => void;
  promptType?: PromptType;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onAction,
  onDelete,
  onRetry,
  promptType,
}) => {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    try {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
        AccessibilityInfo.announceForAccessibility(t('message.newMessage'));
      }
    } catch (err) {
      logger.error('Error scrolling to end', { error: getErrorMessage(err) });
    }
  }, [messages.length, t]);

  const renderItem = useCallback(
    ({ item, index }: { item: AiInteraction; index: number }) => (
      <MessageBubble
        message={item}
        promptType={promptType}
        interactionType={item.type}
        onAction={onAction}
        id={item.id}
        onDelete={onDelete}
        onRetry={onRetry}
        isLastMessage={index === messages.length - 1}
      />
    ),
    [promptType, onAction, onDelete, onRetry, messages.length],
  );

  const keyExtractor = useCallback((item: AiInteraction) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 100, // Estimation pour optimisation
      offset: 100 * index,
      index,
    }),
    [],
  );

  return (
    <View style={[globalStyles.container, tw`flex-1`]}>
      {messages.length === 0 ? (
        <Text style={[globalStyles.text, tw`text-center mt-lg`]}>
          {t('message.empty')}
        </Text>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          contentContainerStyle={tw`pb-xxl`}
          showsVerticalScrollIndicator={false}
          accessibilityLabel={t('message.list')}
          accessibilityHint={t('message.listHint')}
        />
      )}
    </View>
  );
};

export default memo(MessageList);
