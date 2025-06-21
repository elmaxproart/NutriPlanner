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
import { Recette } from '../../../constants/entities';
import { mockRecipes } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (recipe: Recette, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  isFinalStep?: boolean;
}

interface RecipeCardProps {
  recipe: Recette;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'star';
      case 'moyen':
        return 'star-half-full';
      case 'difficile':
        return 'star-outline';
      default:
        return 'star';
    }
  };

  return (
    <TouchableOpacity
      style={[commonStyles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(recipe.id)}
      accessibilityLabel={`Sélectionner ${recipe.nom}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`recipe-card-${recipe.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          <MaterialCommunityIcons
            name="chef-hat"
            size={40}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <View style={styles.recipeInfo}>
            <Text style={commonStyles.cardTitle}>{recipe.nom}</Text>
            <Text style={commonStyles.cardDescription}>
              {`${recipe.categorie} • ${recipe.tempsPreparation} min`}
            </Text>
            <MaterialCommunityIcons
              name={getDifficultyIcon(recipe.difficulte)}
              size={16}
              color={theme.colors.warning}
              style={styles.difficultyIcon}
            />
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

const SelectRecipeModal: React.FC<SelectRecipeModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner une recette',
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredRecipes, setFilteredRecipes] = useState<Recette[]>(mockRecipes);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const categories = [...new Set(mockRecipes.map((r) => r.categorie))] as string[];

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
      AccessibilityInfo.announceForAccessibility('Modal de sélection de recette ouvert');
      setFilteredRecipes(mockRecipes);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setSelectedRecipeId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible]);

  const filterRecipes = useCallback(() => {
    let filtered = mockRecipes;
    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.nom.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.categorie === selectedCategory);
    }
    setFilteredRecipes(filtered);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    filterRecipes();
  }, [filterRecipes]);

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

  const renderRecipe = ({ item }: { item: Recette }) => (
    <RecipeCard
      recipe={item}
      isSelected={item.id === selectedRecipeId}
      onSelect={setSelectedRecipeId}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedRecipeId) {
      const recipe = mockRecipes.find((r) => r.id === selectedRecipeId);
      if (recipe) {
        await onSelect(recipe, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Recette ${recipe.nom} sélectionnée`);
      }
    }
  }, [selectedRecipeId, onSelect, onClose, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de recette"
      testID="select-recipe-modal"
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
          <TextInput
            style={commonStyles.searchInput}
            placeholder="Rechercher une recette..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher une recette"
            testID="search-input"
          />
          {renderCategoryFilter()}
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucune recette trouvée.</Text>
              </View>
            }
            accessibilityLabel="Liste des recettes"
            testID="recipes-list"
          />
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!selectedRecipeId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedRecipeId
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
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  recipeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  difficultyIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default SelectRecipeModal;
