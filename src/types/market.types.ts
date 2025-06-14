// src/types/market.types.ts
export interface Location {
  latitude: number;
  longitude: number;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  location: Location;
  rating: number;
  openingHours: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  marketId: string;
}

export interface MarketComparison {
  market: Market;
  distance: number;
  totalPrice: number;
  score: number; // Combinaison distance + prix
}