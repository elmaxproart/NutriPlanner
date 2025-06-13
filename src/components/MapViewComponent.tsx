import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import useLocation from '../hooks/useLocation';

const MapViewComponent: React.FC = () => {
  console.log('MapViewComponent rendu, useLocation:', useLocation);
  const { latitude, longitude, fetchMarkets, error, isLoading, retryLocation } = useLocation();
  console.log('MapViewComponent après useLocation:', { latitude, longitude, error, isLoading });

  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect déclenché, latitude:', latitude, 'longitude:', longitude);
    if (latitude !== null && longitude !== null) {
      setIsLoadingMarkets(true);
      setFetchError(null);
      fetchMarkets(latitude, longitude)
        .then((data) => {
          console.log('Marchés récupérés:', data);
          setMarkets(data || []);
        })
        .catch((err) => {
          console.error('Erreur dans fetchMarkets :', err);
          setFetchError('Impossible de récupérer les marchés. Vérifiez votre connexion et réessayez.');
        })
        .finally(() => {
          setIsLoadingMarkets(false);
        });
    }
  }, [latitude, longitude, fetchMarkets]);

  if (isLoading) {
    console.log('MapViewComponent: affichage écran de chargement');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement de la localisation...</Text>
      </View>
    );
  }

  if (error) {
    console.log('MapViewComponent: affichage erreur:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Réessayer" onPress={retryLocation} />
      </View>
    );
  }

  if (!latitude || !longitude) {
    console.log('MapViewComponent: localisation non disponible');
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Localisation non disponible</Text>
        <Button title="Réessayer" onPress={retryLocation} />
      </View>
    );
  }

  console.log('MapViewComponent: affichage des marchés');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Markets proches :</Text>
      <Text style={styles.coordinates}>
        Position : {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>

      {isLoadingMarkets ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text>Recherche des marchés...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <Button
            title="Réessayer"
            onPress={() => {
              setIsLoadingMarkets(true);
              setFetchError(null);
              fetchMarkets(latitude, longitude)
                .then((data) => {
                  setMarkets(data || []);
                })
                .catch((err) => {
                  console.error('Erreur dans fetchMarkets :', err);
                  setFetchError('Impossible de récupérer les marchés. Vérifiez votre connexion et réessayez.');
                })
                .finally(() => {
                  setIsLoadingMarkets(false);
                });
            }}
          />
        </View>
      ) : (
        <View>
          {markets.length === 0 ? (
            <Text style={styles.noMarketsText}>Aucun marché trouvé dans les environs</Text>
          ) : (
            markets.map((market, index) => (
              <View key={index} style={styles.marketItem}>
                <Text style={styles.marketName}>
                  {market.tags?.name || 'Marché sans nom'}
                </Text>
                <Text style={styles.marketDistance}>
                  Distance : {market.distance.toFixed(2)} km
                </Text>
                {market.tags?.opening_hours && (
                  <Text style={styles.marketHours}>
                    Horaires : {market.tags.opening_hours}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMarketsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  marketItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  marketName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  marketDistance: {
    fontSize: 14,
    color: '#666',
  },
  marketHours: {
    fontSize: 12,
    color: '#888',
  },
});

export default MapViewComponent;