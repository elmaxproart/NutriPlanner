
import { useState, useEffect, useCallback, useMemo } from 'react';
import { GeminiService } from '../services/GeminiService';
import { FirestoreService } from '../services/FirestoreService';
import {
  AiInteraction,
  Conversation,
  Ingredient,
  MembreFamille,
  Menu,
  Recette,
} from '../constants/entities';
import { logger } from '../utils/logger';
import { formatDateForFirestore, getErrorMessage } from '../utils/helpers';
import { useAuth } from './useAuth'; // <-- Import useAuth hook

interface UseAIConversationProps {
  // userId is now fetched internally, so it's removed from props
  familyId: string;
  initialConversationId?: string;
  defaultModel?: string;
}

export interface GeminiApiCallResult {
  message?: string;
  rawToolResponse?: any;
  error?: string;
}

interface UseAIConversationResult {
  currentConversation: Conversation | null;
  messages: AiInteraction[];
  conversations: Conversation[];
  loading: boolean; // This loading should indicate if the hook itself is performing an operation
  error: string | null;
  isReady: boolean; // New state to indicate if the hook is fully initialized with user data
  sendMessage: (
    message: string,
    systemInstruction?: string,
    imageData?: { uri: string; mimeType: string; base64: string }
  ) => Promise<void>;
  streamMessage: (
    message: string,
    onChunk: (chunk: string | object) => void,
    onComplete: (fullResponse: string | object) => void,
    systemInstruction?: string,
    imageData?: { uri: string; mimeType: string; base64: string }
  ) => Promise<void>;
  createNewConversation: (title?: string) => Promise<string>;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearCurrentConversation: () => void;
  getMenuSuggestions: (
    ingredients: Ingredient[],
    familyData: MembreFamille[],
    numDays?: number,
    numMealsPerDay?: number
  ) => Promise<Menu[]>;
  generateShoppingList: (
    menu: Menu,
    currentIngredients: Ingredient[]
  ) => Promise<{ nom: string; quantite: number; unite: string; magasinSuggeré?: string }[]>;
  analyzeRecipe: (
    recipe: Recette,
    familyData: MembreFamille[]
  ) => Promise<{ calories: number; spicesLevel: number; suitability: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' } }>;
  generateRecipeSuggestions: (
    ingredients: Ingredient[],
    preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string }
  ) => Promise<Recette[]>;
  checkIngredientAvailability: (
    ingredientName: string,
    location: { latitude: number; longitude: number }
  ) => Promise<GeminiApiCallResult>;
  getNutritionalInfo: (query: string) => Promise<object>;
  troubleshootProblem: (problem: string) => Promise<string>;
  getCreativeIdeas: (context: string) => Promise<string[]>;
}

export const useAIConversation = ({
  familyId, // userId is now fetched internally, so it's removed from props
  initialConversationId,
  defaultModel = 'gemini-1.5-flash',
}: UseAIConversationProps): UseAIConversationResult => {
  const { userId, loading: authLoading } = useAuth(); // <-- Get userId and its loading status

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<AiInteraction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false); // For operations *within* the hook (e.g., sending message)
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // Tracks if Firebase/Gemini services are initialized

  // Memoize services only when userId and familyId are available
  const firestoreService = useMemo(() => {
    if (userId && familyId) {
      return new FirestoreService(userId, familyId);
    }
    return null; // Return null if not ready
  }, [userId, familyId]);

  const geminiService = useMemo(() => {
    // GeminiService doesn't strictly need familyId for initialization, but userId is good.
    // However, if tools used by GeminiService rely on user/family context, pass them.
    if (userId) {
      return new GeminiService(defaultModel);
    }
    return null;
  }, [userId, defaultModel]);

  // Effect to manage the 'isReady' state and initial data fetch (conversations)
  useEffect(() => {
    // If auth is still loading, the hook is not ready.
    // If auth is done but userId is null, the hook is not ready and there's an error.
    if (authLoading) {
      setIsReady(false);
      setLoading(true); // Indicate overall loading due to auth
      setError(null);
      return;
    }

    if (!userId || !familyId) {
      setIsReady(false);
      setLoading(false); // No longer loading auth, but not ready
      setError('Utilisateur non authentifié ou ID famille manquant.');
      // Clear data as services cannot be initialized
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
      return;
    }

    // If we reach here, userId and familyId are available, and authLoading is false.
    // Initialize services and listeners.
    setIsReady(true);
    setLoading(false); // Services are ready, no internal operations currently.

    // Listener for all user conversations (only runs when firestoreService is available)
    if (firestoreService) {
      const unsubscribeConversations = firestoreService.listenToConversations(
        (data) => {
          setConversations(data);
          // Auto-select initial conversation or most recent if none selected
          if (initialConversationId && !currentConversation) {
            const found = data.find((conv) => conv.id === initialConversationId);
            if (found) {
              setCurrentConversation(found);
            }
          } else if (!currentConversation && data.length > 0) {
            const mostRecent = data[0]; // Or your preferred default selection
            setCurrentConversation(mostRecent);
          }
        },
        (err) => {
          const errorMsg = getErrorMessage(err);
          logger.error('Erreur lors de l\'écoute des conversations :', errorMsg as String);
          setError(errorMsg);
        }
      );
      return () => unsubscribeConversations(); // Cleanup listener
    }
    // No return here if firestoreService is null, as the outer condition handles it.
  }, [authLoading, userId, familyId, firestoreService, initialConversationId, currentConversation]);


  // Listener for messages of the selected conversation (only runs when firestoreService is available)
  useEffect(() => {
    if (!currentConversation?.id || !firestoreService || !isReady) {
      setMessages([]);
      return;
    }

    const unsubscribeMessages = firestoreService.listenToAiInteractionsForConversation(
      currentConversation.id,
      (data) => {
        setMessages(data);
      },
      (err) => {
        const errorMsg = getErrorMessage(err);
        logger.error(
          `Erreur lors de l'écoute des interactions AI pour la conversation ${currentConversation.id} :`,
          errorMsg as String
        );
        setError(errorMsg);
      }
    );

    return () => unsubscribeMessages(); // Cleanup listener
  }, [currentConversation?.id, firestoreService, isReady]);


  // Helper function to check if services are available before executing
  const ensureServicesReady = useCallback(() => {
    if (!isReady || !firestoreService || !geminiService || !userId || !familyId) {
      const msg = 'Le service de conversation IA n\'est pas prêt (authentification, service ou ID manquant).';
      setError(msg);
      logger.error(msg);
      return false;
    }
    return true;
  }, [isReady, firestoreService, geminiService, userId, familyId]);


  const sendMessage = useCallback(
    async (
      message: string,
      systemInstruction?: string,
      imageData?: { uri: string; mimeType: string; base64: string }
    ) => {
      if (!ensureServicesReady() || !currentConversation?.id) {
        // Error already set by ensureServicesReady or specific currentConversation error
        return;
      }

      if (!message && !imageData) {
        const errorMsg = 'Un message ou une image est requis pour envoyer une requête.';
        setError(errorMsg);
        logger.error(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      const userInteraction: AiInteraction = {
        content: imageData
          ? { type: 'image', uri: imageData.uri, mimeType: imageData.mimeType, data: imageData.base64 }
          : message,
        isUser: true,
        timestamp: formatDateForFirestore(new Date()),
        type: imageData ? 'image' : 'text',
        conversationId: currentConversation.id,
      };

      // Add a temporary message for immediate UI feedback
      const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setMessages((prev) => [...prev, { ...userInteraction, id: tempMessageId }]);

      try {
        const userMessageId = await firestoreService!.addAiInteractionToConversation( // Use ! as we checked ensureServicesReady
          currentConversation.id,
          userInteraction
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessageId ? { ...msg, id: userMessageId } : msg))
        );

        const geminiResponse = await geminiService!.generateContent( // Use !
          messages,
          {
            text: message,
            imageUrl: imageData?.uri,
            imageDataBase64: imageData?.base64,
            imageMimeType: imageData?.mimeType,
          },
          { systemInstruction }
        );

        let aiContent: string | object = '';
        let aiType: AiInteraction['type'] = 'text';

        if (typeof geminiResponse === 'string') {
          aiContent = geminiResponse;
          aiType = 'text';
        } else if (typeof geminiResponse === 'object') {
          if ('type' in geminiResponse && geminiResponse.type === 'function_call') {
            aiContent = geminiResponse;
            aiType = 'tool_use';

            // Example of handling a function call response within the hook
            if ('value' in geminiResponse && typeof geminiResponse.value === 'object') {
              const functionCall = geminiResponse.value as { name: string; args: Record<string, any> };
              if (functionCall.name === 'findStoresWithIngredient') {
                const { ingredient, latitude, longitude } = functionCall.args;
                const availabilityResult = await geminiService!.checkIngredientAvailability(ingredient, {
                  latitude,
                  longitude,
                });
                aiContent = {
                  functionResponse: {
                    name: functionCall.name,
                    response: { name: functionCall.name, content: availabilityResult },
                  },
                };
                aiType = 'tool_response';
              }
            }
          } else {
            aiContent = geminiResponse;
            aiType = 'json';
          }
        }

        const aiInteraction: AiInteraction = {
          content: aiContent,
          isUser: false,
          timestamp: formatDateForFirestore(new Date()),
          type: aiType,
          conversationId: currentConversation.id,
        };

        await firestoreService!.addAiInteractionToConversation(currentConversation.id, aiInteraction);
        await firestoreService!.updateConversation(currentConversation.id, {
          date: formatDateForFirestore(new Date()),
        });
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans sendMessage :', errorMsg as String);
        setError(errorMsg);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId)); // Remove temp message on error
        throw err; // Re-throw to allow component to catch if needed
      } finally {
        setLoading(false);
      }
    },
    [currentConversation, messages, ensureServicesReady, firestoreService, geminiService]
  );

  const streamMessage = useCallback(
    async (
      message: string,
      onChunk: (chunk: string | object) => void,
      onComplete: (fullResponse: string | object) => void,
      systemInstruction?: string,
      imageData?: { uri: string; mimeType: string; base64: string }
    ) => {
      if (!ensureServicesReady() || !currentConversation?.id) {
        onComplete(''); // Call onComplete even if not ready
        return;
      }

      if (!message && !imageData) {
        const errorMsg = 'Un message ou une image est requis pour envoyer une requête en streaming.';
        setError(errorMsg);
        logger.error(errorMsg);
        onComplete('');
        return;
      }

      setLoading(true);
      setError(null);

      const userInteraction: AiInteraction = {
        content: imageData
          ? { type: 'image', uri: imageData.uri, mimeType: imageData.mimeType, data: imageData.base64 }
          : message,
        isUser: true,
        timestamp: formatDateForFirestore(new Date()),
        type: imageData ? 'image' : 'text',
        conversationId: currentConversation.id,
      };

      const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setMessages((prev) => [...prev, { ...userInteraction, id: tempMessageId }]);

      try {
        const userMessageId = await firestoreService!.addAiInteractionToConversation(
          currentConversation.id,
          userInteraction
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessageId ? { ...msg, id: userMessageId } : msg))
        );

        let accumulatedResponse: string | object = '';
        const onStreamChunkCallback = (chunk: string | object) => {
          if (typeof chunk === 'string') {
            if (typeof accumulatedResponse === 'string') {
              accumulatedResponse += chunk;
            } else {
              accumulatedResponse = chunk;
            }
          } else {
            accumulatedResponse = chunk; // If it's an object, it replaces previous
          }
          onChunk(chunk); // Pass chunk to external callback
        };

        await geminiService!.streamGenerateContent(
          messages, // Pass current messages for context
          {
            text: message,
            imageUrl: imageData?.uri,
            imageDataBase64: imageData?.base64,
            imageMimeType: imageData?.mimeType,
          },
          onStreamChunkCallback, // Internal chunk handler
          (fullResponseFromService) => { // This callback is from GeminiService when stream completes
            accumulatedResponse = fullResponseFromService;
          },
          (streamErr) => { // Error handler for the stream
            const errorMsg = getErrorMessage(streamErr);
            logger.error('Erreur lors du streaming :', errorMsg as String);
            setError(errorMsg);
            onComplete(''); // Signal completion with empty on error
          },
          { systemInstruction }
        );

        const aiInteraction: AiInteraction = {
          content: accumulatedResponse,
          isUser: false,
          timestamp: formatDateForFirestore(new Date()),
          type: typeof accumulatedResponse === 'string' ? 'text' : 'json',
          conversationId: currentConversation.id,
        };
        await firestoreService!.addAiInteractionToConversation(currentConversation.id, aiInteraction);

        await firestoreService!.updateConversation(currentConversation.id, {
          date: formatDateForFirestore(new Date()),
        });

        onComplete(accumulatedResponse); // Signal completion with full response
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans streamMessage :', errorMsg as String);
        setError(errorMsg);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId)); // Remove temp message on error
        onComplete(''); // Signal completion with empty on error
      } finally {
        setLoading(false);
      }
    },
    [currentConversation, messages, ensureServicesReady, firestoreService, geminiService]
  );

  const createNewConversation = useCallback(
    async (title: string = 'Nouvelle conversation AI') => {
      if (!ensureServicesReady() || !userId) { // userId already checked by ensureServicesReady
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt ou ID utilisateur manquant.');
      }

      setLoading(true);
      setError(null);
      try {
        const newConversation: Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages'> = {
          userId,
          familyId,
          date: formatDateForFirestore(new Date()),
          title,
        };
        const newConversationId = await firestoreService!.addConversation(newConversation);
        const createdConv = { ...newConversation, id: newConversationId, messages: [] };
        setCurrentConversation(createdConv);
        setConversations((prev) => [createdConv, ...prev]);
        setMessages([]);
        logger.info('Nouvelle conversation créée', { id: newConversationId });
        return newConversationId;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Échec de la création d\'une nouvelle conversation', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId, familyId, ensureServicesReady, error] // Add error to dependencies for the throw
  );

  const selectConversation = useCallback(
    (conversationId: string) => {
      const selected = conversations.find((conv) => conv.id === conversationId);
      if (selected) {
        setCurrentConversation(selected);
        logger.info('Conversation sélectionnée', { id: conversationId });
        setError(null);
      } else {
        const errorMsg = 'Conversation non trouvée.';
        setError(errorMsg);
        logger.error(errorMsg);
      }
    },
    [conversations]
  );

  // Define clearCurrentConversation BEFORE deleteConversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    logger.info('Conversation actuelle vidée.');
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        await firestoreService!.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          clearCurrentConversation(); // Now clearCurrentConversation is defined
        }
        logger.info('Conversation supprimée', { id: conversationId });
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Échec de la suppression de la conversation', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, currentConversation, clearCurrentConversation, ensureServicesReady, error]
  );

  const getMenuSuggestions = useCallback(
    async (ingredients: Ingredient[], familyData: MembreFamille[], numDays = 3, numMealsPerDay = 3) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const menus = await geminiService!.getMenuSuggestionsFromAI(ingredients, familyData, numDays, numMealsPerDay);
        logger.info('Suggestions de menus générées par l\'IA', { count: menus.length });
        return menus;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getMenuSuggestions (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const generateShoppingList = useCallback(
    async (menu: Menu, currentIngredients: Ingredient[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const list = await geminiService!.generateShoppingListFromAI(menu, currentIngredients);
        logger.info('Liste de courses générée par l\'IA', { menuId: menu.id, itemCount: list.length });
        return list;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateShoppingList (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const analyzeRecipe = useCallback(
    async (recipe: Recette, familyData: MembreFamille[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const analysis = await geminiService!.analyzeRecipeWithAI(recipe, familyData);
        logger.info('Recette analysée par l\'IA', { recipeId: recipe.id, analysis });
        return analysis;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans analyzeRecipe (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const generateRecipeSuggestions = useCallback(
    async (ingredients: Ingredient[], preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string }) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const recipes = await geminiService!.generateRecipeSuggestionsFromAI(ingredients, preferences);
        logger.info('Suggestions de recettes générées par l\'IA', { count: recipes.length });
        return recipes;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateRecipeSuggestions (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const checkIngredientAvailability = useCallback(
    async (ingredientName: string, location: { latitude: number; longitude: number }) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const result = await geminiService!.checkIngredientAvailability(ingredientName, location);
        logger.info('Disponibilité de l\'ingrédient vérifiée par l\'IA', { ingredientName, result });
        return result;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans checkIngredientAvailability (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const getNutritionalInfo = useCallback(
    async (query: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const info = await geminiService!.getNutritionalInfo(query);
        logger.info('Informations nutritionnelles récupérées par l\'IA', { query, info });
        return info;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getNutritionalInfo (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const troubleshootProblem = useCallback(
    async (problem: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const solution = await geminiService!.troubleshootProblem(problem);
        logger.info('Problème résolu par l\'IA', { problem, solution });
        return solution;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans troubleshootProblem (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  const getCreativeIdeas = useCallback(
    async (context: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Le service de conversation IA n\'est pas prêt.');
      }
      setLoading(true);
      setError(null);
      try {
        const ideas = await geminiService!.getCreativeIdeas(context);
        logger.info('Idées créatives générées par l\'IA', { context, ideas });
        return ideas;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getCreativeIdeas (hook) :', errorMsg as String);
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [geminiService, ensureServicesReady, error]
  );

  return {
    currentConversation,
    messages,
    conversations,
    loading: loading || authLoading || !isReady, // Overall loading state
    error,
    isReady,
    sendMessage,
    streamMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
    getMenuSuggestions,
    generateShoppingList,
    analyzeRecipe,
    generateRecipeSuggestions,
    checkIngredientAvailability,
    getNutritionalInfo,
    troubleshootProblem,
    getCreativeIdeas,
  };
};
