import { useState, useCallback, useMemo } from 'react';
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

export const useFirestore = (userId: string, familyId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firestoreService = useMemo(() => new FirestoreService(userId, familyId), [userId, familyId]);

  const getCollection = useCallback(
    async <T>(collectionName: CollectionType, param?: string): Promise<T[]> => {
      if (!userId || !familyId) {
        logger.warn('userId or familyId is missing, cannot fetch collection.');
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
            if (!param) {throw new Error('storeId is required for StoreItems');}
            data = (await firestoreService.getStoreItems(param)) as T[];
            break;
          case 'HistoriqueRepas':
            data = (await firestoreService.getHistoriqueRepas(param)) as T[];
            break;
          case 'aiInteractions':
            data = (await firestoreService.getAiInteractions()) as T[];
            break;
          case 'conversations':
            data = (await firestoreService.getConversations()) as T[];
            break;
          default:
            throw new Error(`Collection "${collectionName}" not supported.`);
        }
        logger.info(`${collectionName} fetched successfully`, { count: data.length });
        return data;
      } catch (err: any) {
        logger.error(`Error fetching ${collectionName}`, { error: err.message, stack: err.stack });
        setError(err.message || `Erreur lors de la récupération des ${collectionName}`);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [familyId, firestoreService, userId]
  );

  const addEntity = useCallback(
    async (
      collectionName: CollectionType,
      entity:
        | Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | { storeId: string; item: Omit<StoreItem, 'id' | 'dateMiseAJour'> }
        | Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour'>
        | Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour'>
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        let id: string | null = null;
        switch (collectionName) {
          case 'FamilyMembers':
            id = await firestoreService.addFamilyMember(entity as Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'Ingredients':
            id = await firestoreService.addIngredient(entity as Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'Recipes':
            id = await firestoreService.addRecipe(entity as Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'Menus':
            id = await firestoreService.addMenu(entity as Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'ShoppingLists':
            id = await firestoreService.addShoppingList(entity as Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'Budgets':
            id = await firestoreService.addBudget(entity as Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'Stores':
            id = await firestoreService.addStore(entity as Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'StoreItems':
            const { storeId, item } = entity as { storeId: string; item: Omit<StoreItem, 'id' | 'dateMiseAJour'> };
            id = await firestoreService.addStoreItem(storeId, item);
            break;
          case 'HistoriqueRepas':
            id = await firestoreService.addHistoriqueRepas(entity as Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'aiInteractions':
            id = await firestoreService.addAiInteractionToConversation(entity as Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          case 'conversations':
            id = await firestoreService.addConversation(entity as Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          default:
            throw new Error(`Collection "${collectionName}" not supported for adding.`);
        }
        logger.info(`${collectionName} added successfully`, { id });
        return id;
      } catch (err: any) {
        logger.error(`Error adding entity to ${collectionName}`, { error: err.message, stack: err.stack });
        setError(err.message || `Erreur lors de l’ajout dans ${collectionName}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService]
  );

  return {
    loading,
    error,
    getCollection,
    addEntity,
  };
};
