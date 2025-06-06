// src/services/maketService.ts
const fetchMarkets = async (latitude: number, longitude: number) => {
  const radius = 20000; // 20 km en mètres
  const query = `
    [out:json];
    (
      node["shop"](around:${radius}, ${latitude}, ${longitude});
      way["shop"](around:${radius}, ${latitude}, ${longitude});
      relation["shop"](around:${radius}, ${latitude}, ${longitude});
    );
    out body;
  `;

  try {
    const response = await fetch(`http://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log(data.elements); // Traitement des données des marchés
  } catch (error) {
    console.error(error);
  }
};

export { fetchMarkets };