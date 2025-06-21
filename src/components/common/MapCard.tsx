// src/components/common/MapCard.tsx

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import { Store } from '../../constants/entities';
import { AccessibilityInfo } from 'react-native';

interface MapCardProps {
  stores: Store[];
  style?: any;
  mapStyle?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

const MapCard: React.FC<MapCardProps> = ({
  stores,
  style,
  mapStyle,
  initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
}) => {
  const handleMarkerPress = useCallback((store: Store) => {
    AccessibilityInfo.announceForAccessibility(`Magasin sélectionné: ${store.nom}`);
  }, []);

  return (
    <View style={[globalStyles.card, style, styles.container]}>
      <Text style={globalStyles.title}>Emplacements des Magasins</Text>
      <MapView
        style={[styles.map, mapStyle]}
        initialRegion={initialRegion}
        accessibilityLabel="Carte des magasins"
      >
        {stores
          .filter(
            (store) =>
              store.localisation &&
              typeof store.localisation.latitude === 'number' &&
              typeof store.localisation.longitude === 'number'
          )
          .map((store) => (
            <Marker
              key={store.id}
              coordinate={{
                latitude: store.localisation!.latitude,
                longitude: store.localisation!.longitude,
              }}
              title={store.nom}
              description={store.localisation?.adresse}
              onPress={() => handleMarkerPress(store)}
            />
          ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.sm,
  },
});

export default React.memo(MapCard);
