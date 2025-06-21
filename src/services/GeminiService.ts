import { NetworkService } from './NetworkService';
import { FirestoreService } from './FirestoreService';
import { GEMINI_API_KEY, GEMINI_API_URL } from '../constants/config';
import {
  Ingredient,
  MembreFamille,
  Menu,
  Recette,
  HistoriqueRepas,
  AiInteraction,
  AiInteractionType,
  AiInteractionContent,
} from '../constants/entities';
import { mockStores as PREDEFINED_STORES } from '../constants/mockData';
import { logger } from '../utils/logger';
import { formatDateForFirestore, generateId, getErrorMessage } from '../utils/helpers';
import { prompts, PromptType } from './prompts';
import {
  ImageContent,
  TextContent,
  JsonContent,
  MenuSuggestionContent,
  ShoppingListSuggestionContent,
  RecipeAnalysisContent,
  RecipeSuggestionContent,
  ToolUseContent,
  ToolResponseContent,
  ErrorContent,
  RecipeContent,
  MenuContent,
  ShoppingListContent,
  IngredientAvailabilityContent,
  FoodTrendsContent,
  NutritionalInfoContent,
  TroubleshootProblemContent,
  CreativeIdeasContent,
  StoreSuggestionContent,
  RecipeCompatibilityContent,
  BudgetContent,
} from '../types/messageTypes';

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: {
      name: string;
      content: string | object;
    };
  };
}

export interface Content {
  role: 'user' | 'model' | 'function' | 'system';
  parts: Part[];
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

export interface GenerationConfig {
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: object;
  temperature?: number;
  topP?: number;
  topK?: number;
  candidateCount?: number;
  maxOutputTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseLogprobs?: boolean;
  logprobs?: number;
}

export interface Tool {
  functionDeclarations: {
    name: string;
    description: string;
    parameters: object;
  }[];
}

export interface ToolConfig {
  functionCallingConfig: {
    mode: 'NONE' | 'AUTO' | 'ANY';
    allowedFunctionNames?: string[];
  };
}

export interface GenerateContentRequest {
  contents: Content[];
  tools?: Tool[];
  toolConfig?: ToolConfig;
  safetySettings?: SafetySetting[];
  systemInstruction?: Content;
  generationConfig?: GenerationConfig;
  cachedContent?: string;
}

export interface GenerateContentResponse {
  candidates?: {
    content: Content;
    finishReason: string;
    safetyRatings: any[];
    citation?: any;
    metadata?: any;
    tokenCount?: number;
    sourceAttributions?: any;
    grounding?: any;
    avgLogprobs?: number;
    probs?: any;
    urlRetrieval?: any;
    urlContext?: any;
    index?: number;
  }[];
  promptFeedback?: {
    type?: any;
    safetyRatings?: any;
  };
  usageMetadata?: {
    metadata?: any;
    prompt: string;
    candidates?: number;
    totalTokens?: number;
  };
  modelVersion?: string;
  responseId?: string;
}

interface PromptOptions {
  promptId: PromptType;
  params?: Record<string, any>;
  systemInstruction?: string;
  generationConfig?: Partial<GenerationConfig>;
  safetySettings?: SafetySetting[];
  tools?: Tool[];
  toolConfig?: ToolConfig;
  conversationId?: string;
  images?: ImageContent[];
}

/**
 * Service avancé pour interagir avec l'API Gemini, gérant la génération de contenu texte,
 * les interactions multi-modales (texte, image), et les outils externes. Version optimisée
 * pour le modèle gemini-1.5-flash et intégrée avec NutriPlanner.
 */
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelName: string = 'gemini-1.5-flash';
  private readonly firestoreService: FirestoreService;
  private readonly promptCache: Map<PromptType, string> = new Map();
  private readonly userId: string;

  private defaultSafetySettings: SafetySetting[] = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  ];

  private defaultGenerationConfig: GenerationConfig = {
    temperature: 0.85,
    maxOutputTokens: 4096,
    topP: 0.95,
    topK: 40,
    candidateCount: 1,
    presencePenalty: 0.2,
    frequencyPenalty: 0.1,
    responseMimeType: 'application/json',
  };

  private defaultTools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: 'findStoresWithIngredient',
          description: 'Trouve des magasins à proximité avec un ingrédient spécifique.',
          parameters: {
            type: 'object',
            properties: {
              ingredient: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
            },
            required: ['ingredient', 'latitude', 'longitude'],
          },
        },
      ],
    },
  ];

  constructor(userId: string) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY manquant dans la configuration.');
    }
    if (!userId) {
      throw new Error('Utilisateur non authentifié.');
    }

    this.apiKey = GEMINI_API_KEY;
    this.baseUrl = GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
    this.userId = userId;
    this.firestoreService = new FirestoreService(userId);

    logger.info('Initialisation de GeminiService avec gemini-1.5-flash', {
      model: this.modelName,
      baseUrl: this.baseUrl,
      userId,
    });
  }

  /**
   * Vérifie la connectivité réseau avec retry.
   * @throws Error si la connexion échoue après plusieurs tentatives.
   */
  private async checkNetwork(): Promise<void> {
    const retries = 3;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const isConnected = await NetworkService.isConnected();
        if (!isConnected) {
          throw new Error('Aucune connexion internet disponible.');
        }
        return;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Échec de la vérification réseau après ${retries} tentatives : ${getErrorMessage(error)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Construit le contenu pour l'API Gemini à partir des interactions.
   * Supporte tous les types de contenu définis.
   * @param interactions Historique des interactions.
   * @param additionalImages Images supplémentaires à inclure.
   * @returns Contenus formatés pour l'API Gemini.
   */
  private buildGeminiContents(interactions: AiInteraction[], additionalImages: ImageContent[] = []): Content[] {
    const contents: Content[] = [];

    for (const interaction of interactions) {
      const parts: Part[] = [];
      const content = interaction.content;

      switch (content.type as AiInteractionType) {
        case 'text':
          parts.push({ text: (content as TextContent).message });
          break;

        case 'json':
          parts.push({ text: JSON.stringify((content as JsonContent).data) });
          break;

        case 'image':
          const imageContent = content as ImageContent;
          if (imageContent.data) {
            parts.push({
              inlineData: {
                mimeType: imageContent.mimeType,
                data: imageContent.data,
              },
            });
          } else {
            parts.push({ text: `Image: ${imageContent.uri} (${imageContent.description || 'sans description'})` });
          }
          break;

        case 'menu_suggestion':
          parts.push({ text: JSON.stringify((content as MenuSuggestionContent)) });
          break;

        case 'shopping_list_suggestion':
          parts.push({ text: JSON.stringify((content as ShoppingListSuggestionContent)) });
          break;

        case 'recipe_analysis':
          parts.push({ text: JSON.stringify((content as RecipeAnalysisContent)) });
          break;

        case 'recipe_suggestion':
          parts.push({ text: JSON.stringify((content as RecipeSuggestionContent)) });
          break;

        case 'tool_use':
          parts.push({
            functionCall: {
              name: (content as ToolUseContent).toolName,
              args: (content as ToolUseContent).parameters,
            },
          });
          break;

        case 'tool_response':
          parts.push({
            functionResponse: {
              name: (content as ToolResponseContent).toolName,
              response: {
                name: (content as ToolResponseContent).toolName,
                content: (content as ToolResponseContent).result,
              },
            },
          });
          break;

        case 'error':
          parts.push({ text: `Erreur: ${(content as ErrorContent).message}` });
          break;

        case 'recipe':
          parts.push({ text: JSON.stringify((content as RecipeContent).recette) });
          break;

        case 'menu':
          parts.push({ text: JSON.stringify((content as MenuContent).menu) });
          break;

        case 'shopping':
          parts.push({ text: JSON.stringify((content as ShoppingListContent).listeCourses) });
          break;

        case 'budget':
          parts.push({ text: JSON.stringify((content as BudgetContent).budget) });
          break;

        case 'ingredient_availability':
          parts.push({ text: JSON.stringify((content as IngredientAvailabilityContent)) });
          break;

        case 'food_trends':
          parts.push({ text: JSON.stringify((content as FoodTrendsContent)) });
          break;

        case 'nutritional_info':
          parts.push({ text: JSON.stringify((content as NutritionalInfoContent)) });
          break;

        case 'troubleshoot_problem':
          parts.push({ text: JSON.stringify((content as TroubleshootProblemContent)) });
          break;

        case 'creative_ideas':
          parts.push({ text: JSON.stringify((content as CreativeIdeasContent)) });
          break;

        case 'stores':
          parts.push({ text: JSON.stringify((content as StoreSuggestionContent)) });
          break;

        case 'recipe_compatibility':
          parts.push({ text: JSON.stringify((content as RecipeCompatibilityContent)) });
          break;

        default:
          logger.warn('Type de contenu non supporté', { type: content.type });
          parts.push({ text: JSON.stringify(content) });
          break;
      }

      contents.push({
        role: interaction.isUser ? 'user' : 'model',
        parts,
      });
    }

    for (const image of additionalImages) {
      contents.push({
        role: 'user',
        parts: [
          image.data
            ? {
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.data,
                },
              }
            : { text: `Image: ${image.uri} (${image.description || 'sans description'})` },
        ],
      });
    }

    return contents;
  }

  /**
   * Génère un prompt à partir d'un modèle prédéfini.
   * @param options Options du prompt.
   * @returns Prompt généré.
   */
  private generatePrompt(options: PromptOptions): string {
    const { promptId, params = {} } = options;

    if (this.promptCache.has(promptId)) {
      return this.promptCache.get(promptId)!;
    }

    const promptTemplate = prompts.find((p) => p.id === promptId);
    if (!promptTemplate) {
      const errorMsg = `Prompt non trouvé pour l'ID: ${promptId}`;
      logger.error(errorMsg, { userId: this.userId });
      throw new Error(errorMsg);
    }

    try {
      const generatedPrompt = promptTemplate.generate(params);
      this.promptCache.set(promptId, generatedPrompt);
      return generatedPrompt;
    } catch (error) {
      const errorMsg = `Erreur lors de la génération du prompt ${promptId}: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });
      throw new Error(errorMsg);
    }
  }

  /**
   * Envoie une requête à l'API Gemini.
   * @param request Requête à envoyer.
   * @returns Réponse de l’API.
   */
  private async sendRequest(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    await this.checkNetwork();

    const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API Gemini: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.info('Réponse API Gemini reçue', {
        tokenCount: data.usageMetadata?.totalTokens,
        userId: this.userId,
      });
      return data;
    } catch (error) {
      const errorMsg = `Erreur lors de l'appel API Gemini: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });
      throw new Error(errorMsg);
    }
  }

  /**
   * Mappe la réponse de l’API au type de contenu approprié.
   * @param promptId ID du prompt.
   * @param response Réponse brute.
   * @returns Contenu formaté.
   */
  private mapResponseToContent(promptId: PromptType, response: any): AiInteractionContent {
    switch (promptId) {
      case PromptType.WEEKLY_MENU:
      case PromptType.SPECIAL_OCCASION_MENU:
      case PromptType.BUDGET_MENU:
      case PromptType.BALANCED_DAILY_MENU:
        return {
          type: 'menu_suggestion',
          menu: {
            id: response.menuId || generateId('Menu'),
            createurId: this.userId,
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            date: response.date || new Date().toISOString().slice(0, 10),
            typeRepas: response.typeRepas || 'dîner',
            recettes: response.recipes?.map((r: any) => ({
              id: r.id || generateId('Recette'),
              nom: r.nom || 'Recette inconnue',
              createurId: this.userId,
              dateCreation: formatDateForFirestore(new Date()),
              dateMiseAJour: formatDateForFirestore(new Date()),
              ingredients: r.ingredients?.map((i: any) => ({
                id: i.id || generateId('Ingredient'),
                nom: i.nom || '',
                quantite: i.quantite || 0,
                unite: i.unite || 'unité',
                createurId: this.userId,
                dateCreation: formatDateForFirestore(new Date()),
                dateMiseAJour: formatDateForFirestore(new Date()),
                perissable: i.perissable ?? false,
                stockActuel: i.stockActuel ?? 0,
              })) || [],
              instructions: r.instructions || [],
              tempsPreparation: r.tempsPreparation || 0,
              portions: r.portions || 1,
              categorie: r.categorie || 'plat principal',
              difficulte: r.difficulte || 'facile',
              etapesPreparation: r.etapesPreparation || [],
            })) || [],
            statut: 'planifié',
          },
          description: response.description || 'Menu généré par IA',
          recipes: response.recipes?.map((r: any) => ({
            id: r.id || generateId('Recette'),
            nom: r.nom || 'Recette inconnue',
            createurId: this.userId,
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            ingredients: r.ingredients?.map((i: any) => ({
              id: i.id || generateId('Ingredient'),
              nom: i.nom || '',
              quantite: i.quantite || 0,
              unite: i.unite || 'unité',
              createurId: this.userId,
              dateCreation: formatDateForFirestore(new Date()),
              dateMiseAJour: formatDateForFirestore(new Date()),
              perissable: i.perissable ?? false,
              stockActuel: i.stockActuel ?? 0,
            })) || [],
            instructions: r.instructions || [],
            tempsPreparation: r.tempsPreparation || 0,
            portions: r.portions || 1,
            categorie: r.categorie || 'plat principal',
            difficulte: r.difficulte || 'facile',
            etapesPreparation: r.etapesPreparation || [],
          })) || [],
        } as MenuSuggestionContent;

      case PromptType.SHOPPING_LIST:
        return {
          type: 'shopping_list_suggestion',
          listId: response.listId || generateId('ListeCourses'),
          items: response.items?.map((item: any) => ({
            name: item.nom || '',
            quantity: item.quantite || 0,
            unit: item.unite || 'unité',
            magasins: item.magasinSuggeré || '',
          })) || [],
        } as ShoppingListSuggestionContent;

      case PromptType.RECIPE_NUTRITION_ANALYSIS:
      case PromptType.MEAL_ANALYSIS:
        return {
          type: 'recipe_analysis',
          recipeId: response.recipeId || generateId('Recette'),
          analysis: {
            calories: response.calories || 0,
            nutrients: response.nutrients?.map((n: any) => ({
              id: generateId('Nutrient'),
              name: n.name || '',
              value: n.value || 0,
              unit: n.unit || 'g',
            })) || [],
            description: response.description || 'Analyse nutritionnelle générée par IA',
          },
        } as RecipeAnalysisContent;

      case PromptType.RECIPE_SUGGESTION:
      case PromptType.RECIPE_PERSONALIZED:
      case PromptType.QUICK_RECIPE:
      case PromptType.KIDS_RECIPE:
      case PromptType.INGREDIENT_BASED_RECIPE:
      case PromptType.SPECIFIC_DIET_RECIPE:
      case PromptType.RECIPE_FROM_IMAGE:
      case PromptType.LEFTOVER_RECIPE:
      case PromptType.GUEST_RECIPE:
      case PromptType.INVENTORY_OPTIMIZATION:
        return {
          type: 'recipe_suggestion',
          recipeId: response.id || generateId('Recette'),
          name: response.nom || 'Recette AI',
          description: response.description || 'Générée par IA',
          ingredients: response.ingredients?.map((item: any) => ({
            id: item.id || generateId('Ingredient'),
            nom: item.nom || '',
            quantite: item.quantite || 0,
            unite: item.unite || 'unité',
            createurId: this.userId,
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            perissable: item.perissable ?? false,
            stockActuel: item.stockActuel ?? 0,
          })) || [],
        } as RecipeSuggestionContent;

      case PromptType.INGREDIENT_AVAILABILITY:
        return {
          type: 'ingredient_availability',
          stores: response.stores?.map((s: any) => ({
            id: s.id || generateId('Store'),
            nom: s.name || '',
            articles: s.articles || [],
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            categorie: s.categorie || 'marché local',
          })) || [],
          ingredients: response.ingredients?.map((i: any) => ({
            nom: i.nom || '',
            disponible: i.disponible ?? false,
            magasin: i.magasin,
          })) || [],
        } as IngredientAvailabilityContent;

      case PromptType.FOOD_TREND_ANALYSIS:
        return {
          type: 'food_trends',
          trends: response.trends?.map((t: any) => ({
            id: generateId('Trend'),
            name: t.name || '',
            description: t.description || '',
            popularity: t.popularity || 0,
          })) || [],
        } as FoodTrendsContent;

      case PromptType.NUTRITIONAL_INFO:
        return {
          type: 'nutritional_info',
          recipeId: response.recipeId,
          analysis: {
            calories: response.calories || 0,
            nutrients: response.nutrients?.map((n: any) => ({
              id: generateId('Nutrient'),
              name: n.name || '',
              value: n.value || 0,
              unit: n.unit || 'g',
            })) || [],
            description: response.description,
          },
        } as NutritionalInfoContent;

      case PromptType.TROUBLESHOOT_PROBLEM:
        return {
          type: 'troubleshoot_problem',
          question: response.question || '',
          solution: response.solution || '',
        } as TroubleshootProblemContent;

      case PromptType.CREATIVE_IDEAS:
        return {
          type: 'creative_ideas',
          ideas: response.ideas?.map((i: any) => ({
            name: i.name || '',
            description: i.description || '',
          })) || [],
        } as CreativeIdeasContent;

      case PromptType.STORE_SUGGESTION:
        return {
          type: 'stores',
          stores: response.stores?.map((s: any) => ({
            id: s.id || generateId('Store'),
            nom: s.name || '',
            articles: s.articles || [],
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            categorie: s.categorie || 'marché local',
          })) || [],
          recommendation: response.recommendation,
        } as StoreSuggestionContent;

      case PromptType.RECIPE_COMPATIBILITY:
        return {
          type: 'recipe_compatibility',
          recette: {
            id: response.recipeId || generateId('Recette'),
            nom: response.nom || 'Recette inconnue',
            createurId: this.userId,
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            ingredients: response.ingredients?.map((i: any) => ({
              id: i.id || generateId('Ingredient'),
              nom: i.nom || '',
              quantite: i.quantite || 0,
              unite: i.unite || 'unité',
              createurId: this.userId,
              dateCreation: formatDateForFirestore(new Date()),
              dateMiseAJour: formatDateForFirestore(new Date()),
              perissable: i.perissable ?? false,
              stockActuel: i.stockActuel ?? 0,
            })) || [],
            instructions: response.instructions || [],
            tempsPreparation: response.tempsPreparation || 0,
            portions: response.portions || 1,
            categorie: response.categorie || 'plat principal',
            difficulte: response.difficulte || 'facile',
            etapesPreparation: response.etapesPreparation || [],
          },
          compatibility: {
            isCompatible: response.isCompatible ?? false,
            reason: response.reason || [],
            recommendations: response.recommendations || [],
          },
        } as RecipeCompatibilityContent;

      case PromptType.BUDGET_PLANNING:
        return {
          type: 'budget',
          budget: {
            id: response.id || generateId('Budget'),
            createurId: this.userId,
            dateCreation: formatDateForFirestore(new Date()),
            dateMiseAJour: formatDateForFirestore(new Date()),
            mois: response.mois || new Date().toISOString().slice(0, 7),
            plafond: response.plafond || 0,
            depenses: response.depenses || [],
            devise: response.devise || 'EUR',
          },
        } as BudgetContent;

      default:
        return {
          type: 'json',
          data: response,
        } as JsonContent;
    }
  }

  /**
   * Génère une réponse IA pour un prompt donné.
   * @param options Options du prompt.
   * @returns Interaction AI générée.
   */
  private async generatePromptResponse(options: PromptOptions): Promise<AiInteraction> {
    const {
      promptId,
      params,
      systemInstruction,
      generationConfig,
      safetySettings,
      tools,
      toolConfig,
      conversationId,
      images = [],
    } = options;

    try {
      let interactions: AiInteraction[] = [];
      if (conversationId) {
        interactions = await this.firestoreService.getAiInteractionsForConversation(conversationId);
      }

      const promptText = this.generatePrompt({ promptId, params });
      const promptContent: Content = {
        role: 'user',
        parts: [{ text: promptText }],
      };

      const contents = [...this.buildGeminiContents(interactions, images), promptContent];

      const request: GenerateContentRequest = {
        contents,
        safetySettings: safetySettings || this.defaultSafetySettings,
        generationConfig: {
          ...this.defaultGenerationConfig,
          ...generationConfig,
        },
        tools: tools || this.defaultTools,
        toolConfig,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      };

      const response = await this.sendRequest(request);

      if (!response.candidates?.length) {
        throw new Error('Aucune réponse valide reçue de l’API Gemini.');
      }

      const candidate = response.candidates[0];
      const responseParts = candidate.content.parts;

      let content: AiInteractionContent;

      if (responseParts[0].functionCall) {
        const functionCall = responseParts[0].functionCall;
        content = {
          type: 'tool_use',
          toolName: functionCall.name,
          parameters: functionCall.args,
        } as ToolUseContent;
      } else if (responseParts[0].text) {
        try {
          const parsedResponse = JSON.parse(responseParts[0].text);
          content = this.mapResponseToContent(promptId, parsedResponse);
        } catch {
          content = {
            type: 'text',
            message: responseParts[0].text,
          } as TextContent;
        }
      } else {
        throw new Error('Format de réponse non supporté.');
      }

      const interaction: AiInteraction = {
        id: generateId('Interaction'),
        content,
        isUser: false,
        type: content.type as AiInteractionType,
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: options.conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, interaction);
      }

      return interaction;
    } catch (error) {
      const errorMsg = `Erreur lors de la génération de la réponse: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });

      const errorInteraction: AiInteraction = {
        id: generateId('Interaction'),
        content: {
          type: 'error',
          message: errorMsg,
          code: 'GENERATION_FAILED',
        } as ErrorContent,
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, errorInteraction);
      }

      return errorInteraction;
    }
  }

  /**
   * Génère du contenu avec l'API Gemini.
   * @param messages Historique des messages.
   * @param userInput Input utilisateur.
   * @param options Options supplémentaires.
   * @returns Réponse générée.
   */
  async generateContent(
    messages: AiInteraction[],
    userInput: {
      text?: string;
      imageUrl?: string;
      imageDataBase64?: string;
      imageMimeType?: string;
    },
    options: { systemInstruction?: string; conversationId?: string } = {}
  ): Promise<AiInteraction> {
    try {
      const { systemInstruction, conversationId } = options;
      const promptContent: Content = {
        role: 'user',
        parts: [],
      };

      if (userInput.text) {
        promptContent.parts.push({ text: userInput.text });
      }

      if (userInput.imageDataBase64 && userInput.imageMimeType) {
        promptContent.parts.push({
          inlineData: {
            mimeType: userInput.imageMimeType,
            data: userInput.imageDataBase64,
          },
        });
      }

      const contents = [
        ...this.buildGeminiContents(messages, [
          {
            type: 'image',
            uri: userInput.imageUrl,
            data: userInput.imageDataBase64,
            mimeType: userInput.imageMimeType,
          } as ImageContent,
        ]),
        promptContent,
      ];

      const request: GenerateContentRequest = {
        contents,
        safetySettings: this.defaultSafetySettings,
        generationConfig: this.defaultGenerationConfig,
        tools: this.defaultTools,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      };

      const response = await this.sendRequest(request);

      if (!response.candidates?.length) {
        throw new Error('Aucune réponse valide reçue de l’API Gemini.');
      }

      const candidate = response.candidates[0];
      const responseParts = candidate.content.parts;

      let content: AiInteractionContent;

      if (responseParts[0].functionCall) {
        const functionCall = responseParts[0].functionCall;
        content = {
          type: 'tool_use',
          toolName: functionCall.name,
          parameters: functionCall.args,
        } as ToolUseContent;
      } else if (responseParts[0].text) {
        try {
          const parsedResponse = JSON.parse(responseParts[0].text);
          content = {
            type: 'json',
            data: parsedResponse,
          } as JsonContent;
        } catch {
          content = {
            type: 'text',
            message: responseParts[0].text,
          } as TextContent;
        }
      } else {
        throw new Error('Format de réponse non supporté.');
      }

      const interaction: AiInteraction = {
        id: generateId('Interaction'),
        content,
        isUser: false,
        type: content.type as AiInteractionType,
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, interaction);
      }

      return interaction;
    } catch (error) {
      const errorMsg = `Erreur lors de la génération de contenu: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });

      const errorInteraction: AiInteraction = {
        id: generateId('Interaction'),
        content: {
          type: 'error',
          message: errorMsg,
          code: 'GENERATION_FAILED',
        } as ErrorContent,
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: options.conversationId || generateId('Conversation'),
      };

      if (options.conversationId) {
        await this.firestoreService.addAiInteractionToConversation(options.conversationId, errorInteraction);
      }

      return errorInteraction;
    }
  }

  /**
   * Génère des suggestions de menus.
   * @param userId ID de l’utilisateur.
   * @param ingredients Ingrédients disponibles.
   * @param members Membres de la famille.
   * @param numDays Nombre de jours.
   * @param numMealsPerDay Nombre de repas par jour.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec MenuSuggestionContent.
   */
  async generateMenuSuggestionsFromAI(
    userId: string,
    ingredients: Ingredient[],
    members: MembreFamille[],
    numDays: number = 7,
    numMealsPerDay: number = 2,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.WEEKLY_MENU,
      params: { ingredients, members, numDays, numMealsPerDay },
      conversationId,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 5000,
      },
    });
  }

  /**
   * Génère une liste de courses optimisée.
   * @param userId ID de l’utilisateur.
   * @param menu Menu sélectionné.
   * @param currentIngredients Ingrédients disponibles.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec ShoppingListSuggestionContent.
   */
  async generateShoppingListFromAI(
    userId: string,
    menu: Menu,
    currentIngredients: Ingredient[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.SHOPPING_LIST,
      params: { menu, currentIngredients },
      conversationId,
    });
  }

  /**
   * Analyse une recette pour ses valeurs nutritionnelles et son adéquation familiale.
   * @param userId ID de l’utilisateur.
   * @param recipe Recette à analyser.
   * @param familyData Données familiales.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeAnalysisContent.
   */
  async analyzeRecipeWithAI(
    userId: string,
    recipe: Recette,
    familyData: MembreFamille[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.RECIPE_NUTRITION_ANALYSIS,
      params: { recipe, family: familyData },
      conversationId,
    });
  }

  /**
   * Génère des suggestions de recettes.
   * @param userId ID de l’utilisateur.
   * @param ingredients Ingrédients disponibles.
   * @param preferences Préférences utilisateur.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateRecipeSuggestionsFromAI(
    userId: string,
    ingredients: Ingredient[],
    preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string },
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.RECIPE_SUGGESTION,
      params: { ingredients, preferences },
      conversationId,
    });
  }

  /**
   * Vérifie la disponibilité d’un ingrédient dans les magasins à proximité.
   * @param userId ID de l’utilisateur.
   * @param ingredientName Nom de l’ingrédient.
   * @param location Localisation utilisateur.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec IngredientAvailabilityContent.
   */
  async checkIngredientAvailability(
    userId: string,
    ingredientName: string,
    location: { latitude: number; longitude: number },
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    try {
      const suggestedStores = PREDEFINED_STORES.filter((store) =>
        store.articles.some((article) => article.nom.toLowerCase().includes(ingredientName.toLowerCase()))
      );

      const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const nearbyStores = suggestedStores
        .filter((store) => {
          if (!store.localisation) {return false;}
          const dist = distance(
            location.latitude,
            location.longitude,
            store.localisation.latitude,
            store.localisation.longitude
          );
          return dist <= 10;
        })
        .map((store) => ({
          id: store.id,
          nom: store.nom,
          articles: store.articles,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          categorie: store.categorie || 'marché local',
        }));

      const interaction: AiInteraction = {
        id: generateId('Interaction'),
        content: {
          type: 'ingredient_availability',
          stores: nearbyStores,
          ingredients: [{ nom: ingredientName, disponible: nearbyStores.length > 0 }],
        } as IngredientAvailabilityContent,
        isUser: false,
        type: 'ingredient_availability',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, interaction);
      }

      return interaction;
    } catch (error) {
      const errorMsg = `Erreur lors de la vérification de la disponibilité: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });

      const errorInteraction: AiInteraction = {
        id: generateId('Interaction'),
        content: {
          type: 'error',
          message: errorMsg,
          code: 'AVAILABILITY_CHECK_FAILED',
        } as ErrorContent,
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, errorInteraction);
      }

      return errorInteraction;
    }
  }

  /**
   * Génère une recette personnalisée pour un membre.
   * @param userId ID de l’utilisateur.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generatePersonalizedRecipe(
    userId: string,
    member: MembreFamille,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.RECIPE_PERSONALIZED,
      params: { member },
      conversationId,
      generationConfig: { temperature: 0.9, maxOutputTokens: 3000 },
    });
  }

  /**
   * Génère une recette à partir d’une image.
   * @param userId ID de l’utilisateur.
   * @param imageUrl URL de l’image.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateRecipeFromImage(
    userId: string,
    imageUrl: string,
    member: MembreFamille,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    const imageContent: ImageContent = {
      type: 'image',
      uri: imageUrl,
      mimeType: 'image/jpeg',
      description: 'Photo pour génération de recette',
    };
    return this.generatePromptResponse({
      promptId: PromptType.RECIPE_FROM_IMAGE,
      params: { imageUri: imageUrl, member },
      conversationId,
      images: [imageContent],
      generationConfig: { temperature: 1.0, maxOutputTokens: 2500 },
    });
  }

  /**
   * Génère un menu hebdomadaire pour la famille.
   * @param userId ID de l’utilisateur.
   * @param members Membres de la famille.
   * @param dateStart Date de début.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec MenuSuggestionContent.
   */
  async generateWeeklyMenu(
    userId: string,
    members: MembreFamille[],
    dateStart: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.WEEKLY_MENU,
      params: { members, dateStart },
      conversationId,
      generationConfig: { temperature: 0.8, maxOutputTokens: 5000 },
    });
  }

  /**
   * Génère un menu pour une occasion spéciale.
   * @param userId ID de l’utilisateur.
   * @param members Membres de la famille.
   * @param occasion Type d’occasion.
   * @param date Date de l’occasion.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec MenuSuggestionContent.
   */
  async generateSpecialOccasionMenu(
    userId: string,
    members: MembreFamille[],
    occasion: string,
    date: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.SPECIAL_OCCASION_MENU,
      params: { members, occasion, date },
      conversationId,
    });
  }

  /**
   * Génère un menu économique.
   * @param userId ID de l’utilisateur.
   * @param members Membres de la famille.
   * @param budget Budget disponible.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec MenuSuggestionContent.
   */
  async generateBudgetMenu(
    userId: string,
    members: MembreFamille[],
    budget: number,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.BUDGET_MENU,
      params: { members, budget },
      conversationId,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
    });
  }

  /**
   * Génère un menu équilibré pour une journée.
   * @param userId ID de l’utilisateur.
   * @param member Membre de la famille.
   * @param date Date du menu.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec MenuSuggestionContent.
   */
  async generateBalancedDailyMenu(
    userId: string,
    member: MembreFamille,
    date: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.BALANCED_DAILY_MENU,
      params: { member, date },
      conversationId,
    });
  }

  /**
   * Génère une recette rapide.
   * @param userId ID de l’utilisateur.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateQuickRecipe(userId: string, member: MembreFamille, conversationId?: string): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.QUICK_RECIPE,
      params: { member },
      conversationId,
    });
  }

  /**
   * Génère une recette pour enfants.
   * @param userId ID de l’utilisateur.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateKidsRecipe(userId: string, member: MembreFamille, conversationId?: string): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.KIDS_RECIPE,
      params: { member },
      conversationId,
    });
  }

  /**
   * Génère une recette basée sur un ingrédient principal.
   * @param userId ID de l’utilisateur.
   * @param ingredient Ingrédient principal.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateIngredientBasedRecipe(
    userId: string,
    ingredient: Ingredient,
    member: MembreFamille,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.INGREDIENT_BASED_RECIPE,
      params: { ingredient, member },
      conversationId,
    });
  }

  /**
   * Génère une recette pour un régime spécifique.
   * @param userId ID de l’utilisateur.
   * @param member Membre de la famille.
   * @param diet Type de régime.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateSpecificDietRecipe(
    userId: string,
    member: MembreFamille,
    diet: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.SPECIFIC_DIET_RECIPE,
      params: { member, diet },
      conversationId,
    });
  }

  /**
   * Génère une recette à partir de restes.
   * @param userId ID de l’utilisateur.
   * @param ingredients Ingrédients disponibles.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateLeftoverRecipe(
    userId: string,
    ingredients: Ingredient[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.LEFTOVER_RECIPE,
      params: { ingredients },
      conversationId,
    });
  }

  /**
   * Génère une recette pour des invités.
   * @param userId ID de l’utilisateur.
   * @param members Membres de la famille.
   * @param guestCount Nombre d’invités.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async generateGuestRecipe(
    userId: string,
    members: MembreFamille[],
    guestCount: number,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.GUEST_RECIPE,
      params: { members, guestCount },
      conversationId,
    });
  }

  /**
   * Génère un plan budgétaire alimentaire.
   * @param userId ID de l’utilisateur.
   * @param budgetLimit Budget limite.
   * @param month Mois concerné.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec BudgetContent.
   */
  async generateBudgetPlan(
    userId: string,
    budgetLimit: number,
    month: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.BUDGET_PLANNING,
      params: { budgetLimit, month },
      conversationId,
    });
  }

  /**
   * Suggère un magasin pour un ingrédient.
   * @param userId ID de l’utilisateur.
   * @param ingredient Ingrédient concerné.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec StoreSuggestionContent.
   */
  async suggestStore(userId: string, ingredient: Ingredient, conversationId?: string): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    try {
      const suggestedStores = PREDEFINED_STORES.filter((store) =>
        store.articles.some((article) => article.nom.toLowerCase().includes(ingredient.nom.toLowerCase()))
      );

      const content: StoreSuggestionContent = {
        type: 'stores',
        stores: suggestedStores.map((s) => ({
          id: s.id || generateId('Store'),
          nom: s.nom,
          articles: s.articles,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          categorie: s.categorie || 'marché local',
        })),
        recommendation: suggestedStores.length
          ? `Magasins suggérés pour ${ingredient.nom}`
          : `Aucun magasin trouvé pour ${ingredient.nom}`,
      };

      const interaction: AiInteraction = {
        id: generateId('Interaction'),
        content,
        isUser: false,
        type: 'stores',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, interaction);
      }

      return interaction;
    } catch (error) {
      const errorMsg = `Erreur lors de la suggestion de magasin: ${getErrorMessage(error)}`;
      logger.error(errorMsg, { userId: this.userId });

      const errorInteraction: AiInteraction = {
        id: generateId('Interaction'),
        content: {
          type: 'error',
          message: errorMsg,
          code: 'STORE_SUGGESTION_FAILED',
        } as ErrorContent,
        isUser: false,
        type: 'error',
        timestamp: new Date().toISOString(),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId: conversationId || generateId('Conversation'),
      };

      if (conversationId) {
        await this.firestoreService.addAiInteractionToConversation(conversationId, errorInteraction);
      }

      return errorInteraction;
    }
  }

  /**
   * Vérifie la compatibilité d’une recette avec la famille.
   * @param userId ID de l’utilisateur.
   * @param recipe Recette à vérifier.
   * @param members Membres de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeCompatibilityContent.
   */
  async checkRecipeCompatibility(
    userId: string,
    recipe: Recette,
    members: MembreFamille[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.RECIPE_COMPATIBILITY,
      params: { recipe, members },
      conversationId,
    });
  }

  /**
   * Optimise l’inventaire en suggérant des recettes.
   * @param userId ID de l’utilisateur.
   * @param ingredients Ingrédients disponibles.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeSuggestionContent.
   */
  async optimizeInventory(
    userId: string,
    ingredients: Ingredient[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.INVENTORY_OPTIMIZATION,
      params: { ingredients },
      conversationId,
    });
  }

  /**
   * Analyse un repas consommé.
   * @param userId ID de l’utilisateur.
   * @param historiqueRepas Repas historique.
   * @param member Membre de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec RecipeAnalysisContent.
   */
  async analyzeMeal(
    userId: string,
    historiqueRepas: HistoriqueRepas,
    member: MembreFamille,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.MEAL_ANALYSIS,
      params: { historiqueRepas, member },
      conversationId,
    });
  }

  /**
   * Analyse les tendances alimentaires de la famille.
   * @param userId ID de l’utilisateur.
   * @param members Membres de la famille.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec FoodTrendsContent.
   */
  async analyzeFoodTrends(
    userId: string,
    members: MembreFamille[],
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.FOOD_TREND_ANALYSIS,
      params: { members },
      conversationId,
    });
  }

  /**
   * Fournit des informations nutritionnelles pour un aliment.
   * @param userId ID de l’utilisateur.
   * @param query Requête nutritionnelle.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec NutritionalInfoContent.
   */
  async getNutritionalInfo(
    userId: string,
    query: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.NUTRITIONAL_INFO,
      params: { query },
      conversationId,
    });
  }

  /**
   * Résout un problème culinaire.
   * @param userId ID de l’utilisateur.
   * @param problem Description du problème.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec TroubleshootProblemContent.
   */
  async troubleshootProblem(
    userId: string,
    problem: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.TROUBLESHOOT_PROBLEM,
      params: { problem },
      conversationId,
    });
  }

  /**
   * Génère des idées créatives pour un contexte.
   * @param userId ID de l’utilisateur.
   * @param context Contexte des idées.
   * @param conversationId ID de la conversation.
   * @returns Interaction AI avec CreativeIdeasContent.
   */
  async getCreativeIdeas(
    userId: string,
    context: string,
    conversationId?: string
  ): Promise<AiInteraction> {
    if (userId !== this.userId) {
      throw new Error('Utilisateur non autorisé.');
    }

    return this.generatePromptResponse({
      promptId: PromptType.CREATIVE_IDEAS,
      params: { context },
      conversationId,
    });
  }
}

