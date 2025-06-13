import { useState, useEffect } from 'react';
import Geolocation, { GeolocationResponse } from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, AppState } from 'react-native';
import { fetchMarkets } from '../services/marketService';

interface Location {
  latitude: number;
  longitude: number;
}

const useLocation = () => {
  console.log('useLocation hook initialisé');
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('useLocation useEffect déclenché');
    const handleAppStateChange = (nextAppState: string) => {
      console.log('AppState changé:', nextAppState);
      if (nextAppState === 'active') {
        requestLocationPermission();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (AppState.currentState === 'active') {
      console.log('App est active, demande de permission');
      requestLocationPermission();
    }

    return () => {
      console.log('Nettoyage useLocation useEffect');
      subscription?.remove();
    };
  }, []);

  const requestLocationPermission = async () => {
    console.log('Demande de permission de localisation');
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        console.log('Permission déjà accordée:', hasPermission);

        if (hasPermission) {
          getCurrentPosition();
          return;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin d\'accéder à votre localisation pour afficher les marchés proches.',
            buttonNeutral: 'Plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        console.log('Résultat de la demande de permission:', granted);

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Permission de localisation refusée');
          setLoading(false);
          return;
        }
      } else if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        console.log('Permission iOS:', status);
        if (status !== 'granted') {
          setError('Permission de localisation refusée sur iOS');
          setLoading(false);
          return;
        }
      }

      getCurrentPosition();
    } catch (err) {
      console.warn('Erreur lors de la demande de permission :', err);
      setError('Erreur lors de la demande de permission');
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    console.log('Récpération de la position actuelle');
    Geolocation.getCurrentPosition(
      ( کریںposition: GeolocationResponse) => {
        console.log('Position obtenue:', position);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation :', error.code, error.message);
        let errorMessage = 'Échec de la géolocalisation';
        switch (error.code) {
          case 1:
            errorMessage = 'Permission de localisation refusée. Veuillez activer la localisation dans les paramètres.';
            break;
          case 2:
            errorMessage = 'Position indisponible. Assurez-vous que le GPS est activé.';
            break;
          case 3:
            errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion ou réessayez.';
            break;
          default:
            errorMessage = `Erreur de géolocalisation : ${error.message}`;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        showLocationDialog: true,
        forceRequestLocation: true,
      }
    );
  };

  const retrieveMarkets = async () => {
    console.log('Récupération des marchés pour location:', location);
    if (!location) {
      throw new Error('Coordonnées non disponibles');
    }
    try {
      const data = await fetchMarkets(location.latitude, location.longitude);
      console.log('Marchés récupérés:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des marchés :', error);
      throw error;
    }
  };

  const refreshLocation = () => {
    console.log('Réessayer la localisation');
    setLoading(true);
    setError(null);
    requestLocationPermission();
  };

  return {
    location,
    fetchMarkets: retrieveMarkets,
    error,
    loading,
    refreshLocation,
  };
};

export default useLocation;