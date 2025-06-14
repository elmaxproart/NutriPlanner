// src/components/maps/MapView.tsx
import React from 'react';
// Import conditionnel pour éviter les erreurs si react-native-maps n'est pas installé
import { StyleSheet, View, Text } from 'react-native';
import { Location, Market } from '../../types/market.types';

// Types pour la compatibilité avec react-native-maps
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  userLocation: Location;
  markets: Market[];
  onMarketPress: (market: Market) => void;
}

export const CustomMapView: React.FC<Props> = ({
  userLocation,
  markets,
  onMarketPress,
}) => {
  // Version temporaire sans react-native-maps pour éviter les crashes
  // Remplacez par le vrai composant MapView une fois la librairie installée
  const MapViewPlaceholder = () => (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>🗺️ Vue Carte</Text>
      <Text style={styles.locationText}>
        📍 Position: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
      </Text>
      <Text style={styles.marketsText}>
        🏪 {markets.length} marché(s) trouvé(s)
      </Text>
      {markets.map((market, index) => (
        <Text
          key={market.id}
          style={styles.marketItem}
          onPress={() => onMarketPress(market)}
        >
          {index + 1}. {market.name} - {market.address}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <MapViewPlaceholder />
      {/*
      Version avec react-native-maps (à activer quand la librairie est installée) :

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={userLocation}
          title="Ma position"
          pinColor="blue"
        />

        {markets.map((market) => (
          <Marker
            key={market.id}
            coordinate={market.location}
            title={market.name}
            description={market.address}
            onPress={() => onMarketPress(market)}
            pinColor="red"
          />
        ))}
      </MapView>
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  locationText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
    textAlign: 'center',
  },
  marketsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  marketItem: {
    fontSize: 14,
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    textAlign: 'center',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});