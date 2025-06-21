import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';

interface SuggestionCardProps {
  title: string;
  description: string;
  imageUri?: ImageSourcePropType;
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
      onPress={onPress}
      activeOpacity={1}
      style={styles.cardContainer}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {imageUri ? (
          <Image source={imageUri} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={40} color="#b0b0b0" />
            <Text style={styles.placeholderText}>Aucune image</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onSendToAI?.(`Suggérer plus sur ${title}`)}
            style={styles.actionButton}
          >
            <Icon name="send" size= {20} color="#2980b9" />
            <Text style={styles.actionText}>Suggérer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
            <Icon name={copied ? 'check' : 'content-copy'} size={20} color={copied ? '#27AE60' : '#2980b9'} />
            <Text style={[styles.actionText, copied && styles.copiedText]}>{copied ? 'Copié !' : 'Copier'}</Text>
          </TouchableOpacity>
          {onShare && (
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Icon name="share-variant" size={20} color="#2980b9" />
              <Text style={styles.actionText}>Partager</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onPress} style={styles.actionButton}>
            <Icon name="eye" size={20} color="#2980b9" />
            <Text style={styles.actionText}>Voir</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 2,
    marginHorizontal: 2,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginTop: 8,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#b0b0b0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  copiedText: {
    color: '#27AE60',
  },
});

export default React.memo(SuggestionCard);
