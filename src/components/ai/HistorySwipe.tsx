import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { styles as geminiStyles } from '../../styles/geminiStyle';

interface Conversation {
  id: string;
  date: string;
  messages: { text: string; isUser: boolean }[];
  title?: string;
}

interface HistorySwipeProps {
  conversations: Conversation[];
  onLoadConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onArchiveConversation?: (id: string) => void;
}

export const HistorySwipe = ({
  conversations,
  onLoadConversation,
  onDeleteConversation,
  onArchiveConversation,
}: HistorySwipeProps) => {
  const renderRightActions = (conversationId: string) => (
    <TouchableOpacity
      // eslint-disable-next-line react-native/no-inline-styles
      style={[geminiStyles.swipeActions, { backgroundColor: '#E74C3C' }]}
      onPress={() => onDeleteConversation(conversationId)}
    >
      <Icon name="delete" size={24} color="#fff" />
      <Text style={localStyles.swipeActionText}>Supprimer</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (conversationId: string) => (
    <TouchableOpacity
      // eslint-disable-next-line react-native/no-inline-styles
      style={[geminiStyles.swipeActions, { backgroundColor: '#27AE60' }]}
      onPress={() => onArchiveConversation?.(conversationId)}
    >
      <Icon name="archive" size={24} color="#fff" />
      <Text style={localStyles.swipeActionText}>Archiver</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const scale = useSharedValue(1);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const lastMessage = item.messages[item.messages.length - 1];
    const previewText = lastMessage ? lastMessage.text.slice(0, 50) + (lastMessage.text.length > 50 ? '...' : '') : 'Aucune conversation';

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        renderLeftActions={() => renderLeftActions(item.id)}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onLoadConversation(item)}
          style={[geminiStyles.conversationItem, localStyles.conversationItem]}
        >
          <Animated.View style={animatedStyle}>
            <View style={localStyles.conversationHeader}>
              <Icon name="history" size={24} color="#2980b9" style={localStyles.icon} />
              <View style={localStyles.conversationInfo}>
                <Text style={[geminiStyles.conversationDate, localStyles.date]}>
                  {item.date}
                </Text>
                {item.title && (
                  <Text style={localStyles.title}>
                    {item.title}
                  </Text>
                )}
              </View>
            </View>
            <Text style={geminiStyles.conversationPreview}>
              {previewText}
            </Text>
            <View style={localStyles.messageCount}>
              <Icon name="message-text" size={14} color="#b0b0b0" />
              <Text style={localStyles.messageCountText}>
                {item.messages.length} message{item.messages.length > 1 ? 's' : ''}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={geminiStyles.historyContainer}>
      <FlatList
        data={conversations}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Icon name="chat-remove" size={40} color="#b0b0b0" />
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
});

export default HistorySwipe;
