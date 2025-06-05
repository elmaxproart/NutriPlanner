import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { Menu } from '../constants/entities';

interface Props {
  menu: Menu;
  onSelect?: () => void;
}

const GeminiSuggestionCard: React.FC<Props> = ({ menu, onSelect }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Animatable.View animation="fadeIn" duration={500}>
      <TouchableOpacity
        style={[styles.card, isPressed && styles.cardPressed]}
        onPress={onSelect}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
      >
        <LinearGradient
          colors={['#ffffff', '#e8f0fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {menu.foodPick && <Image source={{ uri: menu.foodPick }} style={styles.image} />}
          <View style={styles.content}>
            <Text style={styles.title}>{menu.foodName || 'Suggestion'}</Text>
            <Text style={styles.description}>{menu.description || 'Aucune description'}</Text>
            <Text style={styles.details}>
              Portions: {menu.recettes?.reduce((sum, r) => sum + r.portionsServies, 0) || 1}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    marginVertical: 10,
    elevation: 8,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    overflow: 'hidden',
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradient: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.1)',
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 8,
    lineHeight: 20,
  },
  details: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
});

export default GeminiSuggestionCard;
