export const GEMINI_API_KEY = 'TA_CLÉ_API_GEMINI';
export const GEMINI_API_URL = 'https://api.gemini.com/v1';

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
