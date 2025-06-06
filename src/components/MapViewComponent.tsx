// src/components/MapViewComponent.tsx

import React, { useEffect } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import useLocation from '../hooks/useLocation';

const MapViewComponent: React.FC = () => {
  const { latitude, longitude, fetchMarkets } = useLocation();

  useEffect(() => {
    if (latitude && longitude) {
      fetchMarkets(); // Appel sans arguments
    }
  }, [latitude, longitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: latitude || 37.78825, // Valeur par défaut
          longitude: longitude || -122.4324, // Valeur par défaut
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
};

export default MapViewComponent;