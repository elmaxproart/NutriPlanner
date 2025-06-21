import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectGuestCountModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (count: number, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  initialCount?: number;
  isFinalStep?: boolean;
}

const SelectGuestCountModal: React.FC<SelectGuestCountModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = "Sélectionner le nombre d'invités",
  initialCount = 0,
  isFinalStep = false,
}) => {
  const [count, setCount] = useState(initialCount > 0 ? initialCount.toString() : '');

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility("Modal de sélection du nombre d'invités ouvert");
      setCount(initialCount > 0 ? initialCount.toString() : '');
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setCount('');
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialCount]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleConfirm = useCallback(async () => {
    const numCount = parseInt(count, 10);
    if (!isNaN(numCount) && numCount > 0) {
      await onSelect(numCount, isFinalStep);
      onClose();
      AccessibilityInfo.announceForAccessibility(`${numCount} invités sélectionnés`);
    }
  }, [count, onSelect, isFinalStep, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection du nombre d'invités"
      testID="select-guest-count-modal"
    >
      <View style={commonStyles.modalOverlay}>
        <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
          <TouchableOpacity
            style={commonStyles.closeModalButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
            testID="close-button"
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
            {title}
          </Text>

          <TextInput
            style={commonStyles.searchInput}
            placeholder="Nombre d'invités (ex. : 10)"
            placeholderTextColor={theme.colors.textSecondary}
            value={count}
            onChangeText={setCount}
            keyboardType="numeric"
            accessibilityLabel="Entrer le nombre d'invités"
            testID="count-input"
          />

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!count || parseInt(count, 10) <= 0}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                count && parseInt(count, 10) > 0
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : ['#666', '#666']
              }
              style={commonStyles.buttonGradient}
            >
              <Text style={commonStyles.buttonText}>
                {isFinalStep ? 'Terminer' : 'Confirmer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};


export default SelectGuestCountModal;
