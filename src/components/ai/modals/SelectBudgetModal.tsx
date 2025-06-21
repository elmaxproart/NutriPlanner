import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
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
import { Picker } from '@react-native-picker/picker';
import { Currency } from '../../../constants/config';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface Budget {
  amount: number;
  currency: Currency;
}

interface SelectBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (budget: Budget) => Promise<void>;
  title?: string;
  initialBudget?: Budget;
  isFinalStep?: boolean;
}

const currencies: Currency[] = ['FCFA', 'EUR', 'USD'];

const SelectBudgetModal: React.FC<SelectBudgetModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Définir un budget',
  initialBudget = { amount: 0, currency: 'FCFA' },
  isFinalStep = false,
}) => {
  const [amount, setAmount] = useState(initialBudget.amount > 0 ? initialBudget.amount.toString() : '');
  const [currency, setCurrency] = useState<Currency>(initialBudget.currency);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de budget ouvert');
      setAmount(initialBudget.amount > 0 ? initialBudget.amount.toString() : '');
      setCurrency(initialBudget.currency);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setAmount('');
        setCurrency('FCFA');
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialBudget]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleConfirm = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      await onSelect({ amount: numAmount, currency });
      onClose();
      AccessibilityInfo.announceForAccessibility(`Budget de ${numAmount} ${currency} sélectionné`);
    }
  }, [amount, currency, onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de budget"
      testID="select-budget-modal"
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
            placeholder="Montant (ex. : 50000)"
            placeholderTextColor={theme.colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            accessibilityLabel="Entrer le montant du budget"
            testID="amount-input"
          />

          <Picker
            selectedValue={currency}
            onValueChange={(value) => setCurrency(value as Currency)}
            style={styles.picker}
            accessibilityLabel="Sélecteur de devise"
            testID="currency-picker"
          >
            {currencies.map((curr) => (
              <Picker.Item key={curr} label={curr} value={curr} />
            ))}
          </Picker>

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                amount && parseFloat(amount) > 0
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

const styles = StyleSheet.create({
  picker: {
    width: '100%',
    height: 50,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    marginVertical: theme.spacing.md,
  },
});

export default SelectBudgetModal;
