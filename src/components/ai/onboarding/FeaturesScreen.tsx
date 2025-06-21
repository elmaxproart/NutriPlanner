import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';


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

const FeaturesScreenContent: React.FC = () => {
  const fadeAnimIcon = useRef(new Animated.Value(0)).current;
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const fadeAnimDesc = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnimDesc, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnimIcon, fadeAnimTitle, fadeAnimDesc]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { opacity: fadeAnimIcon }]}>
        <FontAwesome name="lightbulb-o" size={30} color={COLORS.secondary} />
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnimTitle }}>
        <Text style={styles.title}>
          Fonctionnalités de Famil<Text style={styles.iaText}>IA</Text>
        </Text>
      </Animated.View>
      <Animated.Text style={[styles.description, { opacity: fadeAnimDesc }]}>
        Menus intelligents et listes de courses pour toute la famille.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.s,
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
  description: {
    fontSize: FONTS.description,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
    lineHeight: 20,
  },
});

export default FeaturesScreenContent;
