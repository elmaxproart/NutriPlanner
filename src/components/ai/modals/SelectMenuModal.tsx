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
import { Menu } from '../../../constants/entities';
import { mockMenus } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface SelectMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (menu: Menu, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  isFinalStep?: boolean;
}

interface MenuCardProps {
  menu: Menu;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ menu, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(menu.id)}
      accessibilityLabel={`Sélectionner le menu ${menu.foodName || 'du ' + menu.date}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`menu-card-${menu.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={40}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <View style={styles.menuInfo}>
            <Text style={commonStyles.cardTitle}>{menu.foodName || `Repas du ${menu.date}`}</Text>
            <Text style={commonStyles.cardDescription}>
              {`${menu.typeRepas} (${menu.statut})`}
            </Text>
            {menu.statut === 'terminé' && (
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={theme.colors.success}
                style={styles.statusIcon}
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

const SelectMenuModal: React.FC<SelectMenuModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un menu',
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>(mockMenus);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const mealTypes = [...new Set(mockMenus.map((m) => m.typeRepas))];

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
      AccessibilityInfo.announceForAccessibility('Modal de sélection de menu ouvert');
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedMealType(null);
        setSelectedMenuId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible]);

  const filterMenus = useCallback(() => {
    let filtered = mockMenus;
    if (searchQuery) {
      filtered = filtered.filter(
        (menu) =>
          menu.foodName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          menu.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedMealType) {
      filtered = filtered.filter((menu) => menu.typeRepas === selectedMealType);
    }
    setFilteredMenus(filtered);
  }, [searchQuery, selectedMealType]);

  useEffect(() => {
    filterMenus();
  }, [filterMenus]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderMealTypeFilter = () => (
    <View style={commonStyles.horizontalListContent}>
      <FlatList
        data={['Tout', ...mealTypes]}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              commonStyles.button,
              {
                marginRight: theme.spacing.sm,
                backgroundColor:
                  item === (selectedMealType || 'Tout')
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
            onPress={() => setSelectedMealType(item === 'Tout' ? null : item)}
            accessibilityLabel={`Filtrer par ${item}`}
            testID={`meal-type-filter-${item}`}
          >
            <Text
              style={[
                commonStyles.buttonText,
                {
                  color:
                    item === (selectedMealType || 'Tout')
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

  const renderMenu = ({ item }: { item: Menu }) => (
    <MenuCard menu={item} isSelected={item.id === selectedMenuId} onSelect={setSelectedMenuId} />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedMenuId) {
      const menu = mockMenus.find((m) => m.id === selectedMenuId);
      if (menu) {
        await onSelect(menu, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(
          `Menu ${menu.foodName || 'du ' + menu.date} sélectionné`,
        );
      }
    }
  }, [selectedMenuId, onSelect, onClose, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de menu"
      testID="select-menu-modal"
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
            placeholder="Rechercher un menu..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher un menu"
            testID="search-input"
          />
          {renderMealTypeFilter()}
          <FlatList
            data={filteredMenus}
            renderItem={renderMenu}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucun menu trouvé.</Text>
              </View>
            }
            accessibilityLabel="Liste des menus"
            testID="menus-list"
          />
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!selectedMenuId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedMenuId
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
  menuInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  statusIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default SelectMenuModal;
