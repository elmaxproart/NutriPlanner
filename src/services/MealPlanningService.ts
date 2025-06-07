import { Menu, MembreFamille, Recette } from '../constants/entities';
import { FirestoreService } from './FirestoreService';
import { GeminiService } from './GeminiService';
import { validateMenu } from '../utils/dataValidators';
import { formatDateForFirestore } from '../utils/helpers';
import { logger } from '../utils/logger';

export class MealPlanningService {
  private firestoreService: FirestoreService;
  private geminiService: GeminiService;

  constructor(userId: string, familyId: string) {
    this.firestoreService = new FirestoreService(userId, familyId);
    this.geminiService = new GeminiService();
  }

  async generateWeeklyPlan(familyMembers: MembreFamille[], startDate: string): Promise<Menu[]> {
    try {
      const recipes = await this.firestoreService.getRecipes();
      const menus: Menu[] = [];
      const days = ['petit-déjeuner', 'déjeuner', 'dîner', 'collation'];

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        for (const typeRepas of days) {
          const suitableRecipes = await Promise.all(
            recipes.map(async (recipe) => {
              const analysis = await this.geminiService.analyzeRecipeWithAI(recipe, familyMembers);
              const isSuitable = familyMembers.every(
                (member) => analysis.suitability[member.userId] === 'adapté'
              );
              return isSuitable ? recipe : null;
            })
          );
          const filteredRecipes = suitableRecipes.filter((recipe): recipe is Recette => recipe !== null);
          const selectedRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)];
          if (selectedRecipe) {
            const menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
              date: formatDateForFirestore(date),
              typeRepas: typeRepas as any,
              recettes: [ selectedRecipe ],
              familyId: familyMembers[0].familyId,
              createurId: familyMembers[0].createurId,
              statut: 'planifié',
              aiSuggestions: { recettesAlternatives: [], ingredientsManquants: [] }, // Ajout pour conformité
            };
            const menuId = await this.firestoreService.addMenu(menu);
            menus.push({
              ...menu,
              id: menuId,
              dateCreation: formatDateForFirestore(new Date()),
              dateMiseAJour: formatDateForFirestore(new Date()),
            });
          }
        }
      }
      logger.info('Weekly plan generated', { count: menus.length });
      return menus;
    } catch (error) {
      logger.error('Error generating weekly plan', { error: error instanceof Error ? error.message : error });
      throw new Error('Failed to generate weekly plan');
    }
  }

  async optimizeMenu(menu: Menu, familyMembers: MembreFamille[]): Promise<Menu> {
    const errors = validateMenu(menu);
    if (errors.length > 0) {
      logger.error('Validation failed for menu', { errors });
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    try {
      const optimizedMenu: Menu = {
        ...menu,
        aiSuggestions: {
          recettesAlternatives: [],
          ingredientsManquants: [],
        },
      };
      for (const recette of menu.recettes) {
        const recipe = await this.firestoreService.getRecipes().then((recipes) =>
          recipes.find((r) => r.id === recette.id) || { id: recette.id }
        ); // Récupérer la recette complète
        const analysis = await this.geminiService.analyzeRecipeWithAI(recipe as Recette, familyMembers);
        familyMembers.forEach((member) => {
          if (analysis.suitability[member.userId] === 'non adapté') {
            optimizedMenu.aiSuggestions!.recettesAlternatives.push('alternative-recipe-id'); // Placeholder
          }
        });
      }
      await this.firestoreService.addMenu(optimizedMenu);
      logger.info('Menu optimized', { id: menu.id });
      return optimizedMenu;
    } catch (error) {
      logger.error('Error optimizing menu', { error: error instanceof Error ? error.message : error });
      throw new Error('Failed to optimize menu');
    }
  }
}
