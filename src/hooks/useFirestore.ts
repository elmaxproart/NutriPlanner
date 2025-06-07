import { useState, useCallback, useMemo } from 'react';
import { FirestoreService } from '../services/FirestoreService'; // Assurez-vous que ce chemin est correct
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
import { logger } from '../utils/logger'; // Assurez-vous que ce chemin est correct

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
  if (!userId || !familyId) {
    // Il est préférable de gérer cela au niveau du composant appelant pour éviter un crash direct de l'application
    // ou de retourner un état indiquant que le hook n'est pas prêt.
    logger.error('userId et familyId sont requis pour initialiser useFirestore.');
    // Vous pourriez retourner un objet { loading: false, error: '...' } ici au lieu de throw
    // Pour l'instant, conservons le throw comme dans votre code initial.
    throw new Error('userId et familyId sont requis pour initialiser useFirestore.');
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firestoreService = useMemo(() => new FirestoreService(userId, familyId), [userId, familyId]);

  const getCollection = useCallback(
    async <T>(collectionName: CollectionType, param?: string): Promise<T[]> => {
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
            if (!param) {throw new Error('storeId est requis pour récupérer les StoreItems.');}
            data = (await firestoreService.getStoreItems(param)) as T[];
            break;
          case 'HistoriqueRepas':
            if (!param) {throw new Error('Un paramètre (ex. date ou menuId) est requis pour HistoriqueRepas.');}
            data = (await firestoreService.getHistoriqueRepas(param)) as T[];
            break;
          case 'aiInteractions':
            if (!param) {throw new Error('conversationId est requis pour récupérer les aiInteractions.');}
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
        logger.error(`Erreur lors de la récupération de ${collectionName}`, { error: errorMsg, stack: err.stack });
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [firestoreService]
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
        | { conversationId: string; interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour'> }
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
            const { conversationId, interaction } = entity as {
              conversationId: string;
              interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour'>;
            };
            if (!conversationId) {throw new Error('conversationId est requis pour ajouter une interaction.');}
            id = await firestoreService.addAiInteractionToConversation(conversationId, interaction);
            break;
          case 'conversations':
            id = await firestoreService.addConversation(entity as Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour'>);
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge pour l'ajout.`);
        }
        logger.info(`${collectionName} ajouté avec succès`, { id });
        return id;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de l’ajout dans ${collectionName}`;
        logger.error(`Erreur lors de l'ajout dans ${collectionName}`, { error: errorMsg, stack: err.stack });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService]
  );

  const deleteEntity = useCallback(
    async (collectionName: CollectionType, id: string): Promise<boolean> => {
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
           // success = await firestoreService.deleteStoreItem(id);
            break;
          case 'HistoriqueRepas':
            success = await firestoreService.deleteHistoriqueRepas(id);
            break;
          /*case 'aiInteractions':
            // Note: If deleteAiInteraction in FirestoreService needs conversationId, you'd need to pass it here.
            // Example: success = await firestoreService.deleteAiInteraction(someConversationId, id);
            success = await firestoreService.deleteAiInteraction(id);
            break;*/
          case 'conversations':
            success = await firestoreService.deleteConversation(id);
            break;
          default:
            throw new Error(`Collection "${collectionName}" non prise en charge pour la suppression.`);
        }
        if (success) {
          logger.info(`${collectionName} avec ID ${id} supprimé avec succès`);
        } else {
          logger.warn(`${collectionName} avec ID ${id} n'a pas pu être supprimé (peut-être non trouvé ou permissions).`);
        }
        return success;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la suppression de ${collectionName}`;
        logger.error(`Erreur lors de la suppression de ${collectionName}`, { error: errorMsg, stack: err.stack });
        setError(errorMsg);
        return false;
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
    deleteEntity,
  };
};
