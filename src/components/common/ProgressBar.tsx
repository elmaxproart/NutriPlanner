import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface ProgressBarProps {
  progress: number;
  style?: any;
  barStyle?: any;
  barColor?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export const ProgressBar = ({
  progress,
  style,
  barStyle,
  barColor = '#FF6B00',
  backgroundColor = '#2a2a2a',
  animated = true,
}: ProgressBarProps) => {
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, animated, widthAnim]);

  const barWidth = animated ? widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  }) : `${progress * 100}%`;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Animated.View style={[styles.bar, { width: barWidth }, { backgroundColor: barColor }, barStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 10,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
