export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
}