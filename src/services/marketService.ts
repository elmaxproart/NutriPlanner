// src/services/marketService.ts

// Fonction pour calculer la distance entre deux points géographiques
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const fetchMarkets = async (latitude: number, longitude: number) => {
  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordonnées géographiques invalides');
  }

  const radius = 20000;
  // Requête Overpass pour chercher différents types de commerces
  const query = `
    [out:json][timeout:25];
    (
      node["shop"~"^(supermarket|convenience|department_store|mall|marketplace|grocery|food|butcher|bakery|fishmonger|greengrocer|organic|farm|deli|cheese|seafood|spices|tea|coffee|alcohol|beverages|confectionery|chocolate|ice_cream|frozen_food|health_food|baby_goods|pasta|rice|bulk|food_court|restaurant|fast_food|cafe|bar|pub|food_truck)$"](around:${radius}, ${latitude}, ${longitude});
      way["shop"~"^(supermarket|convenience|department_store|mall|marketplace|grocery|food|butcher|bakery|fishmonger|greengrocer|organic|farm|deli|cheese|seafood|spices|tea|coffee|alcohol|beverages|confectionery|chocolate|ice_cream|frozen_food|health_food|baby_goods|pasta|rice|bulk|food_court|restaurant|fast_food|cafe|bar|pub|food_truck)$"](around:${radius}, ${latitude}, ${longitude});
      node["amenity"~"^(marketplace|food_court|restaurant|fast_food|cafe|bar|pub|food_truck)$"](around:${radius}, ${latitude}, ${longitude});
      way["amenity"~"^(marketplace|food_court|restaurant|fast_food|cafe|bar|pub|food_truck)$"](around:${radius}, ${latitude}, ${longitude});
    );
    out body;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    const data = await response.json();

    if (!data.elements || !Array.isArray(data.elements)) {
      console.warn('Aucun élément trouvé dans la réponse');
      return [];
    }

    const marketsWithDistance = data.elements
      .filter((element: any) => {
        // Filtrer les éléments qui ont des coordonnées
        const hasCoords = element.lat && element.lon;
        // Filtrer les éléments qui ont un nom ou un type de shop/amenity
        const hasInfo = element.tags && (element.tags.name || element.tags.shop || element.tags.amenity);
        return hasCoords && hasInfo;
      })

      .map((element: any) => ({
        ...element,
        distance: haversineDistance(latitude, longitude, element.lat, element.lon),
      }))
      .sort((a: any, b: any) => a.distance - b.distance) // Trier par distance
      .slice(0, 50); // Limiter à 50 résultats

    console.log(`${marketsWithDistance.length} marchés/commerces trouvés`);
    return marketsWithDistance;

  } catch (error) {
    console.error('Erreur dans fetchMarkets :', error);
    throw error;
  }
};