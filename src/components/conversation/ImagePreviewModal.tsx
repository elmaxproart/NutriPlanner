// src/components/conversation/ImagePreviewModal.tsx

import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, Image, Text, AccessibilityInfo, Animated } from 'react-native';
import { useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import { PinchGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { globalStyles } from '../../styles/globalStyles';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  animatedStyle: any;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  imageUri,
  animatedStyle,
  onClose,
}) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchHandler = useCallback(
    (event: any) => {
      scale.value = event.nativeEvent.scale;
      translateX.value = event.nativeEvent.focalX;
      translateY.value = event.nativeEvent.focalY;
    },
    [scale, translateX, translateY],
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleClose = useCallback(() => {
    onClose();
    AccessibilityInfo.announceForAccessibility(t('imagePreview.closed'));
  }, [onClose, t]);

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <GestureHandlerRootView style={[globalStyles.modalOverlay, animatedStyle]}>
      <View style={globalStyles.modalContainer}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={animatedImageStyle}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={t('imagePreview.image')}
            />
          </Animated.View>
        </PinchGestureHandler>
        <TouchableOpacity
          style={[globalStyles.button, tw`mt-md`]}
          onPress={handleClose}
          accessibilityLabel={t('imagePreview.close')}
        >
          <Text style={globalStyles.buttonText}>{t('imagePreview.close')}</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = {
  image: {
    width: '100%' as const,
    height: 400,
    borderRadius: theme.borderRadius.medium,
  },
};

export default memo(ImagePreviewModal);

