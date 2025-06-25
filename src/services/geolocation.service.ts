//src/services/geolocation.service.ts - Version améliorée
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { Location, GeolocationPosition } from '../types/location.types';

export class GeolocationService {
  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  static async getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  static watchPosition(
    callback: (location: Location) => void,
    errorCallback?: (error: any) => void
  ): number {
    return Geolocation.watchPosition(
      (position: GeolocationPosition) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Watch position error:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 100, // Mise à jour tous les 100m
        interval: 30000, // Vérifier toutes les 30 secondes
        fastestInterval: 10000, // Intervalle le plus rapide : 10 secondes
      }
    );
  }

  static clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }

  static stopObserving(): void {
    Geolocation.stopObserving();
  }
}