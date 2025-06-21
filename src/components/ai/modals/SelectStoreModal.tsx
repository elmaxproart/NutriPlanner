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

import { Store } from '../../../constants/entities';
import { mockStores } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';
import MapCard from '../../common/MapCard';

interface SelectStoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (store: Store, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  stores?: Store[];
  isFinalStep?: boolean;
}

interface StoreCardProps {
  store: Store;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1, { damping: 10, stiffness: 100 });
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, styles.cardSpacing, isSelected && styles.selectedCard]}
      onPress={() => onSelect(store.id)}
      accessibilityLabel={`Sélectionner le magasin ${store.nom}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`store-card-${store.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          <MaterialCommunityIcons
            name="store"
            size={40}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <View style={styles.storeInfo}>
            <Text style={commonStyles.cardTitle}>{store.nom}</Text>
            <Text style={commonStyles.cardDescription} numberOfLines={2}>
              {store.localisation?.adresse || 'Adresse non disponible'}
            </Text>
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

const SelectStoreModal: React.FC<SelectStoreModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un magasin',
  stores = mockStores,
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [filteredStores, setFilteredStores] = useState<Store[]>(stores);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const cities = useMemo(() => [...new Set(stores.map((s) => s.localisation?.ville).filter(Boolean))], [
    stores,
  ]);

  const initialRegion = useMemo(() => {
    const validStores = stores.filter(
      (store) =>
        store.localisation &&
        typeof store.localisation.latitude === 'number' &&
        typeof store.localisation.longitude === 'number',
    );
    if (validStores.length > 0) {
      const avgLat = validStores.reduce((sum, store) => sum + store.localisation!.latitude, 0) / validStores.length;
      const avgLon = validStores.reduce((sum, store) => sum + store.localisation!.longitude, 0) / validStores.length;
      return {
        latitude: avgLat,
        longitude: avgLon,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [stores]);

  const filterStores = useCallback(() => {
    let filtered = stores;
    if (searchQuery) {
      filtered = filtered.filter(
        (store) =>
          store.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.localisation?.adresse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.localisation?.ville?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCity) {
      filtered = filtered.filter((store) => store.localisation?.ville === selectedCity);
    }
    setFilteredStores(filtered);
  }, [searchQuery, selectedCity, stores]);

  useEffect(() => {
    filterStores();
  }, [filterStores]);

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
      AccessibilityInfo.announceForAccessibility('Modal de sélection de magasin ouvert');
      setFilteredStores(stores);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCity(null);
        setSelectedStoreId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, stores]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderCityFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <FlatList
        data={['Tout', ...cities]}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              commonStyles.button,
              styles.categoryButton,
              {
                backgroundColor:
                  item === (selectedCity || 'Tout') ? theme.colors.primary : theme.colors.surface,
              },
            ]}
            onPress={() => setSelectedCity(item === 'Tout' ? null : (item ?? null))}
            accessibilityLabel={`Filtrer par ${item}`}
            testID={`city-filter-${item}`}
          >
            <Text
              style={[
                commonStyles.buttonText,
                {
                  color:
                    item === (selectedCity || 'Tout')
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => item ?? `city-${index}`}
        contentContainerStyle={styles.categoryListContent}
      />
    </View>
  );

  const renderStore = ({ item }: { item: Store }) => (
    <StoreCard
      store={item}
      isSelected={item.id === selectedStoreId}
      onSelect={setSelectedStoreId}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedStoreId) {
      const store = stores.find((s) => s.id === selectedStoreId);
      if (store) {
        await onSelect(store, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Magasin ${store.nom} sélectionné`);
      }
    }
  }, [selectedStoreId, onSelect, onClose, stores, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de magasin"
      testID="select-store-modal"
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
            placeholder="Rechercher un magasin ou une ville..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher un magasin"
            testID="search-input"
          />
          <MapCard
            stores={filteredStores}
            style={styles.mapCard}
            mapStyle={styles.map}
            initialRegion={initialRegion}
          />
          {renderCityFilter()}
          <FlatList
            data={filteredStores}
            renderItem={renderStore}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucun magasin trouvé.</Text>
              </View>
            }
            accessibilityLabel="Liste des magasins"
            testID="stores-list"
          />
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!selectedStoreId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedStoreId
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
    marginVertical: theme.spacing.xs,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  storeInfo: {
    flex: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  mapCard: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  map: {
    height: 200,
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
});

export default SelectStoreModal;
