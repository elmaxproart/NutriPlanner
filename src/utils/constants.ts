// src/utils/constants.ts
import { Platform } from 'react-native';

// 🔑 Récupération de la clé API depuis les variables d'environnement
export const GOOGLE_MAPS_API_KEY = Platform.select({
  ios: 'AIzaSyBOTI_EXAMPLE_KEY_REPLACE_WITH_YOURS',
  android: 'AIzaSyBOTI_EXAMPLE_KEY_REPLACE_WITH_YOURS',
}) || '';

export const DEFAULT_REGION = {
  latitude: 3.848,
  longitude: 11.502, // Yaoundé
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};