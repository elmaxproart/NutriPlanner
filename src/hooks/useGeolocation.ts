// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin d\'accéder à votre position pour trouver les marchés à proximité.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'Autoriser',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Erreur permission:', err);
        return false;
      }
    }
    return true; // iOS ou autres plateformes
  };

  const getCurrentPosition = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      // Pour l'émulateur, on simule une position à Yaoundé
      if (__DEV__) {
        setTimeout(() => {
          resolve({
            latitude: 3.848,
            longitude: 11.502,
          });
        }, 1500);
        return;
      }

      // Pour un vrai device, utilisez la géolocalisation native
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Erreur géolocalisation: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Permission de localisation refusée');
      }

      const position = await getCurrentPosition();
      setLocation(position);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de géolocalisation');
      console.error('Erreur géolocalisation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refreshLocation: getCurrentLocation,
  };
};