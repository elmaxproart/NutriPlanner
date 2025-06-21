import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectDateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => Promise<void>;
  title?: string;
  initialDate?: string; // YYYY-MM-DD
  isFinalStep?: boolean;
}

const SelectDateModal: React.FC<SelectDateModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner une date',
  initialDate,
  isFinalStep = false,
}) => {
  const initialDateObj = initialDate ? new Date(initialDate) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDateObj);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de date ouvert');
      setSelectedDate(initialDate ? new Date(initialDate) : new Date());
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setShowPicker(Platform.OS === 'ios');
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialDate]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleDateChange = useCallback((event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    await onSelect(formattedDate);
    onClose();
    AccessibilityInfo.announceForAccessibility(`Date ${formattedDate} sélectionnée`);
  }, [selectedDate, onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de date"
      testID="select-date-modal"
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

          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={commonStyles.button}
              onPress={() => setShowPicker(true)}
              accessibilityLabel="Ouvrir le sélecteur de date"
              testID="show-date-picker"
            >
              <Text style={commonStyles.text}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}

          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              accessibilityLabel="Sélecteur de date"
              testID="date-picker"
            />
          )}

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
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

export default SelectDateModal;
