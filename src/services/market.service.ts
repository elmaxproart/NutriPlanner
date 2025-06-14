// src/services/market.service.ts
import { Location, Market, MarketComparison } from '../types/market.types';

export class MarketService {
  static async findBestMarket(
    userLocation: Location,
    markets: Market[],
    shoppingList: string[]
  ): Promise<MarketComparison[]> {
    const comparisons: MarketComparison[] = [];

    for (const market of markets) {
      const distance = this.calculateDistance(userLocation, market.location);
      const totalPrice = this.calculateTotalPrice(market, shoppingList);

      // Score basé sur distance (30%) et prix (70%)
      const distanceScore = Math.max(0, 100 - distance * 2);
      const priceScore = Math.max(0, 100 - totalPrice / 10);
      const score = (distanceScore * 0.3) + (priceScore * 0.7);

      comparisons.push({
        market,
        distance,
        totalPrice,
        score,
      });
    }

    return comparisons.sort((a, b) => b.score - a.score);
  }

  private static calculateTotalPrice(
    market: Market,
    shoppingList: string[]
  ): number {
    let total = 0;

    shoppingList.forEach(item => {
      const product = market.products.find(p =>
        p.name.toLowerCase().includes(item.toLowerCase())
      );
      if (product) {
        total += product.price;
      }
    });

    return total;
  }

  // Fonction de calcul de distance simple (formule haversine simplifiée)
  private static calculateDistance(
    point1: Location,
    point2: Location
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) * Math.cos(this.toRad(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}