import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Configuration
const COLORS = {
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  secondary: '#F2A03D',
};

const FONTS = {
  title: 20,
  description: 14,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
};

const WelcomeScreenContent: React.FC = () => {
  const fadeAnimIcon = useRef(new Animated.Value(0)).current;
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnimIcon, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimTitle, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnimIcon, fadeAnimTitle]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { opacity: fadeAnimIcon }]}>
        <FontAwesome name="star" size={30} color={COLORS.secondary} style={styles.star} />
        <FontAwesome name="star" size={24} color={COLORS.secondary} style={styles.starSmallLeft} />
        <FontAwesome name="star" size={24} color={COLORS.secondary} style={styles.starSmallRight} />
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnimTitle }}>
        <Text style={styles.title}>
          Bienvenue chez Famil<Text style={styles.iaText}>IA</Text>
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.s,
    position: 'relative',
    width: 60,
    height: 30,
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    top: 0,
    zIndex: 3,
  },
  starSmallLeft: {
    position: 'absolute',
    top: 8,
    left: 0,
    zIndex: 2,
  },
  starSmallRight: {
    position: 'absolute',
    top: 8,
    right: 0,
    zIndex: 2,
  },
  title: {
    fontSize: FONTS.title,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  iaText: {
    color: COLORS.secondary,
  },
});

export default WelcomeScreenContent;
