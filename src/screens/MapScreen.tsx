// src/screens/MapScreen.tsx - Version améliorée avec carte et filtre 30km
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGeolocation } from '../hooks/useGeolocation';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Market } from '../types/market.types';

const { width, height } = Dimensions.get('window');

// Données de test des marchés de Yaoundé (étendue pour les tests)
const TEST_MARKETS: Market[] = [
  {
    id: '1',
    name: 'Marché Central',
    latitude: 3.8480,
    longitude: 11.5021,
    address: 'Centre-ville, Yaoundé',
    category: 'central',
  },
  {
    id: '2',
    name: 'Marché Mokolo',
    latitude: 3.8690,
    longitude: 11.5194,
    address: 'Mokolo, Yaoundé',
    category: 'local',
  },
  {
    id: '3',
    name: 'Marché Mfoundi',
    latitude: 3.8420,
    longitude: 11.4980,
    address: 'Mfoundi, Yaoundé',
    category: 'local',
  },
  {
    id: '4',
    name: 'Marché de la Briqueterie',
    latitude: 3.8560,
    longitude: 11.5240,
    address: 'Briqueterie, Yaoundé',
    category: 'local',
  },
  {
    id: '5',
    name: 'Marché de Tsinga',
    latitude: 3.8320,
    longitude: 11.5120,
    address: 'Tsinga, Yaoundé',
    category: 'local',
  },
  {
    id: '6',
    name: 'Marché de Mendong',
    latitude: 3.8180,
    longitude: 11.4850,
    address: 'Mendong, Yaoundé',
    category: 'local',
  },
  {
    id: '7',
    name: 'Marché de Nlongkak',
    latitude: 3.8780,
    longitude: 11.5350,
    address: 'Nlongkak, Yaoundé',
    category: 'local',
  },
  // Marché éloigné pour tester le filtre de 30km
  {
    id: '8',
    name: 'Marché d\'Mbalmayo',
    latitude: 3.5167,
    longitude: 11.5000,
    address: 'Mbalmayo, Région du Centre',
    category: 'regional',
  },
];

interface MarketWithDistance extends Market {
  distance: number;
}

export const MapScreen: React.FC = () => {
  const {
    location,
    loading,
    error,
    lastUpdate,
    isWatching,
    refreshLocation,
    startWatching,
    stopWatching
  } = useGeolocation();
  const [markets, setMarkets] = useState<MarketWithDistance[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketWithDistance | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Formule de Haversine pour calculer la distance précise
  const calculateHaversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  // Charger et filtrer les marchés dans un rayon de 30km
  const loadNearbyMarkets = async () => {
    if (!location) return;

    setLoadingMarkets(true);

    // Simulation d'une requête API avec calcul des distances
    setTimeout(() => {
      const marketsWithDistance: MarketWithDistance[] = TEST_MARKETS
        .map(market => ({
          ...market,
          distance: calculateHaversineDistance(
            location.latitude,
            location.longitude,
            market.latitude,
            market.longitude
          )
        }))
        .filter(market => market.distance <= 30) // Filtrer dans un rayon de 30km
        .sort((a, b) => a.distance - b.distance); // Trier par distance croissante

      setMarkets(marketsWithDistance);
      setLoadingMarkets(false);
    }, 1000);
  };

  useEffect(() => {
    if (location) {
      loadNearbyMarkets();
    }
  }, [location]);

  const handleTestButton = () => {
    Alert.alert('Test', 'MapScreen fonctionne !');
  };

  const handleRefreshLocation = () => {
    refreshLocation();
  };

  const handleMarketPress = (market: MarketWithDistance) => {
    setSelectedMarket(market);
    setShowMap(true);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const getMarkerColor = (category: string): string => {
    switch (category) {
      case 'central':
        return '#ff4444';
      case 'local':
        return '#44ff44';
      case 'regional':
        return '#4444ff';
      default:
        return '#ffaa00';
    }
  };

  const renderMapModal = () => {
    if (!selectedMarket || !location) return null;

    return (
      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>{selectedMarket.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: selectedMarket.latitude,
              longitude: selectedMarket.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Marqueur pour votre position */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Votre position"
              pinColor="blue"
            />

            {/* Marqueur pour le marché sélectionné */}
            <Marker
              coordinate={{
                latitude: selectedMarket.latitude,
                longitude: selectedMarket.longitude,
              }}
              title={selectedMarket.name}
              description={`${selectedMarket.address} - ${formatDistance(selectedMarket.distance)}`}
              pinColor={getMarkerColor(selectedMarket.category)}
            />
          </MapView>

          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoTitle}>{selectedMarket.name}</Text>
            <Text style={styles.mapInfoAddress}>{selectedMarket.address}</Text>
            <Text style={styles.mapInfoDistance}>
              Distance: {formatDistance(selectedMarket.distance)}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Récupération de votre position..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Erreur de géolocalisation</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefreshLocation}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Marchés dans un rayon de 30km</Text>

        {location ? (
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>📍 Votre position :</Text>
            <Text style={styles.locationText}>
              Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationNote}>
              {__DEV__ ? '(Position simulée - Yaoundé)' : '(Position réelle)'}
            </Text>
            {lastUpdate && (
              <Text style={styles.lastUpdateText}>
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
            <View style={styles.trackingStatus}>
              <Text style={[styles.trackingText, { color: isWatching ? '#28a745' : '#666' }]}>
                {isWatching ? '🟢 Suivi actif' : '🔴 Suivi inactif'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Aucune position disponible</Text>
        )}

        {/* Section des marchés */}
        {location && (
          <View style={styles.marketsSection}>
            <View style={styles.marketsSectionHeader}>
              <Text style={styles.marketsTitle}>
                🏪 Marchés proches ({markets.length} trouvés)
              </Text>
              {loadingMarkets && <Text style={styles.loadingText}>Chargement...</Text>}
            </View>

            {markets.length > 0 ? (
              markets.map((market) => (
                <TouchableOpacity
                  key={market.id}
                  style={[
                    styles.marketCard,
                    { borderLeftColor: getMarkerColor(market.category) }
                  ]}
                  onPress={() => handleMarketPress(market)}
                >
                  <View style={styles.marketInfo}>
                    <View style={styles.marketHeader}>
                      <Text style={styles.marketName}>{market.name}</Text>
                      <View style={[
                        styles.categoryBadge,
                        { backgroundColor: getMarkerColor(market.category) }
                      ]}>
                        <Text style={styles.categoryText}>
                          {market.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.marketAddress}>{market.address}</Text>
                    <Text style={styles.marketDistance}>
                      📍 {formatDistance(market.distance)}
                    </Text>
                  </View>
                  <View style={styles.marketArrow}>
                    <Text style={styles.arrowText}>🗺️</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : !loadingMarkets ? (
              <Text style={styles.noMarketsText}>
                Aucun marché trouvé dans un rayon de 30km
              </Text>
            ) : null}
          </View>
        )}

        {/* Boutons de test */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestButton}>
            <Text style={styles.testButtonText}>Tester Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation}>
            <Text style={styles.refreshButtonText}>Actualiser Position</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.trackingButton, { backgroundColor: isWatching ? '#dc3545' : '#28a745' }]}
            onPress={isWatching ? stopWatching : startWatching}
          >
            <Text style={styles.trackingButtonText}>
              {isWatching ? 'Arrêter le suivi' : 'Démarrer le suivi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statut */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Statut :</Text>
          <Text style={styles.infoText}>• Hook géolocalisation: ✅</Text>
          <Text style={styles.infoText}>• LoadingSpinner: ✅</Text>
          <Text style={styles.infoText}>• Types: ✅</Text>
          <Text style={styles.infoText}>• Position: {location ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>• Marchés (≤30km): {markets.length > 0 ? `✅ (${markets.length})` : '❌'}</Text>
          <Text style={styles.infoText}>• Formule Haversine: ✅</Text>
          <Text style={styles.infoText}>• Tri par distance: ✅</Text>
          <Text style={styles.infoText}>• Suivi temps réel: {isWatching ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>• Seuil de distance: 100m</Text>
          {lastUpdate && (
            <Text style={styles.infoText}>
              • Dernière maj: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>

      {renderMapModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  locationNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noLocationText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  marketsSection: {
    marginBottom: 20,
  },
  marketsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  marketsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  marketCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  marketInfo: {
    flex: 1,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  marketName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  marketAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  marketDistance: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  marketArrow: {
    paddingLeft: 10,
  },
  arrowText: {
    fontSize: 20,
  },
  noMarketsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 5,
  },
  trackingStatus: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackingButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Styles pour la carte
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#007bff',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  mapInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mapInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mapInfoAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mapInfoDistance: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
});