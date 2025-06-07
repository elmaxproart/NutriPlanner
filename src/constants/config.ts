export const GEMINI_API_KEY = 'AIzaSyAW1p2ooZ6e-rFAljiciIYbHWemGCX3r1I';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const APP_CONFIG = {
  defaultCurrency: 'EUR',
  maxFamilyMembers: 10,
  maxIngredientsPerRecipe: 20,
  maxRecipesPerMenu: 5,
  defaultBudgetLimit: 500,
  maxStoreItemsPerQuery: 50,
  imageSizeLimit: 5 * 1024 * 1024,
  supportedLanguages: ['fr', 'en'] as const,
};


export type SupportedLanguage = typeof APP_CONFIG.supportedLanguages[number];
export type Currency = 'EUR' | 'USD' | 'FCFA';
