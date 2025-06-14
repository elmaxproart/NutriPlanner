// src/screens/MapScreen.tsx - Version améliorée avec marchés
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useGeolocation } from '../hooks/useGeolocation';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Market } from '../types/market.types';

// Données de test des marchés de Yaoundé
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
];

export const MapScreen: React.FC = () => {
  const { location, loading, error, refreshLocation } = useGeolocation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);

  // Simuler le chargement des marchés
  const loadNearbyMarkets = async () => {
    if (!location) return;

    setLoadingMarkets(true);

    // Simulation d'une requête API
    setTimeout(() => {
      setMarkets(TEST_MARKETS);
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

  const handleMarketPress = (market: Market) => {
    Alert.alert(
      market.name,
      `${market.address}\nLatitude: ${market.latitude}\nLongitude: ${market.longitude}`
    );
  };

  const calculateDistance = (market: Market): string => {
    if (!location) return 'N/A';

    // Formule simplifiée pour calculer la distance (approximative)
    const lat1 = location.latitude;
    const lon1 = location.longitude;
    const lat2 = market.latitude;
    const lon2 = market.longitude;

    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return `${distance.toFixed(1)} km`;
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
        <Text style={styles.title}>MapScreen - Marchés Proches</Text>

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
          </View>
        ) : (
          <Text style={styles.noLocationText}>Aucune position disponible</Text>
        )}

        {/* Section des marchés */}
        {location && (
          <View style={styles.marketsSection}>
            <View style={styles.marketsSectionHeader}>
              <Text style={styles.marketsTitle}>🏪 Marchés proches</Text>
              {loadingMarkets && <Text style={styles.loadingText}>Chargement...</Text>}
            </View>

            {markets.length > 0 ? (
              markets.map((market) => (
                <TouchableOpacity
                  key={market.id}
                  style={styles.marketCard}
                  onPress={() => handleMarketPress(market)}
                >
                  <View style={styles.marketInfo}>
                    <Text style={styles.marketName}>{market.name}</Text>
                    <Text style={styles.marketAddress}>{market.address}</Text>
                    <Text style={styles.marketDistance}>
                      Distance: {calculateDistance(market)}
                    </Text>
                  </View>
                  <View style={styles.marketArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : !loadingMarkets ? (
              <Text style={styles.noMarketsText}>Aucun marché trouvé à proximité</Text>
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
        </View>

        {/* Statut */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Statut :</Text>
          <Text style={styles.infoText}>• Hook géolocalisation: ✅</Text>
          <Text style={styles.infoText}>• LoadingSpinner: ✅</Text>
          <Text style={styles.infoText}>• Types: ✅</Text>
          <Text style={styles.infoText}>• Position: {location ? '✅' : '❌'}</Text>
          <Text style={styles.infoText}>• Marchés: {markets.length > 0 ? '✅' : '❌'}</Text>
        </View>
      </View>
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
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  marketAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  marketDistance: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  marketArrow: {
    paddingLeft: 10,
  },
  arrowText: {
    fontSize: 18,
    color: '#007bff',
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
});
