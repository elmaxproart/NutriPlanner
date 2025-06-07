import React, { useCallback, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { styles as geminiStyles } from '../../styles/geminiStyle';
import { useAIConversation } from '../../hooks/useAIConversation';
import type { AiInteraction, Conversation } from '../../constants/entities';


interface ItemAnimation {
  animatedStyle: { transform: { scale: number }[] };
  handlePressIn: () => void;
  handlePressOut: () => void;
}


const useItemAnimation = (): ItemAnimation => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return { animatedStyle, handlePressIn, handlePressOut };
};

// Separate component for each conversation item
interface ConversationItemProps {
  item: Conversation;
  onPress: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(
  ({ item, onPress, onDelete, onArchive }) => {
    const { animatedStyle, handlePressIn, handlePressOut } = useItemAnimation();

    const renderRightActions = () => (
      <TouchableOpacity
        style={[geminiStyles.swipeActions, localStyles.deleteAction]}
        onPress={onDelete}
      >
        <AntDesign name="delete" size={24} color="#fff" />
        <Text style={localStyles.swipeActionText}>Supprimer</Text>
      </TouchableOpacity>
    );

    const renderLeftActions = () => (
      <TouchableOpacity
        style={[geminiStyles.swipeActions, localStyles.archiveAction]}
        onPress={onArchive}
      >
        <AntDesign name="archive" size={24} color="#fff" />
        <Text style={localStyles.swipeActionText}>Archiver</Text>
      </TouchableOpacity>
    );

    const lastMessage = item.messages[item.messages.length - 1] as AiInteraction | undefined;
    const previewText = lastMessage
      ? (typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content)
        ).slice(0, 50) + (lastMessage.content.toString().length > 50 ? '...' : '')
      : 'Aucune conversation';

    return (
      <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[geminiStyles.conversationItem, localStyles.conversationItem]}
        >
          <Animated.View style={animatedStyle}>
            <View style={localStyles.conversationHeader}>
              <AntDesign name="history" size={24} color="#2980b9" style={localStyles.icon} />
              <View style={localStyles.conversationInfo}>
                <Text style={[localStyles.conversationDate, localStyles.date]}>
                  {item.date}
                </Text>
                <Text style={localStyles.title}>{item.title}</Text>
              </View>
            </View>
            <Text style={localStyles.conversationPreview}>{previewText}</Text>
            <View style={localStyles.messageCount}>
              <AntDesign name="message1" size={14} color="#b0b0b0" />
              <Text style={localStyles.messageCountText}>
                {item.messages.length} message{item.messages.length > 1 ? 's' : ''}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Swipeable>
    );
  }
);

interface HistorySwipeProps {
  onLoadConversation?: (conversation: Conversation) => void;
}

export const HistorySwipe = ({ onLoadConversation }: HistorySwipeProps) => {
  const { conversations, selectConversation, deleteConversation } = useAIConversation({
    userId: '',
    familyId: 'family1',
  });

  // Map conversations to ensure type safety
  const formattedConversations: Conversation[] = useMemo(() => {
    return conversations.map((conv: Conversation) => ({
      id: conv.id || `conv-${Date.now()}`,
      userId: conv.userId || '',
      familyId: conv.familyId || 'family1',
      date: conv.date || new Date().toISOString(),
      messages: conv.messages || [],
      title: conv.title || 'Conversation sans titre',
      dateCreation: conv.dateCreation,
      dateMiseAJour: conv.dateMiseAJour,
    }));
  }, [conversations]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      return (
        <ConversationItem
          item={item}
          onPress={() => {
            if (onLoadConversation) {
              onLoadConversation(item);
            } else {
              selectConversation(item.id || '');
            }
          }}
          onDelete={() => deleteConversation(item.id || '')}
          onArchive={() => console.log(`Archiving conversation ${item.id || 'unknown'}`)}
        />
      );
    },
    [selectConversation, onLoadConversation, deleteConversation]
  );

  return (
    <GestureHandlerRootView style={geminiStyles.historyContainer}>
      <FlatList
        data={formattedConversations}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || `key-${Date.now()}`}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <AntDesign name="chat-off" size={40} color="#b0b0b0" />
            <Text style={localStyles.emptyText}>Aucune conversation</Text>
          </View>
        }
      />
    </GestureHandlerRootView>
  );
};

const localStyles = StyleSheet.create({
  conversationItem: {
    width: 200,
    marginHorizontal: 8,
    padding: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  date: {
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  messageCountText: {
    color: '#b0b0b0',
    fontSize: 12,
    marginLeft: 6,
  },
  swipeActionText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  deleteAction: {
    backgroundColor: '#E74C3C',
  },
  archiveAction: {
    backgroundColor: '#27AE60',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginTop: 10,
  },
  // Added missing styles locally
  conversationDate: {
    color: '#b0b0b0',
    fontSize: 12,
    fontWeight: '500',
  },
  conversationPreview: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
  },
});

export default HistorySwipe;
