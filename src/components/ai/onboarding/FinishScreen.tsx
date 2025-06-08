import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';



type FinishScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GeminiAI'>;

interface FinishScreenContentProps {
  navigation: FinishScreenNavigationProp;
}

const FinishScreenContent: React.FC<FinishScreenContentProps> = ({ navigation }) => {
 const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return (
    <View>
      <Text style={styles.title}>Prêt à Planifier</Text>
      <Text style={styles.description}>
        Commencez votre voyage culinaire avec NutriBuddy AI dès maintenant.
      </Text>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.replace('GeminiAI')}
      >
        <Animated.View style={[styles.button, animatedStyle]}>
          <Text style={styles.buttonText}>Commencer</Text>
        </Animated.View>
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FinishScreenContent;
