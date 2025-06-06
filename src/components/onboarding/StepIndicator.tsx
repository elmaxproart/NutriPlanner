import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/onboardingStyle';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepPress?: (step: number) => void;
}

export const StepIndicator = ({ currentStep, totalSteps, onStepPress }: StepIndicatorProps) => {
  const scale = useSharedValue(1);

  const handleStepPress = (step: number) => {
    if (onStepPress && step <= currentStep) {
      scale.value = withTiming(1.2, { duration: 100, easing: Easing.ease });
      setTimeout(() => {
        scale.value = withTiming(1, { duration: 100, easing: Easing.ease });
        onStepPress(step);
      }, 100);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.stepIndicatorContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleStepPress(index)}
          disabled={index > currentStep || !onStepPress}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.stepIndicator,
              index === currentStep && styles.stepIndicatorActive,
              animatedStyle,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
