import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  PanResponder,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Image,
  Animated,
  FlatList,
  TextInput,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

import GetLocation from 'react-native-get-location';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Google Places API key provided by user
const GOOGLE_PLACES_API_KEY = 'AIzaSyDqJtH6hpF1i1ct9qHzKsqHh4wzMwZTzfw';

interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

interface MarketResult {
  place_id: string;
  name: string;
  geometry: PlaceGeometry;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  prix_estime?: number; // Prix estimé en FCFA
  opening_hours?: {
    open_now?: boolean;
  };
}

interface Market extends MarketResult {
  distance?: number;
  durations?: {[mode in Mode]?: string};
}

interface UserLocation {
  latitude: number;
  longitude: number;
}
type Mode = 'walking' | 'bicycling' | 'driving' | 'transit';

interface AutocompletePlacesProps {
  userLocation: UserLocation;
  onPlaceSelected: (place: any) => void;
}
const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cheapestMarket, setCheapestMarket] = useState<Market | null>(null);

  const [selectedMode, setSelectedMode] = useState<
    'walking' | 'bicycling' | 'driving' | 'transit'
  >('walking');
  const [routeCoords, setRouteCoords] = useState<{
    [key: string]: {latitude: number; longitude: number}[];
  }>({});
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 100;
        if (gestureState.dy > threshold) {
          Animated.spring(panY, {
            toValue: 300, // vers le bas (caché partiellement)
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(panY, {
            toValue: 0, // revenir en haut (visible)
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message:
              'Cette application a besoin de votre localisation pour trouver les marchés à proximité.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Permission de localisation refusée.');
          setLoading(false);
          return;
        }
      }
      // For iOS, ensure NSLocationWhenInUseUsageDescription is in Info.plist
      // The permission request is handled by react-native-get-location itself for iOS

      fetchCurrentUserLocation();
    };
    initialize();
  }, []);

  const fetchCurrentUserLocation = () => {
    setLoading(true);
    setError(null);
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000, // 60 seconds
    })
      .then(location => {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        fetchNearbyMarkets(location.latitude, location.longitude);
      })
      .catch(error => {
        const {code, message} = error;
        console.warn(`LOCATION_ERROR ${code}: ${message}`);
        setError(
          "Impossible d'obtenir votre position. Veuillez vérifier vos paramètres de localisation et les permissions.",
        );
        setLoading(false);
      });
  };

  const fetchNearbyMarkets = async (latitude: number, longitude: number) => {
    const radius = 5000; // 5km search radius
    const type = 'market'; // As per user's request, can be extended e.g. 'grocery_or_supermarket|store'
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&keyword=marché|supermarché|épicerie&language=fr&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.status === 'OK') {
        const fetchedMarkets: Market[] = data.results.map(
          (place: MarketResult) => ({
            ...place,
            prix_estime: Math.floor(500 + Math.random() * 4500), // FCFA aléatoire entre 500 et 5000
            distance: calculateDistance(
              latitude,
              longitude,

              place.geometry.location.lat,
              place.geometry.location.lng,
            ),
            durations: {
              walking: calculateDuration(
                calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                ),
                'walking',
              ),
              bicycling: calculateDuration(
                calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                ),
                'bicycling',
              ),
              driving: calculateDuration(
                calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                ),
                'driving',
              ),
              transit: calculateDuration(
                calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                ),
                'transit',
              ),
            },
          }),
        );

        const cheapestMarket = fetchedMarkets.reduce((min, curr) => {
          return curr.prix_estime! < (min.prix_estime || Infinity) ? curr : min;
        }, {} as Market);

        fetchedMarkets.sort(
          (a, b) => (a.distance || Infinity) - (b.distance || Infinity),
        );
        setMarkets(fetchedMarkets);

        setCheapestMarket(cheapestMarket);

        if (fetchedMarkets.length === 0) {
          setError('Aucun marché trouvé dans un rayon de 5km.');
        }
      } else {
        console.warn('PLACES_API_ERROR:', data.status, data.error_message);
        setError(
          data.error_message ||
            'Erreur lors de la recherche de marchés. Status: ' + data.status,
        );
      }
    } catch (err: any) {
      console.error('FETCH_MARKETS_ERROR:', err);
      setError(
        'Une erreur réseau est survenue lors de la recherche des marchés.',
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1));
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const handleOpenMap = (market: Market) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${market.geometry.location.lat},${market.geometry.location.lng}`;
    const label = market.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Erreur', "Impossible d'ouvrir l'application de cartes.");
        }
      });
    } else {
      Alert.alert('Erreur', 'URL de carte non supportée sur cette plateforme.');
    }
  };
  const calculateDuration = (distanceKm: number, mode: Mode): string => {
    // Vitesse moyenne en km/h
    const speeds: {[key in Mode]: number} = {
      walking: 5, // marche à pied
      bicycling: 15, // vélo
      driving: 50, // voiture en ville
      transit: 25, // moyenne bus/métro
    };

    const speed = speeds[mode];
    const timeHours = distanceKm / speed;
    const totalMinutes = Math.round(timeHours * 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  };
  if (loading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../../assets/gifs/radar.gif')}
          style={styles.loadingImage}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{marginVertical: 20}}
        />
        <Text style={styles.loadingText}>Position detection...</Text>
      </View>
    );
  }

  if (error && markets.length === 0) {
    // Show error only if no markets are loaded and there's an error
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchCurrentUserLocation} // Retry fetching location
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const AutocompletePlaces: React.FC<AutocompletePlacesProps> = ({
    userLocation,
    onPlaceSelected,
  }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<
      {place_id: string; description: string}[]
    >([]);
    const [userImage, setUserImage] = useState<string | null>(null);

    useEffect(() => {
      const fetchUserProfileImage = async () => {
        const currentUser = auth().currentUser;
        if (currentUser) {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(currentUser.uid)
              .get();
            const imageUrl = userDoc.data()?.userImageProfile;
            if (imageUrl) setUserImage(imageUrl);
          } catch (error) {
            console.error('Erreur récupération image user :', error);
          }
        }
      };

      fetchUserProfileImage();
    }, []);

    const fetchPlaces = async (input: string) => {
      if (!input) return setResults([]);

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_PLACES_API_KEY}&language=fr&components=country:cm&location=${userLocation.latitude},${userLocation.longitude}&radius=5000`;

      try {
        const response = await fetch(url);
        const json = await response.json();
        setResults(json.predictions);
      } catch (err) {
        console.error('Erreur autocomplete:', err);
      }
    };

    const handleSelect = async (placeId: string) => {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&language=fr`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (json.result) {
          onPlaceSelected(json.result);
          setQuery(json.result.name);
          setResults([]);
        }
      } catch (err) {
        console.error('Erreur details:', err);
      }
    };

    useEffect(() => {
      const delayDebounce = setTimeout(() => {
        fetchPlaces(query);
      }, 500);
      return () => clearTimeout(delayDebounce);
    }, [query]);

    return (
      <View style={styles.scontainer}>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Rechercher un lieu ou un marché..."
            value={query}
            onChangeText={setQuery}
            style={styles.input}
          />
          {userImage && (
            <Image source={{uri: userImage}} style={styles.avatar} />
          )}
        </View>
        {query.length > 0 && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={item => item.place_id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item.place_id)}>
                <Text style={styles.itemText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButtonMap}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      {userLocation && (
        <AutocompletePlaces
          userLocation={userLocation}
          onPlaceSelected={place => {
            const {
              geometry: {
                location: {lat, lng},
              },
            } = place;
            setUserLocation({latitude: lat, longitude: lng});
            fetchNearbyMarkets(lat, lng);
          }}
        />
      )}

      <TouchableOpacity
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 600,
          right: 20,

          backgroundColor: '#1e1e1e',
          padding: 15,
          borderRadius: 50,
          zIndex: 1001,
        }}
        onPress={fetchCurrentUserLocation}>
        <Icon name="locate" size={20} color="#f57c00" />
      </TouchableOpacity>

      {userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE} // Ensures Google Maps is used on Android
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922, // Standard zoom level
            longitudeDelta: 0.0421, // Standard zoom level
          }}
          showsUserLocation={true}>
          {markets.map(market => (
            <Marker
              key={market.place_id}
              coordinate={{
                latitude: market.geometry.location.lat,
                longitude: market.geometry.location.lng,
              }}
              title={market.name}
              description={market.vicinity || `Distance: ${market.distance} km`}
              pinColor="#4CAF50"
              onCalloutPress={() => handleOpenMap(market)} // Open map on callout press
            />
          ))}
        </MapView>
      )}
      {loading && markets.length === 0 && (
        <ActivityIndicator
          style={styles.mapLoadingIndicator}
          size="large"
          color="#4CAF50"
        />
      )}
      <Animated.View
        style={[styles.marketListContainer, {transform: [{translateY: panY}]}]}
        {...panResponder.panHandlers}>
        {/* Barre des modes de transport */}
        <View style={styles.dragHandle} />

        <View style={styles.transportModeContainer}>
          {[
            {mode: 'walking', icon: 'walk'},
            {mode: 'bicycling', icon: 'bicycle'},
            {mode: 'driving', icon: 'car'},
            {mode: 'transit', icon: 'bus'},
          ].map(item => (
            <TouchableOpacity
              key={item.mode}
              style={[
                styles.transportButton,
                selectedMode === item.mode && styles.transportButtonActive,
              ]}
              onPress={() => setSelectedMode(item.mode as any)}>
              <Icon
                name={item.icon}
                size={20}
                color={selectedMode === item.mode ? '#fff' : '#f57c00'}
              />
              <Text
                style={[
                  styles.transportButtonText,
                  selectedMode === item.mode &&
                    styles.transportButtonTextActive,
                ]}>
                {item.mode === 'walking' && 'À pied'}
                {item.mode === 'bicycling' && 'Vélo'}
                {item.mode === 'driving' && 'Voiture'}
                {item.mode === 'transit' && 'Transport'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.marketListTitle}>
          Marchés à 500(km) de vous ({markets.length})
        </Text>

        <View />
        <Text
          style={{
            color: '#fff',
            fontSize: 12,
            marginBottom: 10,
            textAlign: 'center',
          }}>
          Trouvez le marché le plus proche et obtenez l’itinéraire en un clic !
        </Text>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollViewContent}>
          {markets.length > 0
            ? markets.map(market => {
                const isCheapest = cheapestMarket?.place_id === market.place_id;
                return (
                  <TouchableOpacity
                    key={market.place_id}
                    style={styles.marketItem}
                    onPress={() => handleOpenMap(market)}>
                    <Icon name="location-sharp" size={24} color="#f57c00" />
                    <View style={styles.marketItemTextContainer}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.marketItemName}>{market.name}</Text>
                        {isCheapest && (
                          <Icon
                            name="star"
                            size={20}
                            color="#FFD700" // oranje doré
                            style={{marginLeft: 6}}
                          />
                        )}
                      </View>
                      {market.vicinity && (
                        <Text style={styles.marketItemVicinity}>
                          {market.vicinity}
                        </Text>
                      )}
                      {market.distance !== undefined && (
                        <Text style={styles.marketItemDistance}>
                          {market.distance} km{' '}
                          {selectedMode === 'walking' && '(à pied)'}
                          {selectedMode === 'bicycling' && '(vélo)'}
                          {selectedMode === 'driving' && '(voiture)'}
                          {selectedMode === 'transit' && '(transport)'}
                        </Text>
                      )}
                      {market.durations && market.durations[selectedMode] && (
                        <Text style={styles.marketItemDuration}>
                          Durée: {market.durations[selectedMode]}
                        </Text>
                      )}
                    </View>
                    <Icon name="chevron-forward" size={24} color="#f57c00" />
                  </TouchableOpacity>
                );
              })
            : !loading && (
                <Text style={styles.noMarketsText}>
                  {error || 'Aucun marché trouvé.'}
                </Text>
              )}

          {loading && markets.length > 0 && (
            <ActivityIndicator
              size="small"
              color="#f57c00"
              style={{marginTop: 10}}
            />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // dark background
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4CAF50', // green
    alignSelf: 'center',
    marginBottom: 10,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4CAF50', // green
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50', // green
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 15,
    padding: 10,
  },
  backButtonText: {
    color: '#4CAF50', // green
    fontSize: 16,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  mapLoadingIndicator: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -20,
  },
  backButtonMap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  transportModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  transportButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  transportButtonActive: {
    backgroundColor: '#f57c00',
  },
  transportButtonText: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 4,
  },
  transportButtonTextActive: {
    color: '#fff',
  },

  marketListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '50%',
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 12,
  },
  scrollView: {
    marginTop: 5,
  },

  scrollViewContent: {
    paddingBottom: 20,
  },
  marketListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#f57c00',
  },
  marketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  marketItemDuration: {
    color: 'lightgreen',
    fontSize: 12,
    fontStyle: 'italic',
  },

  marketItemTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  marketItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  marketItemVicinity: {
    fontSize: 13,
    color: '#cccccc',
    marginTop: 2,
  },
  marketItemDistance: {
    fontSize: 13,
    color: '#f57c00',
    marginTop: 2,
  },
  noMarketsText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
  scontainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    width: '70%',
    alignSelf: 'center',
    zIndex: 1000,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#2c2c2c',
    borderRadius: 25,

    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color:"white"
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 8,
  },
  list: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    maxHeight: 200,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    elevation: 2,
  },
  item: {
    padding: 12,
    borderBottomColor: 'white',
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 15,
    color: '#f57c00',
  },
  cheapestBanner: {
    backgroundColor: '#e0f7e9',
    padding: 12,
    margin: 10,
    borderRadius: 10,
    borderColor: '#27ae60',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cheapestText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  navigateButton: {
    marginTop: 8,
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  navigateText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MapScreen;
