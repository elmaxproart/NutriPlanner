import React, { useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { commonStyles } from '../../styles/commonStyles';
import { theme } from '../../styles/theme';

interface MainActionButtonProps {
  onPressAction: () => void;
  onLongPressAction: () => void;
}

const MainActionButton: React.FC<MainActionButtonProps> = ({
  onPressAction,
  onLongPressAction,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const orbitRotation = useSharedValue(0);
  const longPressProgress = useSharedValue(0);
  const lottieRef = useRef<LottieView>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    shadowOpacity.value = withTiming(0.5, { duration: 400 });
    pulseScale.value = withTiming(1.2, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
    orbitRotation.value = withRepeat(
      withTiming(360, {
        duration: 5000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    lottieRef.current?.play();
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [opacity, shadowOpacity, pulseScale, orbitRotation]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
    elevation: shadowOpacity.value * 12,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.4, 0]),
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: longPressProgress.value }],
    opacity: longPressProgress.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 20, stiffness: 200 });
    shadowOpacity.value = withTiming(0.7, { duration: 200 });
    pulseScale.value = withTiming(1.3, { duration: 200 });
    longPressTimer.current = setTimeout(() => {
      longPressProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      });
      onLongPressAction();
      lottieRef.current?.play();
    }, 500);
  }, [scale, shadowOpacity, pulseScale, longPressProgress, onLongPressAction]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    shadowOpacity.value = withTiming(0.5, { duration: 200 });
    pulseScale.value = withTiming(1.2, { duration: 200 });
    longPressProgress.value = withTiming(0, { duration: 200 });
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, [scale, shadowOpacity, pulseScale, longPressProgress]);

  const handlePress = useCallback(() => {
    onPressAction();
    lottieRef.current?.play();
  }, [onPressAction]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPressAction}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[commonStyles.mainActionButton, styles.buttonContainer]}
      accessibilityLabel="Bouton d'action principale"
      accessibilityRole="button"
    >
      {/* Outer rotating circle */}
      <Animated.View style={[styles.orbitContainer, orbitStyle]}>
        <LinearGradient
          colors={[theme.colors.primary + '33', theme.colors.secondary + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbitGradient}
        />
      </Animated.View>
      {/* Pulse effect */}
      <Animated.View style={[styles.pulseContainer, pulseStyle]}>
        <LinearGradient
          colors={[theme.colors.primary + '33', theme.colors.secondary + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pulseGradient}
        />
      </Animated.View>
      {/* Long press progress indicator */}
      <Animated.View style={[styles.progressContainer, progressStyle]}>
        <LinearGradient
          colors={[theme.colors.secondary, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressGradient}
        />
      </Animated.View>
      {/* Main button with Lottie */}
      <Animated.View style={[styles.gradientContainer, animatedButtonStyle]}>
        <View style={styles.buttonBackground}>
          <LottieView
            ref={lottieRef}
            source={require('../../assets/animations/gemini.json')}
            style={styles.lottieAnimation}
            loop={true}
            autoPlay={false}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: theme.borderRadius.round,
    borderWidth: 2,
    borderColor: theme.colors.primary + '66',
  },
  orbitGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.round,
    opacity: 0.5,
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
    borderRadius: theme.borderRadius.round + 100,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  buttonBackground: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'rgba(235, 230, 230, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 50,
    height: 50,
  },
});

export default MainActionButton;
