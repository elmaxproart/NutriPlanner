import { useCallback } from 'react';
import { Vibration, PanResponderGestureState } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle, SharedValue, AnimatedStyle } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

interface SwipeState {
  translateX: SharedValue<number>;
  animatedStyle: AnimatedStyle;
}

interface SwipeHandler {
  onPanResponderMove: (event: any, gestureState: PanResponderGestureState) => void;
  onPanResponderRelease: (event: any, gestureState: PanResponderGestureState) => void;
  panHandlers: object;
}

interface SwipeActions {
  handleSwipe: (onDelete: () => void) => SwipeHandler;
  resetSwipe: () => void;
}

export const useSwipeActions = (): [SwipeState, SwipeActions] => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleSwipe = useCallback(
    (onDelete: () => void): SwipeHandler => {
      const handlers = {
        onPanResponderMove: (_: any, gestureState: PanResponderGestureState) => {
          if (gestureState.dx < 0) {
            translateX.value = gestureState.dx;
          }
        },
        onPanResponderRelease: (_: any, gestureState: PanResponderGestureState) => {
          if (gestureState.dx < -100) {
            translateX.value = withTiming(-200, { duration: 200 }, () => {
              Vibration.vibrate(50);
              onDelete();
              AccessibilityInfo.announceForAccessibility('Message supprimé par balayage');
            });
          } else {
            translateX.value = withTiming(0, { duration: 200 });
          }
        },
      };

      return {
        ...handlers,
        panHandlers: handlers, // Explicitly include panHandlers for RecipeTemplate.tsx
      };
    },
    [translateX],
  );

  const resetSwipe = useCallback(() => {
    translateX.value = withTiming(0, { duration: 200 });
  }, [translateX]);

  return [{ translateX, animatedStyle }, { handleSwipe, resetSwipe }];
};
