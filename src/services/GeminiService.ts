import { NetworkService } from './NetworkService';
import { GEMINI_API_KEY, GEMINI_API_URL } from '../constants/config';
import {
  Ingredient,
  MembreFamille,
  Menu,
  Recette,
  AiInteraction,
} from '../constants/entities';
import { PREDEFINED_STORES } from '../constants/stores';
import { logger } from '../utils/logger';
import { getErrorMessage, formatDateForFirestore } from '../utils/helpers';


interface FunctionCallResponse {
  type: 'function_call';
  value: { name: string; args: Record<string, any> };
}

type AiResponse = string | object | FunctionCallResponse;

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded string
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
    citationMetadata?: any;
    tokenCount?: number;
    groundingAttributions?: any[];
    groundingMetadata?: any;
    avgLogprobs?: number;
    logprobsResult?: any;
    urlRetrievalMetadata?: any;
    urlContextMetadata?: any;
    index?: number;
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: any[];
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
  responseId?: string;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private modelName: string;

  constructor(model: string = 'gemini-1.5-flash') {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY est manquant. Vérifiez votre fichier .env ou config.ts.');
    }
    this.apiKey = GEMINI_API_KEY;
    this.baseUrl = GEMINI_API_URL;
    this.modelName = model;

    if (!this.baseUrl.includes('generativelanguage.googleapis.com')) {
      logger.warn(`L'URL de l'API Gemini semble incorrecte. Attendu: 'https://generativelanguage.googleapis.com/v1beta', Obtenu: '${this.baseUrl}'`);
    }
  }

  private async checkNetwork(): Promise<void> {
    const isConnected = await NetworkService.isConnected();
    if (!isConnected) {
      const errorMsg = 'Aucune connexion internet disponible.';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private buildGeminiContents(interactions: AiInteraction[]): Content[] {
    return interactions.map(interaction => {
      const parts: Part[] = [];
      if (typeof interaction.content === 'string') {
        parts.push({ text: interaction.content });
      } else if (interaction.content && typeof interaction.content === 'object') {
        if (
          'type' in interaction.content &&
          interaction.content.type === 'image' &&
          'data' in interaction.content &&
          'mimeType' in interaction.content
        ) {
          parts.push({
            inlineData: {
              mimeType: interaction.content.mimeType as string,
              data: interaction.content.data as string,
            },
          });
        } else if ('text' in interaction.content) {
          parts.push({ text: interaction.content.text as string });
        } else if ('functionCall' in interaction.content) {
          parts.push({
            functionCall: interaction.content.functionCall as { name: string; args: Record<string, any> },
          });
        } else if ('functionResponse' in interaction.content) {
          parts.push({
            functionResponse: interaction.content.functionResponse as {
              name: string;
              response: { name: string; content: string | object };
            },
          });
        } else {
          parts.push({ text: JSON.stringify(interaction.content) });
        }
      }
      return { role: interaction.isUser ? 'user' : 'model', parts };
    });
  }

  async generateContent(
    chatHistory: AiInteraction[],
    newMessage: { text?: string; imageUrl?: string; imageMimeType?: string; imageDataBase64?: string },
    options?: {
      systemInstruction?: string;
      generationConfig?: Partial<GenerationConfig>;
      safetySettings?: SafetySetting[];
      tools?: Tool[];
      toolConfig?: ToolConfig;
    }
  ): Promise<AiResponse> {
    await this.checkNetwork();
    logger.info('Envoi d\'une requête à l\'API Gemini', {
      model: this.modelName,
      newMessage,
      chatHistoryLength: chatHistory.length,
    });

    try {
      const currentContents: Content[] = this.buildGeminiContents(chatHistory);
      const newMessageParts: Part[] = [];
      if (newMessage.text) {newMessageParts.push({ text: newMessage.text });}
      if (newMessage.imageUrl && newMessage.imageDataBase64 && newMessage.imageMimeType) {
        newMessageParts.push({
          inlineData: { mimeType: newMessage.imageMimeType, data: newMessage.imageDataBase64 },
        });
      } else if (newMessage.imageUrl && !newMessage.imageDataBase64) {
        logger.warn('Image fournie avec une URL mais sans données base64. L\'image ne sera pas envoyée.');
      }

      currentContents.push({ role: 'user', parts: newMessageParts });

      const requestBody: GenerateContentRequest = {
        contents: currentContents,
        systemInstruction: options?.systemInstruction
          ? { role: 'system', parts: [{ text: options.systemInstruction }] }
          : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          ...options?.generationConfig,
        },
        safetySettings: options?.safetySettings || [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        tools: options?.tools,
        toolConfig: options?.toolConfig,
      };

      const response = await NetworkService.fetchWithRetry(
        `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        logger.error(`Erreur API Gemini (${response.status}) :`, { errorBody, requestBody });
        throw new Error(`Erreur API Gemini : ${errorBody.error?.message || 'Erreur inconnue'}`);
      }

      const data: GenerateContentResponse = await response.json();
      logger.info('Réponse reçue de l\'API Gemini', { responseId: data.responseId, usage: data.usageMetadata });

      if (data.candidates && data.candidates.length > 0) {
        const generatedContent = data.candidates[0].content.parts[0];
        if (generatedContent.text) {
          if (options?.generationConfig?.responseMimeType === 'application/json') {
            try {
              return JSON.parse(generatedContent.text);
            } catch (jsonErr) {
              logger.error('Échec de l\'analyse JSON de la réponse Gemini', {
                text: generatedContent.text,
                error: jsonErr,
              });
              throw new Error('La réponse de l\'IA n\'est pas un JSON valide.');
            }
          }
          return generatedContent.text;
        } else if (generatedContent.functionCall) {
          logger.info('Appel de fonction demandé par Gemini', { functionCall: generatedContent.functionCall });
          return { type: 'function_call', value: generatedContent.functionCall };
        }
        return 'Réponse de l\'IA sans texte clair ou appel de fonction.';
      } else if (data.promptFeedback?.blockReason) {
        const safetyRatings =
          data.promptFeedback.safetyRatings?.map(s => `${s.category}: ${s.probability}`).join(', ') || 'N/A';
        const errorMsg = `Contenu bloqué par les filtres de sécurité de Gemini : ${
          data.promptFeedback.blockReason
        }. Détails : ${safetyRatings}`;
        logger.warn(errorMsg, { promptFeedback: data.promptFeedback });
        throw new Error(errorMsg);
      }
      throw new Error('Aucun contenu généré par l\'API Gemini.');
    } catch (error) {
      logger.error('Échec de la génération de contenu avec Gemini API :', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec de la génération de contenu : ${getErrorMessage(error)}`);
    }
  }

  async streamGenerateContent(
    chatHistory: AiInteraction[],
    newMessage: { text?: string; imageUrl?: string; imageMimeType?: string; imageDataBase64?: string },
    onChunk: (chunk: string | object) => void,
    onComplete: (fullResponse: string | object) => void,
    onError: (error: Error) => void,
    options?: {
      systemInstruction?: string;
      generationConfig?: Partial<GenerationConfig>;
      safetySettings?: SafetySetting[];
      tools?: Tool[];
      toolConfig?: ToolConfig;
    }
  ): Promise<void> {
    await this.checkNetwork();
    logger.info('Envoi d\'une requête de streaming à l\'API Gemini', {
      model: this.modelName,
      newMessage,
      chatHistoryLength: chatHistory.length,
    });

    try {
      const currentContents: Content[] = this.buildGeminiContents(chatHistory);
      const newMessageParts: Part[] = [];
      if (newMessage.text) {newMessageParts.push({ text: newMessage.text });}
      if (newMessage.imageUrl && newMessage.imageDataBase64 && newMessage.imageMimeType) {
        newMessageParts.push({
          inlineData: { mimeType: newMessage.imageMimeType, data: newMessage.imageDataBase64 },
        });
      }
      currentContents.push({ role: 'user', parts: newMessageParts });

      const requestBody: GenerateContentRequest = {
        contents: currentContents,
        systemInstruction: options?.systemInstruction
          ? { role: 'system', parts: [{ text: options.systemInstruction }] }
          : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          ...options?.generationConfig,
        },
        safetySettings: options?.safetySettings || [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        tools: options?.tools,
        toolConfig: options?.toolConfig,
      };

      const response = await fetch(
        `${this.baseUrl}/models/${this.modelName}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMsg = `Erreur API Gemini Stream (${response.status}) : ${
          errorBody.error?.message || 'Erreur inconnue'
        }`;
        logger.error(errorMsg, { errorBody, requestBody });
        onError(new Error(errorMsg));
        return;
      }

      if (!response.body) {
        onError(new Error('Le corps de la réponse en streaming est vide.'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponseText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {break;}

        const chunk = decoder.decode(value, { stream: true });
        try {
          const parsedChunk: GenerateContentResponse = JSON.parse(chunk);
          if (parsedChunk.candidates && parsedChunk.candidates.length > 0) {
            const part = parsedChunk.candidates[0].content.parts[0];
            if (part.text) {
              fullResponseText += part.text;
              onChunk(part.text);
            } else if (part.functionCall) {
              onChunk({ type: 'function_call', value: part.functionCall });
              fullResponseText = JSON.stringify({ type: 'function_call', value: part.functionCall });
              break;
            }
          } else if (parsedChunk.promptFeedback?.blockReason) {
            const safetyRatings =
              parsedChunk.promptFeedback.safetyRatings?.map(s => `${s.category}: ${s.probability}`).join(', ') ||
              'N/A';
            const errorMsg = `Contenu bloqué par les filtres de sécurité : ${
              parsedChunk.promptFeedback.blockReason
            }. Détails : ${safetyRatings}`;
            logger.warn(errorMsg, { promptFeedback: parsedChunk.promptFeedback });
            onError(new Error(errorMsg));
            return;
          }
        } catch (parseError) {
          logger.warn('Échec de l\'analyse d\'un chunk en streaming', { chunk, error: parseError });
        }
      }
      onComplete(fullResponseText);
    } catch (error) {
      logger.error('Échec du streaming avec Gemini API :', { error: getErrorMessage(error) });
      onError(new Error(`Échec du streaming : ${getErrorMessage(error)}`));
    }
  }

  async getMenuSuggestionsFromAI(
    ingredients: Ingredient[],
    familyData: MembreFamille[],
    numDays: number = 3,
    numMealsPerDay: number = 3
  ): Promise<Menu[]> {
    if (!ingredients || !familyData) {
      throw new Error('Les ingrédients et les données de la famille sont requis pour générer des suggestions de menus.');
    }

    const familyDetails = familyData
      .map(
        m =>
          `${m.nom} (${m.role}) : Préférences=${m.preferencesAlimentaires.join(', ')}, Allergies=${m.allergies.join(
            ', '
          )}, Restrictions=${m.restrictionsMedicales.join(', ')}, Niveau d'épices=${m.aiPreferences.niveauEpices}, Apport calorique=${
            m.aiPreferences.apportCaloriqueCible
          } kcal, Cuisines préférées=${m.aiPreferences.cuisinesPreferees.join(', ')}`
      )
      .join('\n');

    const ingredientsList = ingredients.map(i => `${i.nom} (${i.quantite} ${i.unite})`).join(', ');

    const prompt = `
      Vous êtes un assistant culinaire expert spécialisé dans la planification de repas pour les familles. 
      Créez un plan de repas sur ${numDays} jours adapté aux membres de la famille et aux ingrédients disponibles. 
      Chaque jour doit inclure ${numMealsPerDay} repas (par exemple : petit-déjeuner, déjeuner, dîner). 
      Pour chaque repas, proposez une recette spécifique en utilisant les ingrédients disponibles. 
      Prenez en compte toutes les restrictions alimentaires, préférences, allergies et niveaux d'épices de chaque membre. 
      Visez un régime équilibré avec une variété de repas sur les jours. 
      Si des ingrédients manquent pour une recette, listez-les sous 'ingredientsManquants' pour ce menu.

      Détails des membres de la famille :
      ${familyDetails}

      Ingrédients disponibles :
      ${ingredientsList}

      Répondez exclusivement au format JSON sous forme de tableau d'objets 'Menu'. 
      Assurez-vous que les champs 'dateCreation' et 'dateMiseAJour' contiennent des horodatages ISO 8601 actuels. 
      Incluez les détails complets des recettes, pas seulement leurs identifiants.
      Structure attendue (tableau d'objets Menu) :
      [
        {
          "date": "YYYY-MM-DD",
          "typeRepas": "Petit-déjeuner",
          "recettes": [
            {
              "nom": "Omelette aux légumes",
              "ingredients": [{"nom": "Œufs", "quantite": 2, "unite": "unité"}, ...],
              "instructions": "Étape 1 : Battre les œufs...",
              "tempsPreparation": 15,
              "portions": 4,
              "categorie": "Petit-déjeuner",
              "difficulte": "facile",
              "aiAnalysis": {
                "caloriesTotales": 350,
                "niveauEpices": 1,
                "adequationMembres": {"membreId1": "adapté", "membreId2": "adapté"}
              }
            }
          ],
          "foodName": "Omelette aux légumes",
          "statut": "planifié",
          "notes": "Riche en protéines.",
          "aiSuggestions": {
            "recettesAlternatives": [],
            "ingredientsManquants": []
          }
        },
        // ... (autres jours et repas)
      ]
      Générez le plan pour les ${numDays} prochains jours à partir d'aujourd'hui.
    `;

    try {
      const systemInstruction =
        'Vous êtes un expert culinaire IA. Votre tâche est de générer des plans de repas personnalisés et structurés au format JSON, en respectant strictement les besoins alimentaires de la famille.';
      const generatedContent = (await this.generateContent(
        [],
        { text: prompt },
        {
          systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.6,
            maxOutputTokens: 3000,
          },
        }
      )) as object[];

      const menus: Menu[] = (generatedContent as any[]).map(item => ({
        ...item,
        id: `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
      }));

      menus.forEach(menu => {
        if (!menu.id) {menu.id = `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`;}
        if (!menu.dateCreation) {menu.dateCreation = formatDateForFirestore(new Date());}
        if (!menu.dateMiseAJour) {menu.dateMiseAJour = formatDateForFirestore(new Date());}
        menu.recettes.forEach((rec: Recette) => {
          if (!rec.id) {rec.id = `recette_${Date.now()}_${Math.random().toString(36).substring(7)}`;}
          if (!rec.dateCreation) {rec.dateCreation = formatDateForFirestore(new Date());}
          if (!rec.dateMiseAJour) {rec.dateMiseAJour = formatDateForFirestore(new Date());}
        });
      });

      logger.info('Suggestions de menus générées par l\'IA', { count: menus.length });
      return menus;
    } catch (error) {
      logger.error('Erreur lors de la génération des suggestions de menus', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec de la génération des suggestions de menus : ${getErrorMessage(error)}`);
    }
  }

  async generateShoppingListFromAI(
    menu: Menu,
    currentIngredients: Ingredient[]
  ): Promise<{ nom: string; quantite: number; unite: string; magasinSuggeré?: string }[]> {
    if (!menu || !currentIngredients) {
      throw new Error('Le menu et les ingrédients actuels sont requis pour générer une liste de courses.');
    }

    const menuDetails = JSON.stringify(menu, null, 2);
    const existingIngredients = currentIngredients.map(i => `${i.nom} (${i.quantite} ${i.unite})`).join(', ') || 'Aucun';

    const prompt = `
      Basé sur le plan de repas suivant et les ingrédients actuellement disponibles, 
      générez une liste de courses détaillée incluant uniquement les ingrédients manquants. 
      Pour chaque article, spécifiez son 'nom', 'quantite' (quantité nécessaire), 'unite', 
      et, si possible, un 'magasinSuggeré' (ex. : supermarché, boulangerie, boucherie). 
      Répondez exclusivement au format JSON sous forme de tableau d'objets :
      [
        {"nom": "Lait", "quantite": 1, "unite": "litre", "magasinSuggeré": "supermarché"},
        {"nom": "Farine", "quantite": 500, "unite": "gramme", "magasinSuggeré": "supermarché"},
        // ...
      ]

      Plan de repas :
      ${menuDetails}

      Ingrédients actuels :
      ${existingIngredients}
    `;

    try {
      const systemInstruction =
        'Vous êtes un assistant précis pour la gestion des stocks et la création de listes de courses. Votre réponse doit être un tableau JSON valide d\'ingrédients manquants.';
      const generatedContent = (await this.generateContent(
        [],
        { text: prompt },
        {
          systemInstruction,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }
      )) as { nom: string; quantite: number; unite: string; magasinSuggeré?: string }[];

      logger.info('Liste de courses générée par l\'IA', { menuId: menu.id, itemCount: generatedContent.length });
      return generatedContent;
    } catch (error) {
      logger.error('Erreur lors de la génération de la liste de courses', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec de la génération de la liste de courses : ${getErrorMessage(error)}`);
    }
  }

  async analyzeRecipeWithAI(
    recipe: Recette,
    familyData: MembreFamille[]
  ): Promise<{ calories: number; spicesLevel: number; suitability: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' } }> {
    if (!recipe || !familyData) {
      throw new Error('La recette et les données de la famille sont requises pour l\'analyse.');
    }

    const recipeDetails = JSON.stringify(recipe, null, 2);
    const familyDetails = familyData
      .map(
        m =>
          `${m.nom} (${m.role}) : Préférences=${m.preferencesAlimentaires.join(', ')}, Allergies=${m.allergies.join(
            ', '
          )}, Restrictions=${m.restrictionsMedicales.join(', ')}`
      )
      .join('\n');

    const prompt = `
      Analysez la recette suivante pour déterminer sa teneur totale en calories, son niveau d'épices (sur une échelle de 1 à 5, où 1 est doux et 5 est très épicé), 
      et son adéquation pour chaque membre de la famille en fonction de leurs besoins et préférences alimentaires. 
      Si une recette est 'modifié', précisez pourquoi (ex. : "adapté avec substitution de lactose"). 
      Répondez exclusivement au format JSON :
      {
        "calories": 500,
        "spicesLevel": 3,
        "suitability": {
          "membreId1": "adapté",
          "membreId2": "non adapté",
          "membreId3": "modifié: sans gluten"
        }
      }

      Recette à analyser :
      ${recipeDetails}

      Membres de la famille pour l'évaluation de l'adéquation :
      ${familyDetails}
    `;

    try {
      const systemInstruction =
        'Vous êtes un expert en analyse alimentaire. Fournissez des évaluations nutritionnelles et d\'adéquation précises au format JSON.';
      const generatedContent = (await this.generateContent(
        [],
        { text: prompt },
        {
          systemInstruction,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }
      )) as { calories: number; spicesLevel: number; suitability: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' } };

      logger.info('Recette analysée par l\'IA', { recipeId: recipe.id, analysis: generatedContent });
      return generatedContent;
    } catch (error) {
      logger.error('Erreur lors de l\'analyse de la recette', { error: getErrorMessage(error) });
      throw new Error(`Échec de l'analyse de la recette : ${getErrorMessage(error)}`);
    }
  }

  async generateRecipeSuggestionsFromAI(
    ingredients: Ingredient[],
    preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string }
  ): Promise<Recette[]> {
    if (!ingredients || !preferences) {
      throw new Error('Les ingrédients et les préférences sont requis pour générer des suggestions de recettes.');
    }

    const ingredientsList = ingredients.map(i => `${i.nom} (${i.quantite} ${i.unite})`).join(', ');

    const prompt = `
      Proposez 3 suggestions de recettes uniques basées sur les ingrédients disponibles et les préférences de l'utilisateur. 
      Privilégiez les recettes réalisables avec les ingrédients listés. 
      Si une recette nécessite un ingrédient manquant, mentionnez-le clairement dans la description ou les notes. 
      Assurez-vous que les recettes correspondent au niveau d'épices et aux cuisines préférées spécifiés. 
      Si un 'typeRepas' est fourni, concentrez-vous sur des recettes adaptées à ce type de repas.

      Ingrédients disponibles :
      ${ingredientsList}

      Préférences :
      - Niveau d'épices : ${preferences.niveauEpices} (1 = doux, 5 = très épicé)
      - Cuisines préférées : ${preferences.cuisinesPreferees.join(', ')}
      ${preferences.mealType ? `- Type de repas : ${preferences.mealType}` : ''}

      Répondez exclusivement au format JSON sous forme de tableau d'objets 'Recette'. 
      Assurez-vous que les champs 'dateCreation' et 'dateMiseAJour' contiennent des horodatages ISO 8601 actuels. 
      Incluez tous les détails pour chaque recette, conformément à l'interface 'Recette'.
      Structure attendue (tableau d'objets Recette) :
      [
        {
          "nom": "Poulet au curry",
          "ingredients": [{"nom": "Poulet", "quantite": 500, "unite": "gramme"}, ...],
          "instructions": "Étape 1 : Faire revenir le poulet...",
          "tempsPreparation": 30,
          "portions": 4,
          "categorie": "Plat principal",
          "difficulte": "moyen",
          "aiAnalysis": {
            "caloriesTotales": 600,
            "niveauEpices": 3,
            "adequationMembres": {}
          }
        },
        // ... (autres recettes)
      ]
    `;

    try {
      const systemInstruction =
        'Vous êtes une IA créative spécialisée dans la génération de recettes. Proposez des recettes variées et appétissantes au format JSON strict.';
      const generatedContent = (await this.generateContent(
        [],
        { text: prompt },
        {
          systemInstruction,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7, candidateCount: 3, maxOutputTokens: 2000 },
        }
      )) as object[];

     const recipes: Recette[] = (generatedContent as any[]).map(item => ({
        ...item,
        id: `recette_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
      }));


      recipes.forEach(recipe => {
        if (!recipe.id) {recipe.id = `recette_${Date.now()}_${Math.random().toString(36).substring(7)}`;}
        if (!recipe.dateCreation) {recipe.dateCreation = formatDateForFirestore(new Date());}
        if (!recipe.dateMiseAJour) {recipe.dateMiseAJour = formatDateForFirestore(new Date());}
      });

      logger.info('Suggestions de recettes générées par l\'IA', { count: recipes.length });
      return recipes;
    } catch (error) {
      logger.error('Erreur lors de la génération des suggestions de recettes', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec de la génération des suggestions de recettes : ${getErrorMessage(error)}`);
    }
  }

  /**
   * Calcule la distance entre deux points géographiques (en kilomètres) en utilisant la formule de Haversine.
   * @param lat1 Latitude du point 1
   * @param lon1 Longitude du point 1
   * @param lat2 Latitude du point 2
   * @param lon2 Longitude du point 2
   * @returns Distance en kilomètres
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371; // Rayon de la Terre en kilomètres

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Vérifie si un magasin est ouvert à la date et l'heure actuelles.
   * @param store Le magasin à vérifier
   * @returns true si le magasin est ouvert, false sinon
   */
  private isStoreOpen(store: typeof PREDEFINED_STORES[0]): boolean {
    const now = new Date();
    const day = now.toLocaleString('fr-FR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase()); // Ex: "Vendredi"
    const currentTime = now.toTimeString().slice(0, 5); // Ex: "16:32"

    const todaySchedule = store.horaires?.find(h => h.jour === day);
    if (!todaySchedule || todaySchedule.ouverture === 'fermé') {
      return false;
    }

    return currentTime >= todaySchedule.ouverture && currentTime <= todaySchedule.fermeture;
  }

  async checkIngredientAvailability(
    ingredientName: string,
    location: { latitude: number; longitude: number }
  ): Promise<{ message: string; rawToolResponse: Array<any> }> {
    if (!ingredientName) {
      throw new Error('Le nom de l\'ingrédient est requis.');
    }
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error('Les coordonnées de localisation doivent être des nombres valides.');
    }

    const prompt = `Vérifiez la disponibilité de l'ingrédient "${ingredientName}" dans les magasins proches des coordonnées latitude ${location.latitude}, longitude ${location.longitude}.`;

    const tools: Tool[] = [
      {
        functionDeclarations: [
          {
            name: 'findStoresWithIngredient',
            description: 'Trouve les magasins à proximité qui ont un ingrédient en stock.',
            parameters: {
              type: 'object',
              properties: {
                ingredient: { type: 'string', description: 'Nom de l\'ingrédient à rechercher.' },
                latitude: { type: 'number', description: "Latitude de la position actuelle de l'utilisateur." },
                longitude: { type: 'number', description: "Longitude de la position actuelle de l'utilisateur." },
              },
              required: ['ingredient', 'latitude', 'longitude'],
            },
          },
        ],
      },
    ];

    try {
      const systemInstruction =
        'Vous êtes un assistant intelligent capable de vérifier la disponibilité des ingrédients dans les magasins proches. Vous avez accès à un outil appelé \'findStoresWithIngredient\'.';
      const response = (await this.generateContent(
        [],
        { text: prompt },
        {
          systemInstruction,
          tools,
          toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
          generationConfig: { temperature: 0.1 },
        }
      )) as AiResponse;

      if (typeof response === 'object' && 'type' in response && response.type === 'function_call') {
        const functionCall = (response as FunctionCallResponse).value;
        logger.info('Appel de fonction demandé par Gemini :', functionCall);

        if (functionCall.name === 'findStoresWithIngredient') {
          const { ingredient, latitude, longitude } = functionCall.args;

          const storesWithIngredient: Array<{
            name: string;
            distance: string;
            inStock: boolean;
            price?: number;
            stock?: number;
            address: string;
            isOpen: boolean;
            contact?: { telephone?: string; email?: string; siteWeb?: string };
          }> = [];

          for (const store of PREDEFINED_STORES) {
            if (store.localisation?.latitude === 0 && store.localisation?.longitude === 0) {
              continue;
            }

            const distance = this.calculateDistance(
              latitude,
              longitude,
              store.localisation?.latitude || 0,
              store.localisation?.longitude || 0
            ).toFixed(2);

            const isOpen = this.isStoreOpen(store);

            const matchingItem = store.articles.find(
              item => item.nom.toLowerCase().includes(ingredient.toLowerCase()) && item.stockDisponible > 0
            );

            storesWithIngredient.push({
              name: store.nom,
              distance: `${distance} km`,
              inStock: !!matchingItem,
              price: matchingItem ? matchingItem.prixUnitaire : undefined,
              stock: matchingItem ? matchingItem.stockDisponible : undefined,
              address: store.localisation?.adresse || 'Adresse non disponible',
              isOpen,
              contact: store.contact,
            });
          }

          storesWithIngredient.sort((a, b) => {
            if (a.inStock !== b.inStock) {return a.inStock ? -1 : 1;}
            return parseFloat(a.distance) - parseFloat(b.distance);
          });

          if (storesWithIngredient.length === 0) {
            throw new Error('Aucun magasin trouvé à proximité pour cet ingrédient.');
          }

          const toolResponse = `Ingrédient : ${ingredient}. Magasins trouvés : ${JSON.stringify(storesWithIngredient)}.`;

          const functionResponseContent: AiInteraction[] = [
            {
              content: prompt,
              isUser: true,
              timestamp: formatDateForFirestore(new Date()),
              type: 'text',
            },
            {
              content: { functionCall },
              isUser: false,
              timestamp: formatDateForFirestore(new Date()),
              type: 'tool_use',
            },
            {
              content: {
                functionResponse: {
                  name: functionCall.name,
                  response: { name: functionCall.name, content: toolResponse },
                },
              },
              isUser: false,
              timestamp: formatDateForFirestore(new Date()),
              type: 'tool_response',
            },
          ];

          const finalResponse = await this.generateContent(
            functionResponseContent.slice(0, -1),
            { text: JSON.stringify(toolResponse) },
            { systemInstruction, tools, toolConfig: { functionCallingConfig: { mode: 'NONE' } } }
          );

          return {
            message: typeof finalResponse === 'string' ? finalResponse : JSON.stringify(finalResponse),
            rawToolResponse: storesWithIngredient,
          };
        }
      }
      return {
        message: typeof response === 'string' ? response : JSON.stringify(response),
        rawToolResponse: [],
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification de la disponibilité des ingrédients', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec de la vérification de la disponibilité : ${getErrorMessage(error)}`);
    }
  }

  async askGeneralQuestion(
    message: string,
    imageDataBase64?: string,
    imageMimeType?: string,
    chatHistory: AiInteraction[] = [],
    systemInstruction?: string
  ): Promise<string> {
    if (!message) {
      throw new Error('Le message est requis pour poser une question générale.');
    }

    try {
      const response = await this.generateContent(
        chatHistory,
        { text: message, imageDataBase64, imageMimeType },
        {
          systemInstruction:
            systemInstruction || 'Vous êtes un assistant familial amical et informatif. Répondez avec clarté et bienveillance.',
        }
      );
      if (typeof response === 'string') {return response;}
      if (typeof response === 'object' && 'message' in response && typeof response.message === 'string')
        {return response.message;}
      throw new Error('Réponse inattendue ou non textuelle de l\'IA.');
    } catch (error) {
      logger.error('Erreur lors de la question générale à l\'IA', { error: getErrorMessage(error) });
      throw new Error(`Échec de la question à l'IA : ${getErrorMessage(error)}`);
    }
  }

  async getNutritionalInfo(query: string): Promise<object> {
    if (!query) {
      throw new Error('La requête est requise pour obtenir des informations nutritionnelles.');
    }

    const prompt = `Fournissez des informations nutritionnelles détaillées (calories, protéines, glucides, lipides, fibres) pour "${query}". Répondez au format JSON.`;
    try {
      const systemInstruction =
        'Vous êtes un expert en nutrition. Fournissez des données nutritionnelles précises au format JSON.';
      const response = await this.generateContent(
        [],
        { text: prompt },
        { systemInstruction, generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }
      );
      if (typeof response === 'object') {return response;}
      throw new Error('Réponse nutritionnelle non structurée de l\'IA.');
    } catch (error) {
      logger.error('Erreur lors de l\'obtention des informations nutritionnelles', {
        error: getErrorMessage(error),
      });
      throw new Error(`Échec des informations nutritionnelles : ${getErrorMessage(error)}`);
    }
  }

  async troubleshootProblem(problem: string): Promise<string> {
    if (!problem) {
      throw new Error('Le problème est requis pour le dépannage.');
    }

    const prompt = `Aidez-moi à résoudre le problème suivant : "${problem}". Proposez une solution claire et concise, avec des étapes si nécessaire.`;
    try {
      const systemInstruction = 'Vous êtes un expert en résolution de problèmes culinaires et domestiques.';
      const response = await this.generateContent(
        [],
        { text: prompt },
        { systemInstruction, generationConfig: { temperature: 0.5 } }
      );
      if (typeof response === 'string') {return response;}
      throw new Error('Réponse de dépannage inattendue de l\'IA.');
    } catch (error) {
      logger.error('Erreur lors du dépannage avec l\'IA', { error: getErrorMessage(error) });
      throw new Error(`Échec du dépannage : ${getErrorMessage(error)}`);
    }
  }

  async getCreativeIdeas(context: string): Promise<string[]> {
    if (!context) {
      throw new Error('Le contexte est requis pour générer des idées créatives.');
    }

    const prompt = `Générez 5 idées créatives basées sur le contexte suivant : "${context}". Présentez-les sous forme de liste numérotée claire et inspirante.`;
    try {
      const systemInstruction = 'Vous êtes une source d\'idées créatives et utiles pour la cuisine et la maison.';
      const response = await this.generateContent(
        [],
        { text: prompt },
        { systemInstruction, generationConfig: { temperature: 0.9, candidateCount: 1 } }
      );
      if (typeof response === 'string') {return response.split('\n').filter(line => line.trim().length > 0);}
      throw new Error('Réponse créative inattendue de l\'IA.');
    } catch (error) {
      logger.error('Erreur lors de l\'obtention des idées créatives', { error: getErrorMessage(error) });
      throw new Error(`Échec des idées créatives : ${getErrorMessage(error)}`);
    }
  }
}
