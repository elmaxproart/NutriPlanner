// src/hooks/useGeolocation.ts - Version améliorée avec suivi temps réel
import { useState, useEffect, useRef } from 'react';
import { GeolocationService } from '../services/geolocation.service';
import { Location } from '../types/location.types';

interface UseGeolocationReturn {
  location: Location | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isWatching: boolean;
  refreshLocation: () => void;
  startWatching: () => void;
  stopWatching: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Fonction pour mettre à jour la location
  const updateLocation = (newLocation: Location) => {
    setLocation(newLocation);
    setLastUpdate(new Date());
    setError(null);
  };

  // Fonction pour obtenir la position actuelle
  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      setError(null);

      // Demander les permissions
      const hasPermission = await GeolocationService.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Permission de géolocalisation refusée');
      }

      // En mode développement, utiliser une position fixe pour Yaoundé
      if (__DEV__) {
        const simulatedLocation: Location = {
          latitude: 3.8480,
          longitude: 11.5021,
        };
        updateLocation(simulatedLocation);
        setLoading(false);
        return;
      }

      // Obtenir la position réelle
      const position = await GeolocationService.getCurrentPosition();
      updateLocation(position);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de géolocalisation';
      setError(errorMessage);
      console.error('Geolocation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour démarrer le suivi de position
  const startWatching = () => {
    if (isWatching || watchIdRef.current !== null) {
      return; // Déjà en cours de suivi
    }

    try {
      // En mode développement, ne pas utiliser le suivi réel
      if (__DEV__) {
        console.log('Mode développement: suivi de position simulé');
        setIsWatching(true);
        return;
      }

      // Démarrer le suivi de position réel
      const watchId = GeolocationService.watchPosition((newLocation) => {
        updateLocation(newLocation);
        console.log('Position mise à jour:', newLocation);
      });

      watchIdRef.current = watchId;
      setIsWatching(true);
      console.log('Suivi de position démarré');
    } catch (err) {
      console.error('Erreur lors du démarrage du suivi:', err);
      setError('Impossible de démarrer le suivi de position');
    }
  };

  // Fonction pour arrêter le suivi de position
  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      GeolocationService.clearWatch?.(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
    console.log('Suivi de position arrêté');
  };

  // Fonction pour rafraîchir manuellement la position
  const refreshLocation = () => {
    getCurrentPosition();
  };

  // Effet pour obtenir la position initiale
  useEffect(() => {
    getCurrentPosition();

    // Démarrer automatiquement le suivi
    const timer = setTimeout(() => {
      startWatching();
    }, 1000); // Attendre 1 seconde après la position initiale

    return () => {
      clearTimeout(timer);
      stopWatching();
    };
  }, []);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, []);

  return {
    location,
    loading,
    error,
    lastUpdate,
    isWatching,
    refreshLocation,
    startWatching,
    stopWatching,
  };
};