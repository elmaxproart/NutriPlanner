import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Meal, IconFamily, mockMealTypes } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mealType: string, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  isFinalStep?: boolean;
}

interface MealCardProps {
  meal: Meal;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const getThemedIcon = (family: IconFamily, name: string, size: number, color: string) => {
  switch (family) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name} size={size} color={color} />;
    case 'FontAwesome':
      return <FontAwesome name={name} size={size} color={color} />;
    case 'AntDesign':
      return <AntDesign name={name} size={size} color={color} />;
    case 'Ionicons':
      return <Ionicons name={name} size={size} color={color} />;
    default:
      return <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />;
  }
};

const MealCard: React.FC<MealCardProps> = ({ meal, isSelected, onSelect }) => {
  const cardScale = useSharedValue(1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1, { damping: 10, stiffness: 100 });
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, styles.cardSpacing, isSelected && styles.selectedCard]}
      onPress={() => onSelect(meal.id)}
      accessibilityLabel={`Sélectionner le type de repas ${meal.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`meal-card-${meal.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {getThemedIcon(
            meal.icon?.family || 'MaterialCommunityIcons',
            meal.icon?.name || 'silverware',
            40,
            theme.colors.primary,
          )}
          <View style={styles.mealInfo}>
            <Text style={commonStyles.cardTitle}>{meal.name}</Text>
          </View>
          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={theme.colors.primary}
              style={styles.checkIcon}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SelectMealModal: React.FC<SelectMealModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un type de repas',
  isFinalStep = false,
}) => {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

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
      AccessibilityInfo.announceForAccessibility('Modal de sélection de type de repas ouvert');
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSelectedMealId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderMeal = ({ item }: { item: Meal }) => (
    <MealCard meal={item} isSelected={item.id === selectedMealId} onSelect={setSelectedMealId} />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedMealId) {
      const meal = mockMealTypes.find((m) => m.id === selectedMealId);
      if (meal) {
        await onSelect(meal.name, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Type de repas ${meal.name} sélectionné`);
      }
    }
  }, [selectedMealId, onSelect, onClose, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de type de repas"
      testID="select-meal-modal"
    >
      <View style={commonStyles.modalOverlay}>
        <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
          <TouchableOpacity
            style={commonStyles.closeModalButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
            testID="close-button"
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
            {title}
          </Text>
          <FlatList
            data={mockMealTypes}
            renderItem={renderMeal}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucun type de repas disponible.</Text>
              </View>
            }
            accessibilityLabel="Liste des types de repas"
            testID="meals-list"
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedMealId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedMealId
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : [theme.colors.disabled, theme.colors.disabled]
              }
              style={commonStyles.buttonGradient}
            >
              <Text style={commonStyles.buttonText}>
                {isFinalStep ? 'Finaliser' : 'Confirmer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardSpacing: {
    margin: theme.spacing.xs,
    width: '48%',
    aspectRatio: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  mealInfo: {
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
});

export default SelectMealModal;
