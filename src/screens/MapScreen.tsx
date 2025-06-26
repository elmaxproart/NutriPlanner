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
  Platform,
} from 'react-native';

// Import conditionnel pour éviter les erreurs
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('react-native-maps not available:', error);
}

import { useGeolocation } from '../hooks/useGeolocation';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Market } from '../types/market.types';

const { width, height } = Dimensions.get('window');

// Simulation d'une fonction pour récupérer les marchés dynamiquement
const fetchMarkets = async (): Promise<Market[]> => {
  // Dans une vraie application, ceci serait une requête API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
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
        {
          id: '8',
          name: 'Marché d\'Mbalmayo',
          latitude: 3.5167,
          longitude: 11.5000,
          address: 'Mbalmayo, Région du Centre',
          category: 'regional',
        },
      ]);
    }, 1000);
  });
};

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
    stopWatching,
  } = useGeolocation();
  const [markets, setMarkets] = useState<MarketWithDistance[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketWithDistance | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Formule de Haversine pour calculer la distance
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

    try {
      const allMarkets = await fetchMarkets();
      const marketsWithDistance: MarketWithDistance[] = allMarkets
        .map((market) => ({
          ...market,
          distance: calculateHaversineDistance(
            location.latitude,
            location.longitude,
            market.latitude,
            market.longitude
          ),
        }))
        .filter((market) => market.distance <= 30)
        .sort((a, b) => a.distance - b.distance);

      setMarkets(marketsWithDistance);
    } catch (error) {
      console.error('Erreur lors du chargement des marchés:', error);
      Alert.alert('Erreur', 'Impossible de charger les marchés');
    } finally {
      setLoadingMarkets(false);
    }
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
    console.log('Marché sélectionné:', market.name);

    if (!MapView) {
      Alert.alert(
        'Carte non disponible',
        `Nom: ${market.name}\nAdresse: ${market.address}\nDistance: ${formatDistance(market.distance)}`
      );
      return;
    }

    if (!market.latitude || !market.longitude || !location) {
      Alert.alert('Erreur', 'Coordonnées invalides pour afficher la carte');
      return;
    }

    setSelectedMarket(market);
    setMapError(null);
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
    if (!selectedMarket || !location || !MapView) return null;

    return (
      <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>{selectedMarket.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMap(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {mapError ? (
            <View style={styles.mapErrorContainer}>
              <Text style={styles.mapErrorText}>Erreur: {mapError}</Text>
              <TouchableOpacity
                style={styles.retryMapButton}
                onPress={() => setShowMap(false)}
              >
                <Text style={styles.retryMapButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={styles.map}
              initialRegion={{
                latitude: selectedMarket.latitude,
                longitude: selectedMarket.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Votre position"
                pinColor="blue"
              />
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
          )}

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

        {!MapView && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Carte non configurée - Infos affichées dans une alerte
            </Text>
          </View>
        )}

        {location && MapView ? (
          <View style={styles.mapSection}>
            <Text style={styles.locationTitle}>📍 Votre position :</Text>
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={styles.userMap}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Votre position"
                pinColor="blue"
              />
            </MapView>
            <Text style={styles.locationNote}>
              {__DEV__ ? '(Position simulée - Yaoundé)' : '(Position réelle)'}
            </Text>
            {lastUpdate && (
              <Text style={styles.lastUpdateText}>
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noLocationText}>Aucune position disponible</Text>
        )}

        {location && (
          <View style={styles.marketsSection}>
            <View style={styles.marketsSectionHeader}>
              <Text style={styles.marketsTitle}>
                🏪 Marchés proches encerclés ({markets.length} trouvés)
              </Text>
              {loadingMarkets && <Text style={styles.loadingText}>Chargement...</Text>}
            </View>

            {markets.length > 0 ? (
              markets.map((market) => (
                <TouchableOpacity
                  key={market.id}
                  style={[
                    styles.marketCard,
                    { borderLeftColor: getMarkerColor(market.category) },
                  ]}
                  onPress={() => handleMarketPress(market)}
                >
                  <View style={styles.marketInfo}>
                    <View style={styles.marketHeader}>
                      <Text style={styles.marketName}>{market.name}</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getMarkerColor(market.category) },
                        ]}
                      >
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
                    <Text style={styles.arrowText}>{MapView ? '🗺️' : 'ℹ️'}</Text>
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

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Statut :</Text>
          <Text style={styles.infoText}>• Hook géolocalisation: ✅</Text>
          <Text style={styles.infoText}>• Position: {location ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>• Marchés (≤30km): {markets.length > 0 ? `✅ (${markets.length})` : '❌'}</Text>
          <Text style={styles.infoText}>• Carte interactive: {MapView ? '✅' : '❌'}</Text>
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
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  mapSection: {
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  userMap: {
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  locationNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#007bff',
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
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapErrorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryMapButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 5,
  },
});