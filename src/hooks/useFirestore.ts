import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { FirestoreService } from '../services/FirestoreService';
import {
  MembreFamille,
  Ingredient,
  Recette,
  Menu,
  ListeCourses,
  Budget,
  Store,
  StoreItem,
  HistoriqueRepas,
  AiInteraction,
  Conversation,
} from '../constants/entities';
import { logger } from '../utils/logger';

type CollectionType =
  | 'FamilyMembers'
  | 'Ingredients'
  | 'Recipes'
  | 'Menus'
  | 'ShoppingLists'
  | 'Budgets'
  | 'Stores'
  | 'StoreItems'
  | 'HistoriqueRepas'
  | 'aiInteractions'
  | 'conversations';

export const useFirestore = (overrideUserId?: string) => {
  const { userId: authUserId, loading: authLoading } = useAuth();
  const userId = overrideUserId || authUserId;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      setLoading(false);
      setError('Utilisateur non authentifié');
      setFirestoreService(null);
      logger.warn('No authenticated user, FirestoreService not initialized');
      return;
    }

    const initializeService = async () => {
      try {
        const service = new FirestoreService(userId);
        await service.ensureFamilyExists();
        setFirestoreService(service);
        setLoading(false);
        logger.info('FirestoreService initialized successfully', { userId });
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’initialisation du service Firestore';
        setError(errorMsg);
        setLoading(false);
        logger.error('Failed to initialize FirestoreService', { error: errorMsg });
      }
    };

    initializeService();
  }, [userId, authLoading]);

  const getCollection = useCallback(
    async <T>(collectionName: CollectionType, param?: string): Promise<T[]> => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        let data: T[] = [];
        switch (collectionName) {
          case 'FamilyMembers':
            data = (await firestoreService.getFamilyMembers()) as T[];
            break;
          case 'Ingredients':
            data = (await firestoreService.getIngredients()) as T[];
            break;
          case 'Recipes':
            data = (await firestoreService.getRecipes()) as T[];
            break;
          case 'Menus':
            data = (await firestoreService.getMenus()) as T[];
            break;
          case 'ShoppingLists':
            data = (await firestoreService.getShoppingLists()) as T[];
            break;
          case 'Budgets':
            data = (await firestoreService.getBudgets()) as T[];
            break;
          case 'Stores':
            data = (await firestoreService.getStores()) as T[];
            break;
          case 'StoreItems':
            if (!param) {
              throw new Error('storeId est requis pour récupérer les StoreItems.');
            }
            data = (await firestoreService.getStoreItems(param)) as T[];
            break;
          case 'HistoriqueRepas':
            data = (await firestoreService.getHistoriqueRepas(param)) as T[];
            break;
          case 'aiInteractions':
            if (!param) {
              throw new Error('conversationId est requis pour récupérer les aiInteractions.');
            }
            data = (await firestoreService.getAiInteractionsForConversation(param)) as T[];
            break;
          case 'conversations':
            data = (await firestoreService.getConversations()) as T[];
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge.`);
        }
        logger.info(`${collectionName} récupérée avec succès`, { count: data.length });
        return data;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la récupération des ${collectionName}`;
        logger.error(`Erreur lors de la récupération de ${collectionName}`, { error: errorMsg });
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId]
  );

  const addEntity = useCallback(
    async (
      collectionName: CollectionType,
      entity:
        | Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
        | { storeId: string; item: Omit<StoreItem, 'id' | 'dateMiseAJour' | 'storeId'> }
        | Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | { conversationId: string; interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour' | 'conversationId'> }
        | Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages' | 'userId'>
    ): Promise<string | null> => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        let id: string | null = null;
        switch (collectionName) {
          case 'FamilyMembers':
            id = await firestoreService.addFamilyMember(
              { ...entity, userId } as Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'Ingredients':
            id = await firestoreService.addIngredient(
              entity as Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'Recipes':
            id = await firestoreService.addRecipe(
              entity as Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'Menus':
            id = await firestoreService.addMenu(
              entity as Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'ShoppingLists':
            id = await firestoreService.addShoppingList(
              entity as Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'Budgets':
            id = await firestoreService.addBudget(
              entity as Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'Stores':
            id = await firestoreService.addStore(
              entity as Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>
            );
            break;
          case 'StoreItems':
            const { storeId, item } = entity as {
              storeId: string;
              item: Omit<StoreItem, 'id' | 'dateMiseAJour' | 'storeId'>;
            };
            id = await firestoreService.addStoreItem(storeId, item);
            break;
          case 'HistoriqueRepas':
            id = await firestoreService.addHistoriqueRepas(
              entity as Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>
            );
            break;
          case 'aiInteractions':
            const { conversationId, interaction } = entity as {
              conversationId: string;
              interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour' | 'conversationId'>;
            };
            id = await firestoreService.addAiInteractionToConversation(conversationId, interaction);
            break;
          case 'conversations':
            id = await firestoreService.addConversation(
              { ...entity } as Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages'>,
            );
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge pour l'ajout.`);
        }
        logger.info(`${collectionName} ajouté avec succès`, { id });
        return id;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de l’ajout dans ${collectionName}`;
        logger.error(`Erreur lors de l'ajout dans ${collectionName}`, { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId]
  );

  const updateEntity = useCallback(
    async (
      collectionName: CollectionType,
      id: string,
      updates:
        | Partial<MembreFamille>
        | Partial<Ingredient>
        | Partial<Recette>
        | Partial<Menu>
        | Partial<ListeCourses>
        | Partial<Budget>
        | Partial<Store>
        | Partial<StoreItem>
        | Partial<HistoriqueRepas>
        | Partial<AiInteraction>
        | Partial<Conversation>,
      param?: string
    ): Promise<boolean> => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        let success = false;
        switch (collectionName) {
          case 'FamilyMembers':
            await firestoreService.updateFamilyMember(id, updates as Partial<MembreFamille>);
            success = true;
            break;
          case 'Ingredients':
            await firestoreService.updateIngredient(id, updates as Partial<Ingredient>);
            success = true;
            break;
          case 'Recipes':
            await firestoreService.updateRecipe(id, updates as Partial<Recette>);
            success = true;
            break;
          case 'Menus':
            await firestoreService.updateMenu(id, updates as Partial<Menu>);
            success = true;
            break;
          case 'ShoppingLists':
            await firestoreService.updateShoppingList(id, updates as Partial<ListeCourses>);
            success = true;
            break;
          case 'Budgets':
            await firestoreService.updateBudget(id, updates as Partial<Budget>);
            success = true;
            break;
          case 'Stores':
            await firestoreService.updateStore(id, updates as Partial<Store>);
            success = true;
            break;
          case 'StoreItems':
            if (!param) {
              throw new Error('storeId est requis pour mettre à jour un StoreItem.');
            }
            await firestoreService.updateStoreItem(param, id, updates as Partial<StoreItem>);
            success = true;
            break;
          case 'HistoriqueRepas':
            await firestoreService.updateHistoriqueRepas(id, updates as Partial<HistoriqueRepas>);
            success = true;
            break;
          case 'aiInteractions':
            if (!param) {
              throw new Error('conversationId est requis pour mettre à jour une aiInteraction.');
            }
            await firestoreService.updateAiInteractionInConversation(param, id, updates as Partial<AiInteraction>);
            success = true;
            break;
          case 'conversations':
            await firestoreService.updateConversation(id, updates as Partial<Conversation>);
            success = true;
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge pour la mise à jour.`);
        }
        if (success) {
          logger.info(`${collectionName} avec ID ${id} mis à jour avec succès`);
        } else {
          logger.warn(`${collectionName} avec ID ${id} n'a pas pu être mis à jour`);
        }
        return success;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la mise à jour de ${collectionName}`;
        logger.error(`Erreur lors de la mise à jour de ${collectionName}`, { error: errorMsg });
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId]
  );

  const deleteEntity = useCallback(
    async (collectionName: CollectionType, id: string, param?: string): Promise<boolean> => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        let success = false;
        switch (collectionName) {
          case 'FamilyMembers':
            success = await firestoreService.deleteFamilyMember(id);
            break;
          case 'Ingredients':
            success = await firestoreService.deleteIngredient(id);
            break;
          case 'Recipes':
            success = await firestoreService.deleteRecipe(id);
            break;
          case 'Menus':
            success = await firestoreService.deleteMenu(id);
            break;
          case 'ShoppingLists':
            success = await firestoreService.deleteShoppingList(id);
            break;
          case 'Budgets':
            success = await firestoreService.deleteBudget(id);
            break;
          case 'Stores':
            success = await firestoreService.deleteStore(id);
            break;
          case 'StoreItems':
            if (!param) {
              throw new Error('storeId est requis pour supprimer un StoreItem.');
            }
            success = await firestoreService.deleteStoreItem(param, id);
            break;
          case 'HistoriqueRepas':
            success = await firestoreService.deleteHistoriqueRepas(id);
            break;
          case 'aiInteractions':
            if (!param) {
              throw new Error('conversationId est requis pour supprimer une aiInteraction.');
            }
            success = await firestoreService.deleteAiInteractionFromConversation(param, id);
            break;
          case 'conversations':
            success = await firestoreService.deleteConversation(id);
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge pour la suppression.`);
        }
        if (success) {
          logger.info(`${collectionName} avec ID ${id} supprimé avec succès`);
        } else {
          logger.warn(`${collectionName} avec ID ${id} n'a pas pu être supprimé`);
        }
        return success;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la suppression de ${collectionName}`;
        logger.error(`Erreur lors de la suppression de ${collectionName}`, { error: errorMsg });
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId]
  );

  return {
    loading,
    error,
    firestoreService,
    getCollection,
    addEntity,
    updateEntity,
    deleteEntity,
  };
};
