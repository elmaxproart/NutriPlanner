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

import { IconFamily } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';
import { Localisation, Store } from '../../../constants/entities';
import MapCard from '../../common/MapCard';

interface SelectLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: Localisation, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  availableLocations: Localisation[];
  initialSelectedLocation?: Localisation | null;
  isFinalStep?: boolean;
}

interface LocationCardProps {
  location: Localisation;
  isSelected: boolean;
  onSelect: (adresse: string) => void;
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
      return <MaterialCommunityIcons name="map-marker" size={size} color={color} />;
  }
};

const LocationCard: React.FC<LocationCardProps> = ({ location, isSelected, onSelect }) => {
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
      onPress={() => onSelect(location.adresse)}
      accessibilityLabel={`Sélectionner ${location.adresse}, ${location.ville}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`location-card-${location.adresse}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {getThemedIcon('MaterialCommunityIcons', 'map-marker', 40, theme.colors.primary)}
          <View style={styles.locationInfo}>
            <Text style={commonStyles.cardTitle} numberOfLines={1}>
              {location.adresse}
            </Text>
            <Text style={commonStyles.cardDescription} numberOfLines={1}>
              {`${location.ville}, ${location.pays}`}
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

const SelectLocationModal: React.FC<SelectLocationModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner une localisation',
  availableLocations,
  initialSelectedLocation = null,
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Localisation[]>(availableLocations);
  const [selectedLocationAdresse, setSelectedLocationAdresse] = useState<string | null>(
    initialSelectedLocation ? initialSelectedLocation.adresse : null,
  );

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const cities = useMemo(() => [...new Set(availableLocations.map((l) => l.ville).filter(Boolean))], [
    availableLocations,
  ]);

  // Convert locations to stores for MapCard compatibility
  const locationsAsStores = useMemo(() => {
    return filteredLocations.map((location) => ({
      id: location.adresse,
      nom: location.adresse,
      localisation: {
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
        adresse: location.adresse,
        ville: location.ville,
        pays: location.pays,
      },
    })) as Store[];
  }, [filteredLocations]);

  const initialRegion = useMemo(() => {
    const validLocations = availableLocations.filter(
      (loc) => typeof loc.latitude === 'number' && typeof loc.longitude === 'number',
    );
    if (validLocations.length > 0) {
      const avgLat = validLocations.reduce((sum, loc) => sum + (loc.latitude || 0), 0) / validLocations.length;
      const avgLon = validLocations.reduce((sum, loc) => sum + (loc.longitude || 0), 0) / validLocations.length;
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
  }, [availableLocations]);

  const filterLocations = useCallback(() => {
    let filtered = availableLocations;
    if (searchQuery) {
      filtered = filtered.filter(
        (location) =>
          location.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (location.ville?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
          (location.pays?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCity) {
      filtered = filtered.filter((location) => location.ville === selectedCity);
    }
    setFilteredLocations(filtered);
  }, [searchQuery, selectedCity, availableLocations]);

  useEffect(() => {
    filterLocations();
  }, [filterLocations]);

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
      AccessibilityInfo.announceForAccessibility('Modal de sélection de localisation ouvert');
      setSelectedLocationAdresse(initialSelectedLocation ? initialSelectedLocation.adresse : null);
      setFilteredLocations(availableLocations);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCity(null);
        setSelectedLocationAdresse(null);
        setFilteredLocations(availableLocations);
      });
    }
  }, [visible, initialSelectedLocation, availableLocations, modalOpacity, modalTranslateY]);

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

  const renderLocation = ({ item }: { item: Localisation }) => (
    <LocationCard
      location={item}
      isSelected={item.adresse === selectedLocationAdresse}
      onSelect={setSelectedLocationAdresse}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedLocationAdresse) {
      const location = availableLocations.find((l) => l.adresse === selectedLocationAdresse);
      if (location) {
        await onSelect(location, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(
          `Localisation ${location.adresse}, ${location.ville} sélectionnée`,
        );
      }
    }
  }, [selectedLocationAdresse, onSelect, onClose, availableLocations, isFinalStep]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de localisation"
      testID="select-location-modal"
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
            placeholder="Rechercher une adresse, ville ou pays..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher une localisation"
            testID="search-input"
          />
          <MapCard
            stores={locationsAsStores}
            style={styles.mapCard}
            mapStyle={styles.map}
            initialRegion={initialRegion}
          />
          {renderCityFilter()}
          <FlatList
            data={filteredLocations}
            renderItem={renderLocation}
            keyExtractor={(item) => item.adresse}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>Aucune localisation trouvée.</Text>
                {availableLocations.length === 0 && (
                  <Text style={commonStyles.textSecondary}>
                    Veuillez fournir des localisations à sélectionner.
                  </Text>
                )}
              </View>
            }
            accessibilityLabel="Liste des localisations"
            testID="locations-list"
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedLocationAdresse}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedLocationAdresse
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
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    minHeight: 80,
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
  locationInfo: {
    flex: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
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

export default SelectLocationModal;
