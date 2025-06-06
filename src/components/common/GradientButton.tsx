import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  animatePress?: boolean;
}

export const GradientButton = ({ title, onPress, disabled = false, style, textStyle, animatePress = true }: GradientButtonProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (animatePress && !disabled) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start(onPress);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.buttonContainer, disabled && styles.buttonDisabled, style]}
    >
      <LinearGradient
        colors={disabled ? ['#666666', '#666666'] : ['#FF6B00', '#F39C12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
