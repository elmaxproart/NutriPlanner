import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';
import { Diet, IconFamily, mockDiets } from '../../../constants/mockData';

interface SelectDietModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (diet: Diet) => Promise<void>;
  title?: string;
  diets?: Diet[];
  initialCategory?: string;
  initialSelectedDietId?: string;
  isFinalStep?: boolean;
}

interface DietCardProps {
  diet: Diet;
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
      return <MaterialCommunityIcons name={'help-circle-outline'} size={size} color={color} />;
  }
};

const DietCard: React.FC<DietCardProps> = ({ diet, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1, {
      damping: 10,
      stiffness: 100,
    });
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, styles.cardSpacing, isSelected && styles.selectedCard]}
      onPress={() => onSelect(diet.id)}
      accessibilityLabel={`Sélectionner la restriction ${diet.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`diet-card-${diet.id}`}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedCardStyle]}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {getThemedIcon(
            diet.icon?.family || 'MaterialCommunityIcons',
            diet.icon?.name || 'food-off',
            40,
            theme.colors.primary
          )}
          <View style={styles.dietInfo}>
            <Text style={commonStyles.cardTitle}>{diet.name}</Text>
            <Text style={commonStyles.cardDescription}>{diet.category}</Text>
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

const SelectDietModal: React.FC<SelectDietModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Modal de restriction diététique',
  diets = [],
  initialCategory = '',
  initialSelectedDietId = '',
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [filteredDiets, setFilteredDiets] = useState<Diet[]>([]);
  const [selectedDietId, setSelectedDietId] = useState<string | null>(initialSelectedDietId);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const dataToUse = useMemo(() => diets.length > 0 ? diets : mockDiets, [diets]);
  const categories = useMemo(() => [...new Set(dataToUse.map((d) => d.category))], [dataToUse]);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de restriction diététique ouvert');
      setSelectedCategory(initialCategory);
      setSelectedDietId(initialSelectedDietId);
      setFilteredDiets(dataToUse);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setSelectedDietId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialCategory, initialSelectedDietId, dataToUse]);

  const filterDiets = useCallback(() => {
    let filtered = dataToUse;
    if (searchQuery) {
      filtered = filtered.filter((diet) =>
        diet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diet.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((diet) => diet.category === selectedCategory);
    }
    setFilteredDiets(filtered);
  }, [searchQuery, selectedCategory, dataToUse]);

  useEffect(() => {
    filterDiets();
  }, [searchQuery, selectedCategory, filterDiets]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderCategoryFilter = useCallback(() => (
    <View style={styles.categoryFilterContainer}>
      <FlatList
        data={['Tout', ...categories]}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              commonStyles.button,
              styles.categoryButton,
              {
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
        contentContainerStyle={styles.categoryListContent}
      />
    </View>
  ), [selectedCategory, categories]);

  const renderDiet = useCallback(({ item }: { item: Diet }) => (
    <DietCard
      diet={item}
      isSelected={item.id === selectedDietId}
      onSelect={setSelectedDietId}
    />
  ), [selectedDietId]);

  const handleConfirm = useCallback(async () => {
    if (selectedDietId) {
      const diet = dataToUse.find((d) => d.id === selectedDietId);
      if (diet) {
        await onSelect(diet);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Restriction ${diet.name} sélectionnée`);
      }
    }
  }, [selectedDietId, dataToUse, onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de restriction diététique"
      testID="select-diet-modal"
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
            placeholder="Rechercher une restriction..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher une restriction diététique"
            testID="search-input"
          />

          {renderCategoryFilter()}

          <FlatList
            data={filteredDiets}
            renderItem={renderDiet}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucune restriction trouvée.</Text>
              </View>
            }
            accessibilityLabel="Liste des restrictions diététiques"
            testID="diets-list"
          />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedDietId}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedDietId
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
  cardSpacing: {
    margin: theme.spacing.sm,
    width: '48%',
    aspectRatio: 1.2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  dietInfo: {
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  categoryFilterContainer: {
    marginBottom: theme.spacing.md,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  categoryListContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
});

export default SelectDietModal;
