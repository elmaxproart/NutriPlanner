import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
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
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ingredient } from '../../../constants/entities';
import { mockIngredients } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (ingredient: Ingredient, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  ingredients?: Ingredient[];
  isFinalStep?: boolean; // Added optional prop
}

interface IngredientCardProps {
  ingredient: Ingredient;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const isNearExpiration = ingredient.datePeremption
    ? new Date(ingredient.datePeremption) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <TouchableOpacity
      style={[commonStyles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(ingredient.id)}
      accessibilityLabel={`Sélectionner ${ingredient.nom}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`ingredient-card-${ingredient.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          <MaterialCommunityIcons
            name="food"
            size={40}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <View style={styles.ingredientInfo}>
            <Text style={commonStyles.cardTitle}>{ingredient.nom}</Text>
            <Text style={commonStyles.cardDescription}>
              {`${ingredient.quantite} ${ingredient.unite} ${ingredient.categorie ? `(${ingredient.categorie})` : ''}`}
            </Text>
            {isNearExpiration && (
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={theme.colors.warning}
                style={styles.warningIcon}
              />
            )}
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

const SelectIngredientModal: React.FC<SelectIngredientModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un ingrédient',
  ingredients = [],
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>(ingredients.length > 0 ? ingredients : mockIngredients);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

  // Animations
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  // Use real data if available, otherwise fallback to mock
  const dataSource = ingredients.length > 0 ? ingredients : mockIngredients;

  // Catégories uniques
  const categories = [...new Set(dataSource.map((i) => i.categorie).filter(Boolean))] as string[];

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection d’ingrédient ouvert');
      setFilteredIngredients(dataSource); // Reset filtered list when modal opens
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration });
      setSearchQuery('');
      setSelectedCategory(null);
      setSelectedIngredientId(null);
    }
  }, [modalOpacity, modalTranslateY, visible, dataSource]);

  // Filtrage des ingrédients
  const filterIngredients = useCallback(() => {
    let filtered = dataSource;
    if (searchQuery) {
      filtered = filtered.filter((ingredient) =>
        ingredient.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((ingredient) => ingredient.categorie === selectedCategory);
    }
    setFilteredIngredients(filtered);
  }, [searchQuery, selectedCategory, dataSource]);

  useEffect(() => {
    filterIngredients();
  }, [searchQuery, selectedCategory, filterIngredients]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderCategoryFilter = () => (
    <View style={commonStyles.horizontalListContent}>
      <FlatList
        data={['Tout', ...categories]}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              commonStyles.button,
              {
                marginRight: theme.spacing.sm,
                backgroundColor:
                  item === (selectedCategory || 'Tout')
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
            onPress={() => setSelectedCategory(item === 'Tout' ? null : item)}
            accessibilityLabel={`Filtrer par ${item}`}
            testID={`category-filter-${item}`}
          >
            <Text
              style={[
                commonStyles.buttonText,
                {
                  color:
                    item === (selectedCategory || 'Tout')
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />
    </View>
  );

  const renderIngredient = ({ item }: { item: Ingredient }) => (
    <IngredientCard
      ingredient={item}
      isSelected={item.id === selectedIngredientId}
      onSelect={setSelectedIngredientId}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedIngredientId) {
      const ingredient = dataSource.find((i) => i.id === selectedIngredientId);
      if (ingredient) {
        await onSelect(ingredient, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`${ingredient.nom} sélectionné`);
      }
    }
  }, [selectedIngredientId, onSelect, onClose, dataSource, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection d’ingrédient"
      testID="select-ingredient-modal"
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
            placeholder="Rechercher un ingrédient..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher un ingrédient"
            testID="search-input"
          />

          {renderCategoryFilter()}

          <FlatList
            data={filteredIngredients}
            renderItem={renderIngredient}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucun ingrédient trouvé.</Text>
              </View>
            }
            accessibilityLabel="Liste des ingrédients"
            testID="ingredients-list"
          />

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!selectedIngredientId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedIngredientId
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : ['#666', '#666']
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
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  warningIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default SelectIngredientModal;
