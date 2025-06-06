import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/onboardingStyle';

interface WelcomeCardProps {
  title: string;
  description: string;
  imageSource?: string;
  onPress?: () => void;
  showButton?: boolean;
}

export const WelcomeCard = ({ title, description, imageSource = 'https://via.placeholder.com/300x200', onPress, showButton = true }: WelcomeCardProps) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageSource }} style={styles.cardImage} resizeMode="cover" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      {showButton && onPress && (
        <TouchableOpacity style={styles.detailButton} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.detailButtonText}>En savoir plus</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
