// src/services/maps.service.ts
import { Location } from '../types/market.types';

// Interface pour les infos de route (ajoutée ici pour éviter l'import manquant)
export interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
}

// Clé API simulée pour les tests (remplacez par votre vraie clé)
const GOOGLE_MAPS_API_KEY = 'AIzaSyDqJtH6hpF1i1ct9qHzKsqHh4wzMwZTzfw' ;

export class MapsService {
  private static baseUrl = 'https://maps.googleapis.com/maps/api';

  static async getDistance(
    origin: Location,
    destination: Location
  ): Promise<RouteInfo> {
    // Pour les tests, on retourne des données simulées
    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return this.getSimulatedRoute(origin, destination);
    }

    const url = `${this.baseUrl}/directions/json?` +
      `origin=${origin.latitude},${origin.longitude}&` +
      `destination=${destination.latitude},${destination.longitude}&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].legs[0];
        return {
          distance: route.distance.text,
          duration: route.duration.text,
          polyline: data.routes[0].overview_polyline.points,
        };
      }
      throw new Error('No route found');
    } catch (error) {
      console.warn('Maps API error, using simulated data:', error);
      return this.getSimulatedRoute(origin, destination);
    }
  }

  static async findNearbyMarkets(
    location: Location,
    radius: number = 5000
  ): Promise<any[]> {
    // Pour les tests, on retourne des marchés simulés
    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return this.getSimulatedMarkets(location);
    }

    const url = `${this.baseUrl}/place/nearbysearch/json?` +
      `location=${location.latitude},${location.longitude}&` +
      `radius=${radius}&` +
      `type=grocery_or_supermarket&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn('Places API error, using simulated data:', error);
      return this.getSimulatedMarkets(location);
    }
  }

  // Données simulées pour les tests
  private static getSimulatedRoute(origin: Location, destination: Location): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    return {
      distance: `${distance.toFixed(1)} km`,
      duration: `${Math.round(distance * 3)} min`, // Estimation: 3 min par km
      polyline: 'simulated_polyline_data',
    };
  }

  private static getSimulatedMarkets(location: Location): any[] {
    return [
      {
        place_id: 'sim_1',
        name: 'Marché Central de Yaoundé',
        geometry: {
          location: {
            lat: location.latitude + 0.01,
            lng: location.longitude + 0.01,
          },
        },
        rating: 4.2,
        vicinity: 'Centre-ville, Yaoundé',
      },
      {
        place_id: 'sim_2',
        name: 'Marché Mokolo',
        geometry: {
          location: {
            lat: location.latitude - 0.02,
            lng: location.longitude + 0.015,
          },
        },
        rating: 4.0,
        vicinity: 'Mokolo, Yaoundé',
      },
      {
        place_id: 'sim_3',
        name: 'Carrefour Market',
        geometry: {
          location: {
            lat: location.latitude + 0.015,
            lng: location.longitude - 0.01,
          },
        },
        rating: 4.5,
        vicinity: 'Bastos, Yaoundé',
      },
    ];
  }

  private static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) * Math.cos(this.toRad(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}