// src/constants/mockTemplatePreviews.ts
import { generateUniqueId } from '../utils/helpers';
import { PromptType } from '../services/prompts';
import { AiInteraction, AiInteractionType, AiInteractionContent } from '../constants/entities';
import { mockRecipes, mockMenus, mockIngredients, mockStores } from './mockData';

export interface TemplatePreview {
  id: string;
  promptType?: PromptType;
  interactionType: AiInteractionType;
  interaction: AiInteraction;
}

const formatAiInteraction = (
  content: AiInteractionContent,
  type: AiInteractionType,
  conversationId: string = generateUniqueId(),
): AiInteraction => {
  const timestamp = new Date().toISOString();
  return {
    id: generateUniqueId(),
    content,
    isUser: false,
    timestamp,
    type,
    dateCreation: timestamp,
    dateMiseAJour: timestamp,
    conversationId,
  };
};

export const mockTemplatePreviews: TemplatePreview[] = [
  {
    id: 'template1',
    promptType: PromptType.RECIPE_PERSONALIZED,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[0] },
      'recipe',
    ),
  },
  {
    id: 'template2',
    promptType: PromptType.WEEKLY_MENU,
    interactionType: 'menu_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'menu_suggestion',
        menu: mockMenus[0],
        description: 'Menu sénégalais pour la semaine',
        recipes: mockMenus[0].recettes,
      },
      'menu_suggestion',
    ),
  },
  {
    id: 'template3',
    promptType: PromptType.SHOPPING_LIST,
    interactionType: 'shopping_list_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'shopping_list_suggestion',
        listId: 'list1',
        items: [
          { name: 'Feuilles d’Egusi', quantity: 200, unit: 'g', magasins: 'SuperMart Dovv' },
          { name: 'Riz Jollof', quantity: 1000, unit: 'g', magasins: 'SuperMart Dovv' },
        ],
      },
      'shopping_list_suggestion',
    ),
  },
  {
    id: 'template4',
    promptType: PromptType.RECIPE_SUGGESTION,
    interactionType: 'recipe_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'recipe_suggestion',
        recipeId: 'rec2',
        name: 'Jollof Rice',
        description: 'Un plat classique nigérian',
        ingredients: mockRecipes[1].ingredients,
      },
      'recipe_suggestion',
    ),
  },
  {
    id: 'template5',
    promptType: PromptType.QUICK_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[2] }, // Plantain Frit
      'recipe',
    ),
  },
  {
    id: 'template6',
    promptType: PromptType.KIDS_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[2] }, // Plantain Frit
      'recipe',
    ),
  },
  {
    id: 'template7',
    promptType: PromptType.SPECIAL_OCCASION_MENU,
    interactionType: 'menu_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'menu_suggestion',
        menu: mockMenus[1], // Menu for Tabaski
        description: 'Menu festif pour Tabaski',
        recipes: mockMenus[1].recettes,
      },
      'menu_suggestion',
    ),
  },
  {
    id: 'template8',
    promptType: PromptType.BUDGET_MENU,
    interactionType: 'menu_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'menu_suggestion',
        menu: {
          id: 'menu3',
          date: '2025-06-20',
          typeRepas: 'dîner',
          recettes: [mockRecipes[2]], // Plantain Frit
          statut: 'planifié',
          coutTotalEstime: 8,
          createurId: 'user1',
          dateCreation: '2025-06-01T00:00:00Z',
        },
        description: 'Menu économique pour la famille',
        recipes: [mockRecipes[2]],
      },
      'menu_suggestion',
    ),
  },
  {
    id: 'template9',
    promptType: PromptType.BALANCED_DAILY_MENU,
    interactionType: 'menu_suggestion',
    interaction: formatAiInteraction(
      {
        type: 'menu_suggestion',
        menu: {
          id: 'menu4',
          date: '2025-06-20',
          typeRepas: 'déjeuner',
          recettes: [mockRecipes[1]], // Jollof Rice
          statut: 'planifié',
          coutTotalEstime: 10,
          createurId: 'user1',
          dateCreation: '2025-06-01T00:00:00Z',
        },
        description: 'Menu équilibré pour la journée',
        recipes: [mockRecipes[1]],
      },
      'menu_suggestion',
    ),
  },
  {
    id: 'template10',
    promptType: PromptType.INGREDIENT_BASED_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[3] }, // Poulet Yassa
      'recipe',
    ),
  },
  {
    id: 'template11',
    promptType: PromptType.SPECIFIC_DIET_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      {
        type: 'recipe',
        recette: {
          id: 'rec5',
          nom: 'Salade Végétarienne',
          ingredients: [
            mockIngredients[0], // Feuilles d’Egusi
            { id: 'ing6', nom: 'Tomates', quantite: 2, unite: 'unité', categorie: 'légume', perissable: true, stockActuel: 2, createurId: 'user1', dateCreation: '2025-06-01T00:00:00Z' },
          ],
          instructions: ['Laver les légumes', 'Mélanger avec de l’huile d’olive'],
          tempsPreparation: 15,
          portions: 2,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
          createurId: 'user1',
          dateCreation: '2025-06-01T00:00:00Z',
          coutEstime: 5,
        },
      },
      'recipe',
    ),
  },
  {
    id: 'template12',
    promptType: PromptType.LEFTOVER_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      {
        type: 'recipe',
        recette: {
          id: 'rec6',
          nom: 'Ragoût de Restes',
          ingredients: [mockIngredients[1], mockIngredients[4]], // Riz Jollof, Plantain
          instructions: ['Mélanger les restes', 'Cuire à feu doux'],
          tempsPreparation: 20,
          portions: 4,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
          createurId: 'user1',
          dateCreation: '2025-06-01T00:00:00Z',
          coutEstime: 6,
        },
      },
      'recipe',
    ),
  },
  {
    id: 'template13',
    promptType: PromptType.GUEST_RECIPE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[3] }, // Poulet Yassa
    'recipe',
    ),
  },
  {
    id: 'template14',
    promptType: PromptType.BUDGET_PLANNING,
    interactionType: 'budget',
    interaction: formatAiInteraction(
    {
      type: 'budget',
      budget: {
        id: 'budget1',
        mois: '2025-06',
        plafond: 5000,
        depenses: [
        {
          date: '2025-06-02',
          montant: 50,
          description: 'Courses hebdomadaires',
          categorie: 'nourriture',
          preuveAchatUrl: 'https://example.com/receipt1.jpg',
        },
        {
          date: '2025-06-05',
          montant: 10,
          description: 'Savon',
          categorie: 'hygiène',
        },
        ],
        devise: 'FCFA',
        alertes: [
        {
          seuil: 80,
          message: 'Vous avez atteint 80% de votre budget mensuel',
          date: '2025-06-20T10:00:00Z',
        },
        ],
        createurId: 'user1',
        dateCreation: '2025-06-01T00:00:00Z',
      },
    },
    'budget',
    ),
  },
  {
    id: 'template15',
    promptType: PromptType.STORE_SUGGESTION,
    interactionType: 'stores',
    interaction: formatAiInteraction(
    {
      type: 'stores',
      stores: [mockStores[0]], // SuperMart Dovv
        recommendation: 'Magasin recommandé pour les ingrédients africains',
      },
      'stores',
    ),
  },
  {
    id: 'template16',
    promptType: PromptType.RECIPE_COMPATIBILITY,
    interactionType: 'recipe_compatibility',
    interaction: formatAiInteraction(
      {
        type: 'recipe_compatibility',
        recette: mockRecipes[1], // Jollof Rice
        compatibility: {
          isCompatible: true,
          reason: [],
          recommendations: ['Ajouter des légumes pour Fatou (diabète)'],
        },
      },
      'recipe_compatibility',
    ),
  },
  {
    id: 'template17',
    promptType: PromptType.INVENTORY_OPTIMIZATION,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[2] }, // Plantain Frit
      'recipe',
    ),
  },
  {
    id: 'template18',
    promptType: PromptType.MEAL_ANALYSIS,
    interactionType: 'recipe_analysis',
    interaction: formatAiInteraction(
      {
        type: 'recipe_analysis',
        recipeId: 'rec1',
        analysis: {
          calories: 800,
          nutrients: [
            { id: 'nut1', name: 'Protéines', value: 30, unit: 'g' },
            { id: 'nut2', name: 'Glucides', value: 50, unit: 'g' },
          ],
          description: 'Repas riche en protéines, adapté pour la famille',
        },
      },
      'recipe_analysis',
    ),
  },
  {
    id: 'template19',
    promptType: PromptType.FOOD_TREND_ANALYSIS,
    interactionType: 'food_trends',
    interaction: formatAiInteraction(
      {
        type: 'food_trends',
        trends: [
          {
            id: 'trend1',
            name: 'Cuisine africaine',
            description: 'Popularité croissante des plats comme le Jollof Rice',
            popularity: 80,
          },
        ],
      },
      'food_trends',
    ),
  },
  {
    id: 'template20',
    promptType: PromptType.NUTRITIONAL_INFO,
    interactionType: 'nutritional_info',
    interaction: formatAiInteraction(
      {
        type: 'nutritional_info',
        recipeId: 'rec1',
        analysis: {
          calories: 300,
          nutrients: [
            { id: 'nut1', name: 'Protéines', value: 15, unit: 'g' },
            { id: 'nut2', name: 'Glucides', value: 20, unit: 'g' },
          ],
          description: 'Analyse des feuilles d’Egusi',
        },
      },
      'nutritional_info',
    ),
  },
  {
    id: 'template21',
    promptType: PromptType.TROUBLESHOOT_PROBLEM,
    interactionType: 'troubleshoot_problem',
    interaction: formatAiInteraction(
      {
        type: 'troubleshoot_problem',
        question: 'Pâte trop collante pour le fufu',
        solution: 'Ajouter plus de farine de manioc et pétrir doucement',
      },
      'troubleshoot_problem',
    ),
  },
  {
    id: 'template22',
    promptType: PromptType.CREATIVE_IDEAS,
    interactionType: 'creative_ideas',
    interaction: formatAiInteraction(
      {
        type: 'creative_ideas',
        ideas: [
          {
            name: 'Tacos Jollof',
            description: 'Fusion de Jollof Rice dans des tacos',
          },
        ],
      },
      'creative_ideas',
    ),
  },
  {
    id: 'template23',
    promptType: PromptType.RECIPE_FROM_IMAGE,
    interactionType: 'recipe',
    interaction: formatAiInteraction(
      { type: 'recipe', recette: mockRecipes[1] }, // Jollof Rice
      'recipe',
    ),
  },
  {
    id: 'template24',
    promptType: PromptType.INGREDIENT_AVAILABILITY,
    interactionType: 'ingredient_availability',
    interaction: formatAiInteraction(
      {
        type: 'ingredient_availability',
        stores: [mockStores[3]], // Marché Local de Dakar
        ingredients: [
          { nom: 'Oignons', disponible: true, magasin: 'Marché Local de Dakar' },
          { nom: 'Poisson Séché', disponible: true, magasin: 'Marché Local de Dakar' },
        ],
      },
      'ingredient_availability',
    ),
  },
  {
    id: 'template25',
    promptType: undefined,
    interactionType: 'text',
    interaction: formatAiInteraction(
      { type: 'text', message: 'Bonjour, voici une réponse textuelle simple.' },
      'text',
    ),
  },
  {
    id: 'template26',
    promptType: undefined,
    interactionType: 'error',
    interaction: formatAiInteraction(
      { type: 'error', message: 'Erreur lors de la génération de la recette', code: '500' },
      'error',
    ),
  },
  {
    id: 'template27',
    promptType: undefined,
    interactionType: 'json',
    interaction: formatAiInteraction(
      { type: 'json', data: { example: 'Sample JSON data' } },
      'json',
    ),
  },
  {
    id: 'template28',
    promptType: undefined,
    interactionType: 'image',
    interaction: formatAiInteraction(
      {
        type: 'image',
        uri: 'assets/images/jollof.jpg',
        mimeType: 'image/jpeg',
        description: 'Photo d’un plat de Jollof Rice',
      },
      'image',
    ),
  },
  {
    id: 'template29',
    promptType: undefined,
    interactionType: 'tool_use',
    interaction: formatAiInteraction(
      {
        type: 'tool_use',
        toolName: 'nutrition_api',
        parameters: { ingredient: 'Feuilles d’Egusi' },
      },
      'tool_use',
    ),
  },
  {
    id: 'template30',
    promptType: undefined,
    interactionType: 'tool_response',
    interaction: formatAiInteraction(
      {
        type: 'tool_response',
        toolName: 'nutrition_api',
        result: { calories: 300, protein: 15 },
      },
      'tool_response',
    ),
  },
];
