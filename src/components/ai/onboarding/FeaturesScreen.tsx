import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';

const FeaturesScreenContent: React.FC = () => {
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const translateY1 = useSharedValue(20);
  const translateY2 = useSharedValue(20);

  useEffect(() => {
    opacity1.value = withDelay(200, withTiming(1, { duration: 600 }));
    opacity2.value = withDelay(400, withTiming(1, { duration: 600 }));
    translateY1.value = withDelay(200, withTiming(0, { duration: 600 }));
    translateY2.value = withDelay(400, withTiming(0, { duration: 600 }));
  }, [opacity1, opacity2, translateY1, translateY2]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ translateY: translateY1.value }],
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ translateY: translateY2.value }],
  }));

  return (
    <View>
      <Animated.View style={animatedStyle1}>
        <Text style={styles.title}>Fonctionnalités Intelligentes</Text>
      </Animated.View>
      <Animated.Text style={[styles.description, animatedStyle2]}>
        Explorez des suggestions de menus et de listes de courses personnalisées.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default FeaturesScreenContent;
