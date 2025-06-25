// src/services/market.service.ts - Version corrigée
import { Location, Market, MarketComparison } from '../types/market.types';

export class MarketService {
  static async findBestMarket(
    userLocation: Location,
    markets: Market[],
    shoppingList: string[]
  ): Promise<MarketComparison[]> {
    const comparisons: MarketComparison[] = [];

    for (const market of markets) {
      // CORRECTION: market a latitude/longitude directement, pas market.location
      const marketLocation: Location = {
        latitude: market.latitude,
        longitude: market.longitude
      };

      const distance = this.calculateDistance(userLocation, marketLocation);

      // CORRECTION: Gérer le cas où products n'existe pas encore
      const totalPrice = market.products
        ? this.calculateTotalPrice(market, shoppingList)
        : 0;

      // Score basé sur distance (30%) et prix (70%)
      const distanceScore = Math.max(0, 100 - distance * 2);
      const priceScore = totalPrice > 0 ? Math.max(0, 100 - totalPrice / 10) : 50; // Score neutre si pas de prix
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
    // CORRECTION: Vérifier que products existe
    if (!market.products || market.products.length === 0) {
      return 0;
    }

    let total = 0;

    shoppingList.forEach(item => {
      const product = market.products!.find(p =>
        p.name.toLowerCase().includes(item.toLowerCase())
      );
      if (product) {
        total += product.price;
      }
    });

    return total;
  }

  // Fonction de calcul de distance (formule haversine)
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

  // AJOUT: Méthode utilitaire pour obtenir les marchés proches
  static async getNearbyMarkets(
    userLocation: Location,
    maxDistance: number = 10 // km
  ): Promise<Market[]> {
    // Données de test - marchés de Yaoundé
    const testMarkets: Market[] = [
      {
        id: '1',
        name: 'Marché Central',
        latitude: 3.8480,
        longitude: 11.5021,
        address: 'Centre-ville, Yaoundé',
        category: 'central',
        products: [
          { id: '1', name: 'Tomates', price: 500, unit: 'kg', category: 'légumes' },
          { id: '2', name: 'Oignons', price: 800, unit: 'kg', category: 'légumes' },
          { id: '3', name: 'Riz', price: 1200, unit: 'kg', category: 'céréales' },
        ]
      },
      {
        id: '2',
        name: 'Marché Mokolo',
        latitude: 3.8690,
        longitude: 11.5194,
        address: 'Mokolo, Yaoundé',
        category: 'local',
        products: [
          { id: '4', name: 'Tomates', price: 450, unit: 'kg', category: 'légumes' },
          { id: '5', name: 'Bananes', price: 300, unit: 'régime', category: 'fruits' },
          { id: '6', name: 'Poisson', price: 2000, unit: 'kg', category: 'protéines' },
        ]
      },
      {
        id: '3',
        name: 'Marché Mfoundi',
        latitude: 3.8420,
        longitude: 11.4980,
        address: 'Mfoundi, Yaoundé',
        category: 'local',
        products: [
          { id: '7', name: 'Tomates', price: 480, unit: 'kg', category: 'légumes' },
          { id: '8', name: 'Maïs', price: 600, unit: 'kg', category: 'céréales' },
          { id: '9', name: 'Poulet', price: 3000, unit: 'kg', category: 'protéines' },
        ]
      },
    ];

    // Filtrer les marchés par distance
    const nearbyMarkets: Market[] = [];

    for (const market of testMarkets) {
      const marketLocation: Location = {
        latitude: market.latitude,
        longitude: market.longitude
      };

      const distance = this.calculateDistance(userLocation, marketLocation);

      if (distance <= maxDistance) {
        nearbyMarkets.push(market);
      }
    }

    return nearbyMarkets;
  }

  // AJOUT: Méthode pour comparer les prix d'un produit
  static comparePricesForProduct(
    markets: Market[],
    productName: string
  ): Array<{market: Market, price: number, product: any}> {
    const comparisons: Array<{market: Market, price: number, product: any}> = [];

    markets.forEach(market => {
      if (market.products) {
        const product = market.products.find(p =>
          p.name.toLowerCase().includes(productName.toLowerCase())
        );

        if (product) {
          comparisons.push({
            market,
            price: product.price,
            product
          });
        }
      }
    });

    return comparisons.sort((a, b) => a.price - b.price);
  }
}