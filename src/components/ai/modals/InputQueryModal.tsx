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

interface InputQueryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (query: string) => Promise<void>;
  title?: string;
  initialQuery?: string;
  isFinalStep?: boolean;
}

const InputQueryModal: React.FC<InputQueryModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Saisir une requête',
  initialQuery = '',
  isFinalStep = false,
}) => {
  const [query, setQuery] = useState(initialQuery);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      modalTranslateY.value = withTiming(0, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      AccessibilityInfo.announceForAccessibility('Modal de saisie de requête ouvert');
      setQuery(initialQuery);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setQuery('');
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialQuery]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleConfirm = useCallback(async () => {
    if (query.trim()) {
      await onSelect(query.trim());
      onClose();
      AccessibilityInfo.announceForAccessibility('Requête soumise');
    }
  }, [query, onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de saisie de requête"
      testID="input-query-modal"
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
            placeholder="Entrez votre requête (ex. : informations sur le quinoa)"
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={4}
            accessibilityLabel="Entrer une requête"
            testID="query-input"
          />

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!query.trim()}
            accessibilityLabel="Confirmer la requête"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                query.trim()
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

export default InputQueryModal;
