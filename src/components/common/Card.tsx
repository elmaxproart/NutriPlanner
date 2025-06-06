import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, GestureResponderEvent } from 'react-native';

interface CardProps {
  title: string;
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  imageSource?: { uri: string };
  shadowLevel?: 'low' | 'medium' | 'high';
  style?: any;
  titleStyle?: any;
}

export const Card = ({ title, children, onPress, imageSource, shadowLevel = 'medium', style, titleStyle }: CardProps) => {
  const Component = onPress ? TouchableOpacity : View;
  const shadowStyles = {
    low: { shadowOpacity: 0.1, elevation: 2 },
    medium: { shadowOpacity: 0.2, elevation: 5 },
    high: { shadowOpacity: 0.3, elevation: 8 },
  };

  return (
    <Component onPress={onPress} style={[styles.card, shadowStyles[shadowLevel], style]}>
      {imageSource && <Image source={imageSource} style={styles.cardImage} />}
      <Text style={[styles.cardTitle, titleStyle]}>{title}</Text>
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
});
