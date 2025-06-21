import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { GeminiService } from '../services/GeminiService';
import {
  AiInteraction,
  Conversation,
  Ingredient,
  MembreFamille,
  Menu,
  Recette,
  HistoriqueRepas,
  Budget,
} from '../constants/entities';
import {
  RecipeAnalysisContent,
  MenuSuggestionContent,
  ShoppingListSuggestionContent,
  RecipeSuggestionContent,
  IngredientAvailabilityContent,
  NutritionalInfoContent,
  TroubleshootProblemContent,
  CreativeIdeasContent,
  StoreSuggestionContent,
  RecipeCompatibilityContent,
  FoodTrendsContent,
  BudgetContent,
  ErrorContent,
} from '../types/messageTypes';
import { logger } from '../utils/logger';
import { formatDateForFirestore, getErrorMessage } from '../utils/helpers';
import { Store } from '../constants/entities';

interface UseAIConversationResult {
  currentConversation: Conversation | undefined;
  messages: AiInteraction[];
  conversations: Conversation[];
  loading: boolean;
  error: string | undefined;
  isReady: boolean;
  sendMessage: (
    message: string,
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
  ) => Promise<Menu>;
  generateShoppingList: (
    menu: Menu,
    currentIngredients: Ingredient[]
  ) => Promise<ShoppingListSuggestionContent['items']>;
  analyzeRecipe: (
    recipe: Recette,
    familyData: MembreFamille[]
  ) => Promise<RecipeAnalysisContent['analysis']>;
  generateRecipeSuggestions: (
    ingredients: Ingredient[],
    preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string }
  ) => Promise<Recette>;
  checkIngredientAvailability: (
    ingredientName: string,
    location: { latitude: number; longitude: number }
  ) => Promise<IngredientAvailabilityContent>;
  generatePersonalizedRecipe: (member: MembreFamille) => Promise<Recette>;
  generateRecipeFromImage: (imageUrl: string, member: MembreFamille) => Promise<Recette>;
  generateWeeklyMenu: (members: MembreFamille[], dateStart: string) => Promise<Menu>;
  generateSpecialOccasionMenu: (
    members: MembreFamille[],
    occasion: string,
    date: string
  ) => Promise<Menu>;
  generateBudgetMenu: (members: MembreFamille[], budget: number) => Promise<Menu>;
  generateBalancedDailyMenu: (member: MembreFamille, date: string) => Promise<Menu>;
  generateQuickRecipe: (member: MembreFamille) => Promise<Recette>;
  generateKidsRecipe: (member: MembreFamille) => Promise<Recette>;
  generateIngredientBasedRecipe: (
    ingredient: Ingredient,
    member: MembreFamille
  ) => Promise<Recette>;
  generateSpecificDietRecipe: (
    member: MembreFamille,
    diet: string
  ) => Promise<Recette>;
  generateLeftoverRecipe: (ingredients: Ingredient[]) => Promise<Recette>;
  generateGuestRecipe: (
    members: MembreFamille[],
    guestCount: number
  ) => Promise<Recette>;
  generateBudgetPlan: (budgetLimit: number, month: string) => Promise<Budget>;
  suggestStore: (ingredient: Ingredient) => Promise<Store[]>;
  checkRecipeCompatibility: (
    recipe: Recette,
    members: MembreFamille[]
  ) => Promise<RecipeCompatibilityContent['compatibility']>;
  optimizeInventory: (ingredients: Ingredient[]) => Promise<Recette>;
  analyzeMeal: (
    historiqueRepas: HistoriqueRepas,
    member: MembreFamille
  ) => Promise<RecipeAnalysisContent['analysis']>;
  analyzeFoodTrends: (members: MembreFamille[]) => Promise<FoodTrendsContent['trends']>;
  getNutritionalInfo: (query: string) => Promise<NutritionalInfoContent['analysis']>;
  troubleshootProblem: (problem: string) => Promise<TroubleshootProblemContent['solution']>;
  getCreativeIdeas: (context: string) => Promise<CreativeIdeasContent['ideas']>;
}

/**
 * Hook personnalisé pour gérer les conversations avec l'IA Gemini.
 * Fournit des fonctionnalités pour envoyer des messages, gérer les conversations,
 * et interagir avec des fonctionnalités spécifiques comme les menus, recettes, et analyses.
 * @returns Objet contenant l'état et les méthodes pour interagir avec l'IA.
 */
export const useAIConversation = (): UseAIConversationResult => {
  const { userId, loading: authLoading } = useAuth();
  const { firestoreService, loading: firestoreLoading, error: firestoreError } = useFirestore();

  // États locaux
  const [currentConversation, setCurrentConversation] = useState<Conversation | undefined>(undefined);
  const [messages, setMessages] = useState<AiInteraction[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  // Initialisation du service GeminiService
  const geminiService = useMemo(() => {
    if (userId) {
      return new GeminiService(userId);
    }
    return undefined;
  }, [userId]);

  // Effet pour initialiser les services et écouter les conversations
  useEffect(() => {
    if (authLoading || firestoreLoading) {
      setIsReady(false);
      setLoading(true);
      setError(undefined);
      logger.info('En attente de l’initialisation de l’authentification ou de Firestore...');
      return;
    }

    if (!userId || !firestoreService || !geminiService) {
      setIsReady(false);
      setLoading(false);
      setError('Utilisateur non authentifié ou services non initialisés');
      logger.error('userId ou services manquants', {
        userId,
        hasFirestore: !!firestoreService,
        hasGemini: !!geminiService,
      });
      setConversations([]);
      setMessages([]);
      setCurrentConversation(undefined);
      return;
    }

    setIsReady(true);
    setLoading(false);
    logger.info('Services de conversation AI prêts', { userId });

    // Écouteur pour les conversations
    const unsubscribeConversations = firestoreService.listenToConversations(
      (data) => {
        setConversations(data);
        const getMostRecentConversation = (convs: Conversation[]) => {
          return convs
            .slice()
            .sort((a, b) => {
              const dateA = new Date(a.dateMiseAJour || a.date || a.dateCreation || 0).getTime();
              const dateB = new Date(b.dateMiseAJour || b.date || b.dateCreation || 0).getTime();
              return dateB - dateA;
            })[0];
        };

        const initialConversationId = getMostRecentConversation(data)?.id;

        if (initialConversationId && !currentConversation) {
          const found = data.find((conv) => conv.id === initialConversationId);
          if (found) {
            setCurrentConversation(found);
          }
        } else if (!currentConversation && data.length > 0) {
          const recent = getMostRecentConversation(data);
          setCurrentConversation(recent);
        }
        logger.info('Conversations mises à jour', { count: data.length });
      },
      (err) => {
        const errorMsg = `Erreur lors de l’écoute des conversations : ${getErrorMessage(err)}`;
        logger.error(errorMsg);
        setError(errorMsg);
      }
    );

    return () => {
      unsubscribeConversations();
      logger.info('Désabonnement de l’écouteur des conversations');
    };
  }, [authLoading, firestoreLoading, userId, firestoreService, geminiService, currentConversation]);

  // Effet pour écouter les messages de la conversation active
  useEffect(() => {
    if (!currentConversation?.id || !firestoreService || !isReady) {
      setMessages([]);
      return;
    }

    const unsubscribeMessages = firestoreService.listenToAiInteractionsForConversation(
      currentConversation.id,
      (data) => {
        setMessages(data);
        logger.info('Messages mis à jour', { conversationId: currentConversation.id, count: data.length });
      },
      (err) => {
        const errorMsg = `Erreur lors de l’écoute des messages : ${getErrorMessage(err)}`;
        logger.error(errorMsg);
        setError(errorMsg);
      }
    );

    return () => {
      unsubscribeMessages();
      logger.info('Désabonnement de l’écouteur des messages');
    };
  }, [currentConversation?.id, firestoreService, isReady]);

  // Vérifie si les services sont prêts
  const ensureServicesReady = useCallback(() => {
    if (!isReady || !firestoreService || !geminiService || !userId) {
      const msg = 'Services non prêts ou utilisateur non authentifié';
      setError(msg);
      logger.error(msg);
      return false;
    }
    return true;
  }, [isReady, firestoreService, geminiService, userId]);

  // Envoie un message à l’IA
  const sendMessage = useCallback(
    async (
      message: string,
      systemInstruction?: string,
      imageData?: { uri: string; mimeType: string; base64: string }
    ) => {
      if (!ensureServicesReady() || !currentConversation?.id) {
        return;
      }

      if (!message && !imageData) {
        const errorMsg = 'Message ou image requis';
        setError(errorMsg);
        logger.error(errorMsg);
        return;
      }

      setLoading(true);
      setError(undefined);

      const userInteraction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour' | 'conversationId'> = {
        content: imageData
          ? { type: 'image', uri: imageData.uri, mimeType: imageData.mimeType, data: imageData.base64 }
          : { type: 'text', message },
        isUser: true,
        timestamp: new Date().toISOString(),
        type: imageData ? 'image' : 'text',
      };

      const tempMessageId = `temp_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          ...userInteraction,
          id: tempMessageId,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          conversationId: currentConversation.id!,
        } as AiInteraction,
      ]);

      try {
        const userMessageId = await firestoreService!.addAiInteractionToConversation(
          currentConversation.id,
          userInteraction
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessageId ? { ...msg, id: userMessageId } : msg))
        );

        const geminiResponse = await geminiService!.generateContent(
          messages,
          {
            text: message,
            imageUrl: imageData?.uri,
            imageDataBase64: imageData?.base64,
            imageMimeType: imageData?.mimeType,
          },
          { systemInstruction, conversationId: currentConversation.id }
        );

        if (geminiResponse.content.type === 'error') {
          throw new Error((geminiResponse.content as ErrorContent).message);
        }

        await firestoreService!.updateConversation(currentConversation.id, {
          dateMiseAJour: formatDateForFirestore(new Date()),
        });
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans sendMessage', { error: errorMsg });
        setError(errorMsg);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      } finally {
        setLoading(false);
      }
    },
    [currentConversation, messages, ensureServicesReady, firestoreService, geminiService]
  );

  // Crée une nouvelle conversation
  const createNewConversation = useCallback(
    async (title: string = 'Nouvelle conversation AI') => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      setError(undefined);
      try {
        const newConversation: Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages'> = {
          date: formatDateForFirestore(new Date()),
          title,
          userId: userId!,
        };
        const newConversationId = await firestoreService!.addConversation(newConversation);
        const createdConv = {
          ...newConversation,
          id: newConversationId,
          messages: [],
          userId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
        };
        setCurrentConversation(createdConv);
        setConversations((prev) => [createdConv, ...prev]);
        setMessages([]);
        logger.info('Nouvelle conversation créée', { id: newConversationId });
        return newConversationId;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur lors de la création de la conversation', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, firestoreService, userId, error]
  );

  // Sélectionne une conversation existante
  const selectConversation = useCallback(
    (conversationId: string) => {
      const selected = conversations.find((conv) => conv.id === conversationId);
      if (selected) {
        setCurrentConversation(selected);
        logger.info('Conversation sélectionnée', { id: conversationId });
        setError(undefined);
      } else {
        const errorMsg = 'Conversation non trouvée';
        setError(errorMsg);
        logger.error(errorMsg);
      }
    },
    [conversations]
  );

  // Réinitialise la conversation active
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(undefined);
    setMessages([]);
    setError(undefined);
    logger.info('Conversation active réinitialisée');
  }, []);

  // Supprime une conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        await firestoreService!.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          clearCurrentConversation();
        }
        logger.info('Conversation supprimée', { id: conversationId });
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur lors de la suppression de la conversation', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, firestoreService, currentConversation, clearCurrentConversation, error]
  );

  // Génère des suggestions de menus
  const getMenuSuggestions = useCallback(
    async (ingredients: Ingredient[], familyData: MembreFamille[], numDays = 7, numMealsPerDay = 2) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateMenuSuggestionsFromAI(
          userId!,
          ingredients,
          familyData,
          numDays,
          numMealsPerDay,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Suggestions de menus générées', { count: 1 });
        return (interaction.content as MenuSuggestionContent).menu;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getMenuSuggestions', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une liste de courses
  const generateShoppingList = useCallback(
    async (menu: Menu, currentIngredients: Ingredient[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateShoppingListFromAI(
          userId!,
          menu,
          currentIngredients,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Liste de courses générée', { menuId: menu.id, itemCount: (interaction.content as ShoppingListSuggestionContent).items.length });
        return (interaction.content as ShoppingListSuggestionContent).items;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateShoppingList', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Analyse une recette
  const analyzeRecipe = useCallback(
    async (recipe: Recette, familyData: MembreFamille[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.analyzeRecipeWithAI(
          userId!,
          recipe,
          familyData,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette analysée', { recipeId: recipe.id });
        return (interaction.content as RecipeAnalysisContent).analysis;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans analyzeRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère des suggestions de recettes
  const generateRecipeSuggestions = useCallback(
    async (
      ingredients: Ingredient[],
      preferences: { niveauEpices: number; cuisinesPreferees: string[]; mealType?: string }
    ) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateRecipeSuggestionsFromAI(
          userId!,
          ingredients,
          preferences,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Suggestions de recettes générées', { count: 1 });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateRecipeSuggestions', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Vérifie la disponibilité d’un ingrédient
  const checkIngredientAvailability = useCallback(
    async (ingredientName: string, location: { latitude: number; longitude: number }) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.checkIngredientAvailability(
          userId!,
          ingredientName,
          location,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Disponibilité de l’ingrédient vérifiée', { ingredientName });
        return interaction.content as IngredientAvailabilityContent;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans checkIngredientAvailability', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette personnalisée
  const generatePersonalizedRecipe = useCallback(
    async (member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generatePersonalizedRecipe(userId!, member, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette personnalisée générée', { memberId: member.id });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generatePersonalizedRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette à partir d’une image
  const generateRecipeFromImage = useCallback(
    async (imageUrl: string, member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateRecipeFromImage(
          userId!,
          imageUrl,
          member,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette générée à partir d’une image', { memberId: member.id });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateRecipeFromImage', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère un menu hebdomadaire
  const generateWeeklyMenu = useCallback(
    async (members: MembreFamille[], dateStart: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateWeeklyMenu(
          userId!,
          members,
          dateStart,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Menu hebdomadaire généré', { dateStart });
        return (interaction.content as MenuSuggestionContent).menu;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateWeeklyMenu', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère un menu pour une occasion spéciale
  const generateSpecialOccasionMenu = useCallback(
    async (members: MembreFamille[], occasion: string, date: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateSpecialOccasionMenu(
          userId!,
          members,
          occasion,
          date,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Menu pour occasion spéciale généré', { occasion, date });
        return (interaction.content as MenuSuggestionContent).menu;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateSpecialOccasionMenu', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère un menu économique
  const generateBudgetMenu = useCallback(
    async (members: MembreFamille[], budget: number) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateBudgetMenu(
          userId!,
          members,
          budget,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Menu économique généré', { budget });
        return (interaction.content as MenuSuggestionContent).menu;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateBudgetMenu', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère un menu quotidien équilibré
  const generateBalancedDailyMenu = useCallback(
    async (member: MembreFamille, date: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateBalancedDailyMenu(
          userId!,
          member,
          date,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Menu quotidien équilibré généré', { memberId: member.id, date });
        return (interaction.content as MenuSuggestionContent).menu;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateBalancedDailyMenu', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette rapide
  const generateQuickRecipe = useCallback(
    async (member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateQuickRecipe(userId!, member, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette rapide générée', { memberId: member.id });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateQuickRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette pour enfants
  const generateKidsRecipe = useCallback(
    async (member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateKidsRecipe(userId!, member, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette pour enfants générée', { memberId: member.id });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateKidsRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette basée sur un ingrédient
  const generateIngredientBasedRecipe = useCallback(
    async (ingredient: Ingredient, member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateIngredientBasedRecipe(
          userId!,
          ingredient,
          member,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette basée sur un ingrédient générée', { ingredientId: ingredient.id, memberId: member.id });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateIngredientBasedRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette pour un régime spécifique
  const generateSpecificDietRecipe = useCallback(
    async (member: MembreFamille, diet: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateSpecificDietRecipe(
          userId!,
          member,
          diet,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette pour régime spécifique générée', { memberId: member.id, diet });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateSpecificDietRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette à partir de restes
  const generateLeftoverRecipe = useCallback(
    async (ingredients: Ingredient[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateLeftoverRecipe(userId!, ingredients, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette à partir de restes générée', { ingredientCount: ingredients.length });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateLeftoverRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère une recette pour des invités
  const generateGuestRecipe = useCallback(
    async (members: MembreFamille[], guestCount: number) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateGuestRecipe(
          userId!,
          members,
          guestCount,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Recette pour invités générée', { guestCount });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateGuestRecipe', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère un plan budgétaire
  const generateBudgetPlan = useCallback(
    async (budgetLimit: number, month: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.generateBudgetPlan(
          userId!,
          budgetLimit,
          month,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Plan budgétaire généré', { budgetLimit, month });
        return (interaction.content as BudgetContent).budget;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans generateBudgetPlan', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Suggère un magasin pour un ingrédient
  const suggestStore = useCallback(
    async (ingredient: Ingredient) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.suggestStore(userId!, ingredient, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Magasin suggéré', { ingredientId: ingredient.id });
        return (interaction.content as StoreSuggestionContent).stores;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans suggestStore', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Vérifie la compatibilité d’une recette
  const checkRecipeCompatibility = useCallback(
    async (recipe: Recette, members: MembreFamille[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.checkRecipeCompatibility(
          userId!,
          recipe,
          members,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Compatibilité de la recette vérifiée', { recipeId: recipe.id });
        return (interaction.content as RecipeCompatibilityContent).compatibility;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans checkRecipeCompatibility', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Optimise l’inventaire avec des suggestions de recettes
  const optimizeInventory = useCallback(
    async (ingredients: Ingredient[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.optimizeInventory(userId!, ingredients, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Inventaire optimisé', { ingredientCount: ingredients.length });
        return {
          id: (interaction.content as RecipeSuggestionContent).recipeId,
          nom: (interaction.content as RecipeSuggestionContent).name,
          createurId: userId!,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          ingredients: (interaction.content as RecipeSuggestionContent).ingredients,
          instructions: [],
          tempsPreparation: 0,
          portions: 1,
          categorie: 'plat principal',
          difficulte: 'facile',
          etapesPreparation: [],
        } as Recette;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans optimizeInventory', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Analyse un repas consommé
  const analyzeMeal = useCallback(
    async (historiqueRepas: HistoriqueRepas, member: MembreFamille) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.analyzeMeal(
          userId!,
          historiqueRepas,
          member,
          currentConversation?.id
        );
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Repas analysé', { memberId: member.id });
        return (interaction.content as RecipeAnalysisContent).analysis;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans analyzeMeal', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Analyse les tendances alimentaires
  const analyzeFoodTrends = useCallback(
    async (members: MembreFamille[]) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.analyzeFoodTrends(userId!, members, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Tendances alimentaires analysées', { memberCount: members.length });
        return (interaction.content as FoodTrendsContent).trends;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans analyzeFoodTrends', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Obtient des informations nutritionnelles
  const getNutritionalInfo = useCallback(
    async (query: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.getNutritionalInfo(userId!, query, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Informations nutritionnelles récupérées', { query });
        return (interaction.content as NutritionalInfoContent).analysis;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getNutritionalInfo', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Résout un problème culinaire
  const troubleshootProblem = useCallback(
    async (problem: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.troubleshootProblem(userId!, problem, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Problème résolu', { problem });
        return (interaction.content as TroubleshootProblemContent).solution;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans troubleshootProblem', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Génère des idées créatives
  const getCreativeIdeas = useCallback(
    async (context: string) => {
      if (!ensureServicesReady()) {
        throw new Error(error || 'Services non prêts');
      }

      setLoading(true);
      try {
        const interaction = await geminiService!.getCreativeIdeas(userId!, context, currentConversation?.id);
        if (interaction.content.type === 'error') {
          throw new Error((interaction.content as ErrorContent).message);
        }
        logger.info('Idées créatives générées', { context, count: (interaction.content as CreativeIdeasContent).ideas.length });
        return (interaction.content as CreativeIdeasContent).ideas;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        logger.error('Erreur dans getCreativeIdeas', { error: errorMsg });
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [ensureServicesReady, geminiService, currentConversation, userId, error]
  );

  // Retour des états et méthodes
  return {
    currentConversation,
    messages,
    conversations,
    loading: loading || authLoading || firestoreLoading,
    error: error ?? (firestoreError === null ? undefined : firestoreError),
    isReady,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
    getMenuSuggestions,
    generateShoppingList,
    analyzeRecipe,
    generateRecipeSuggestions,
    checkIngredientAvailability,
    generatePersonalizedRecipe,
    generateRecipeFromImage,
    generateWeeklyMenu,
    generateSpecialOccasionMenu,
    generateBudgetMenu,
    generateBalancedDailyMenu,
    generateQuickRecipe,
    generateKidsRecipe,
    generateIngredientBasedRecipe,
    generateSpecificDietRecipe,
    generateLeftoverRecipe,
    generateGuestRecipe,
    generateBudgetPlan,
    suggestStore,
    checkRecipeCompatibility,
    optimizeInventory,
    analyzeMeal,
    analyzeFoodTrends,
    getNutritionalInfo,
    troubleshootProblem,
    getCreativeIdeas,
  };
};
