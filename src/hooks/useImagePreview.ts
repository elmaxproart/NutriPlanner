// src/hooks/useImagePreview.ts

import { useState, useCallback } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

interface ImagePreviewState {
  visible: boolean;
  imageUri: string | null;
  animatedStyle: any;
}

interface ImagePreviewActions {
  showImagePreview: (uri: string) => void;
  hideImagePreview: () => void;
}

export const useImagePreview = (): [ImagePreviewState, ImagePreviewActions] => {
  const [state, setState] = useState<Omit<ImagePreviewState, 'animatedStyle'>>({ visible: false, imageUri: null });
  const scale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showImagePreview = useCallback((uri: string) => {
    setState({ visible: true, imageUri: uri });
    scale.value = withTiming(1, { duration: 300 });
    AccessibilityInfo.announceForAccessibility('Aperçu de l’image ouvert');
  }, [scale]);

  const hideImagePreview = useCallback(() => {
    scale.value = withTiming(0, { duration: 300 }, () => {
      setState({ visible: false, imageUri: null });
    });
    AccessibilityInfo.announceForAccessibility('Aperçu de l’image fermé');
  }, [scale]);

  return [
    { ...state, animatedStyle },
    { showImagePreview, hideImagePreview },
  ];
};
