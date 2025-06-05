import { Ingredient, Menu, MembreFamille } from '../constants/entities';
import { NetworkService } from './NetworkService';
import { GEMINI_API_URL } from '../constants/config';

export class GeminiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = GEMINI_API_URL;
  }

  private async checkNetwork(): Promise<void> {
    const isConnected = await NetworkService.isConnected();
    if (!isConnected) {
      throw new Error('Aucune connexion internet disponible');
    }
  }

  async getMenuSuggestions(ingredients: Ingredient[], familyData: MembreFamille[]): Promise<Menu[]> {
    await this.checkNetwork();
    const response = await fetch(`${this.baseUrl}/suggestions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, familyData }),
    });
    if (!response.ok) {throw new Error(`Erreur API Gemini: ${response.statusText}`);}
    const data = await response.json();
    return data as Menu[];
  }

  async generateShoppingList(menu: Menu): Promise<{ nom: string; quantite: number; unite: string }[]> {
    await this.checkNetwork();
    const response = await fetch(`${this.baseUrl}/shopping-list`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu }),
    });
    if (!response.ok) {throw new Error(`Erreur API Gemini: ${response.statusText}`);}
    return response.json();
  }

  async analyzeMenu(menu: Menu): Promise<{ calories: number; spices: string[]; saltLevel: string }> {
    await this.checkNetwork();
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu }),
    });
    if (!response.ok) {throw new Error(`Erreur API Gemini: ${response.statusText}`);}
    return response.json();
  }
}
