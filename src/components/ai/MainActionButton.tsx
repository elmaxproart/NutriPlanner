import React, { useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Easing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { commonStyles } from '../../styles/commonStyles';
import { theme } from '../../styles/theme';

interface MainActionButtonProps {
  onPressAction: () => void;
  onLongPressAction: () => void;
}

const MainActionButton: React.FC<MainActionButtonProps> = ({ onPressAction, onLongPressAction }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const starRotation = useSharedValue(0);
  const longPressProgress = useSharedValue(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    shadowOpacity.value = withTiming(0.5, { duration: 400 });
    pulseScale.value = withTiming(1.2, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
    starRotation.value = withTiming(360, {
      duration: 4000,
      easing: Easing.linear,
    });
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [opacity, shadowOpacity, pulseScale, starRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
    elevation: shadowOpacity.value * 12,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.3, 0]),
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotation.value}deg` }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: longPressProgress.value }],
    opacity: longPressProgress.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 20, stiffness: 200 });
    shadowOpacity.value = withTiming(0.7, { duration: 200 });
    longPressTimer.current = setTimeout(() => {
      longPressProgress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) });
      onLongPressAction();
    }, 500);
  }, [scale, shadowOpacity, longPressProgress, onLongPressAction]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    shadowOpacity.value = withTiming(0.5, { duration: 200 });
    longPressProgress.value = withTiming(0, { duration: 200 });
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, [longPressProgress, scale, shadowOpacity]);

  const handlePress = useCallback(() => {
    onPressAction();
  }, [onPressAction]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPressAction}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[commonStyles.mainActionButton, styles.buttonContainer]}
      accessibilityLabel="Action principale"
      accessibilityRole="button"
    >
      <Animated.View style={[styles.pulseContainer, pulseStyle]}>
        <LinearGradient
          colors={[theme.colors.primary + '33', theme.colors.secondary + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pulseGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.progressContainer, progressStyle]}>
        <LinearGradient
          colors={[theme.colors.secondary, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.gradientContainer, animatedStyle]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View style={starStyle}>
            <Image
              source={require('../../assets/images/gemini-star.png')}
              style={styles.starImage}
              resizeMode="contain"
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    position: 'relative',
  },
  pulseContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.large,
  },
  pulseGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.round,
  },
  progressContainer: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.round,
  },
  progressGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.round,
  },
  gradientContainer: {
    borderRadius: theme.borderRadius.round,
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starImage: {
    width: 32,
    height: 32,
    tintColor: theme.colors.textPrimary,
  },
});

export default MainActionButton;
