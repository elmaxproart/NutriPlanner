import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { styles as geminiStyles } from '../../styles/geminiStyle';

interface SuggestionCardProps {
  title: string;
  description: string;
  imageUri?: string;
  onPress?: () => void;
  onSendToAI?: (message: string) => void;
  onShare?: (content: string) => void;
}

export const SuggestionCard = ({
  title,
  description,
  imageUri,
  onPress,
  onSendToAI,
  onShare,
}: SuggestionCardProps) => {
  const scale = useSharedValue(1);
  const [copied, setCopied] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleCopy = () => {
    Clipboard.setString(`${title}: ${description}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    onShare?.(`${title}: ${description}`);
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[geminiStyles.suggestionCard, localStyles.cardContainer]}
    >
      <Animated.View style={animatedStyle}>
        {imageUri ? (
          <Image
            source={{ uri: `../assets/images/${imageUri}` }}
            style={geminiStyles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={localStyles.placeholderImage}>
            <Icon name="image-off" size={40} color="#b0b0b0" />
            <Text style={localStyles.placeholderText}>Aucune image</Text>
          </View>
        )}
        <Text style={geminiStyles.cardTitle}>{title}</Text>
        <Text style={geminiStyles.cardDescription}>{description}</Text>
        <View style={localStyles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onSendToAI?.(`Suggérer plus sur ${title}`)}
            style={localStyles.actionButton}
          >
            <Icon name="send" size={20} color="#2980b9" />
            <Text style={localStyles.actionText}>Suggérer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} style={localStyles.actionButton}>
            <Icon name={copied ? 'check' : 'content-copy'} size={20} color={copied ? '#27AE60' : '#2980b9'} />

            <Text style={[localStyles.actionText, copied && { color: '#27AE60' }]}>
              {copied ? 'Copié !' : 'Copier'}
            </Text>
          </TouchableOpacity>
          {onShare && (
            <TouchableOpacity onPress={handleShare} style={localStyles.actionButton}>
              <Icon name="share-variant" size={20} color="#2980b9" />
              <Text style={localStyles.actionText}>Partager</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onPress} style={localStyles.actionButton}>
            <Icon name="eye" size={20} color="#2980b9" />
            <Text style={localStyles.actionText}>Voir</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  cardContainer: {
    padding: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    color: '#2980b9',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default SuggestionCard;
