// src/hooks/useLocalisation.ts
import { useState, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { fetchMarkets } from '../services/marketService';

const useLocation = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const retrieveMarkets = () => {
    if (latitude !== null && longitude !== null) {
      fetchMarkets(latitude, longitude); // Appel correct avec arguments
    }
  };

  return { latitude, longitude, fetchMarkets: retrieveMarkets };
};

export default useLocation;