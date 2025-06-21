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
import { IconFamily, mockOccasions, Occasion } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectOccasionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (occasion: Occasion, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  isFinalStep?: boolean;
}

interface OccasionCardProps {
  occasion: Occasion;
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
    default:
      return <MaterialCommunityIcons name="party-popper" size={size} color={color} />;
  }
};

const OccasionCard: React.FC<OccasionCardProps> = ({ occasion, isSelected, onSelect }) => {
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
      onPress={() => onSelect(occasion.id)}
      accessibilityLabel={`Sélectionner l'occasion ${occasion.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`occasion-card-${occasion.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {getThemedIcon(
            occasion.icon?.family || 'MaterialCommunityIcons',
            occasion.icon?.name || 'party-popper',
            40,
            theme.colors.primary,
          )}
          <View style={styles.occasionInfo}>
            <Text style={commonStyles.cardTitle}>{occasion.name}</Text>
            <Text style={commonStyles.cardDescription}>{occasion.category}</Text>
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

const SelectOccasionModal: React.FC<SelectOccasionModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner une occasion',
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredOccasions, setFilteredOccasions] = useState<Occasion[]>(mockOccasions);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | null>(null);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const categories = useMemo(() => [...new Set(mockOccasions.map((o) => o.category))], []);

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
      AccessibilityInfo.announceForAccessibility("Modal de sélection d'occasion ouvert");
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setSelectedOccasionId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible]);

  const filterOccasions = useCallback(() => {
    let filtered = mockOccasions;
    if (searchQuery) {
      filtered = filtered.filter(
        (occasion) =>
          occasion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          occasion.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((occasion) => occasion.category === selectedCategory);
    }
    setFilteredOccasions(filtered);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    filterOccasions();
  }, [filterOccasions]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderCategoryFilter = () => (
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
  );

  const renderOccasion = ({ item }: { item: Occasion }) => (
    <OccasionCard
      occasion={item}
      isSelected={item.id === selectedOccasionId}
      onSelect={setSelectedOccasionId}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedOccasionId) {
      const occasion = mockOccasions.find((o) => o.id === selectedOccasionId);
      if (occasion) {
        await onSelect(occasion, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Occasion ${occasion.name} sélectionnée`);
      }
    }
  }, [selectedOccasionId, onSelect, onClose, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection d'occasion"
      testID="select-occasion-modal"
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
            placeholder="Rechercher une occasion..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher une occasion"
            testID="search-input"
          />
          {renderCategoryFilter()}
          <FlatList
            data={filteredOccasions}
            renderItem={renderOccasion}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucune occasion trouvée.</Text>
              </View>
            }
            accessibilityLabel="Liste des occasions"
            testID="occasions-list"
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedOccasionId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedOccasionId
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
  occasionInfo: {
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
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryListContent: {
    paddingHorizontal: theme.spacing.md,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
});

export default SelectOccasionModal;
