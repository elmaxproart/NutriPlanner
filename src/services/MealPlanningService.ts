import { FirestoreService } from './FirestoreService';
import { GeminiService } from './GeminiService';
import { Menu, MembreFamille, Recette} from '../constants/entities';
import { validateMenu } from '../utils/dataValidators';
import { formatDateForFirestore } from '../utils/helpers';
import { logger } from '../utils/logger';
import { RecipeAnalysisContent } from '../types/messageTypes';

export class MealPlanningService {
  private firestoreService: FirestoreService;
  private geminiService: GeminiService;
  private userId: string;

  constructor(firestoreService: FirestoreService, userId: string) {
    if (!firestoreService) {
      throw new Error('FirestoreService is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.firestoreService = firestoreService;
    this.geminiService = new GeminiService(userId);
    this.userId = userId;
  }

  async generateWeeklyPlan(familyMembers: MembreFamille[], startDate: string, conversationId?: string): Promise<Menu[]> {
    if (!familyMembers.length || !startDate) {
      logger.error('Family members and start date are required');
      return [];
    }

    try {
      const interaction = await this.geminiService.generateWeeklyMenu(this.userId, familyMembers, startDate, conversationId);

      if (interaction.content.type === 'menu_suggestion') {
        const content = interaction.content;
        const menus: Menu[] = (Array.isArray(content.menu) ? content.menu : [content.menu]).map((menu: Menu) => ({
          ...menu,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          aiInteractionId: interaction.id,
          aiSuggestions: {
            recettesAlternatives: [],
            ingredientsManquants: [],
          },
        }));

        await Promise.all(
          menus.map(async (menu) => {
            const {...menuData } = menu; // Exclude id from Firestore add
            const menuId = await this.firestoreService.addMenu(menuData);
            if (menuId) {
              menu.id = menuId;
            }
          })
        );

        logger.info('Weekly plan generated', { count: menus.length });
        return menus;
      }

      logger.error('Unexpected response type for weekly menu');
      return [];
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to generate weekly plan';
      logger.error('Error generating weekly plan', { error: errorMsg });
      return [];
    }
  }

  async optimizeMenu(menu: Menu, familyMembers: MembreFamille[], conversationId?: string): Promise<Menu | null> {
    const errors = validateMenu(menu);
    if (errors.length > 0) {
      logger.error('Validation failed for menu', { errors });
      return null;
    }

    if (!familyMembers.length) {
      logger.error('Family members are required for menu optimization');
      return null;
    }

    try {
      const optimizedMenu: Menu = {
        ...menu,
        aiSuggestions: {
          recettesAlternatives: [],
          ingredientsManquants: [],
        },
        dateMiseAJour: formatDateForFirestore(new Date()),
      };

      for (const recette of menu.recettes) {
        // Fallback to getRecipes until getRecipeById is implemented
        const recipe = (await this.firestoreService.getRecipes()).find((r) => r.id === recette.id) || recette;
        const interaction = await this.geminiService.analyzeRecipeWithAI(
          this.userId,
          recipe as Recette,
          familyMembers,
          conversationId
        );

        const analysis = (interaction.content as RecipeAnalysisContent).analysis;

          familyMembers.forEach((member) => {
          if (analysis.calories > 800) {
            optimizedMenu.aiSuggestions!.recettesAlternatives.push(
              `Recette alternative suggérée pour ${recette.nom || recette.id} (trop calorique pour ${member.nom})`
            );
          }
        });

      }

      const menuData = { ...optimizedMenu };
      const menuId = await this.firestoreService.addMenu(menuData);
      if (menuId) {
        const finalMenu = { ...optimizedMenu, id: menuId };
        logger.info('Menu optimized', { id: menuId });
        return finalMenu;
      }

      logger.error('Failed to save optimized menu');
      return null;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to optimize menu';
      logger.error('Error optimizing menu', { error: errorMsg });
      return null;
    }
  }
}
