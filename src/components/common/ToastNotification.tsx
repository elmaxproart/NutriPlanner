// src/components/common/ToastNotification.tsx
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onDismiss: () => void;
  style?: any;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    // Show animation
    opacity.value = withTiming(1, { duration: theme.animation.duration });
    translateY.value = withTiming(0, { duration: theme.animation.duration });

    // Accessibility announcement
    AccessibilityInfo.announceForAccessibility(message);

    // Hide animation after duration
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: theme.animation.duration });
      translateY.value = withTiming(50, {
        duration: theme.animation.duration,
      }, (finished) => {
        // Use runOnJS to call the JavaScript function from worklet
        if (finished) {
          runOnJS(onDismiss)();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [opacity, translateY, duration, message, onDismiss]);

  const typeStyles = {
    success: { backgroundColor: theme.colors.success },
    error: { backgroundColor: theme.colors.error },
    info: { backgroundColor: theme.colors.info },
    warning: { backgroundColor: theme.colors.warning },
  };

  return (
    <Animated.View style={[styles.toast, typeStyles[type], animatedStyle, style]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 50,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
    elevation: theme.elevation.high,
  },
  message: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});

export default React.memo(ToastNotification);
