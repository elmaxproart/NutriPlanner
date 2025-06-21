import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
import {
  validateMembreFamille,
  validateIngredient,
  validateRecette,
  validateMenu,
  validateListeCourses,
  validateBudget,
  validateStore,
  validateStoreItem,
  validateHistoriqueRepas,
} from '../utils/dataValidators';
import { formatDateForFirestore, generateId, getErrorMessage } from '../utils/helpers';
import { logger } from '../utils/logger';
import { MenuSuggestionContent } from '../types/messageTypes';

export class FirestoreService {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      logger.error('User ID is required to initialize FirestoreService');
      throw new Error('User ID is required to initialize FirestoreService');
    }
    this.userId = userId;
    logger.info('FirestoreService initialized', { userId });
  }

  getID() {
    return this.userId;
  }

  private getCollectionRef(
    collectionName: string
  ): FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData> {
    return firestore()
      .collection('users')
      .doc(this.userId)
      .collection(collectionName);
  }

  private getSubCollectionRef(
    parentCollectionName: string,
    parentId: string,
    subCollectionName: string
  ): FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData> {
    return this.getCollectionRef(parentCollectionName)
      .doc(parentId)
      .collection(subCollectionName);
  }

  private async addDocument<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    data: T,
    validator?: (data: Partial<T>) => string[],
    parentDocId?: string,
    subCollectionName?: string
  ): Promise<string> {
    try {
      if (validator) {
        const errors = validator(data);
        if (errors.length > 0) {
          logger.error(`Validation failed for ${collectionName}`, { errors, data });
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
      }

      const ref = parentDocId && subCollectionName
        ? this.getSubCollectionRef(collectionName, parentDocId, subCollectionName)
        : this.getCollectionRef(collectionName);

      if ((data as any).id) {
        const docRef = ref.doc((data as any).id);
        await docRef.set(data);
        logger.info(`Document set in ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`, { id: (data as any).id });
        return (data as any).id;
      } else {
        const newDocRef = await ref.add(data);
        logger.info(`Document added to ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`, { id: newDocRef.id });
        return newDocRef.id;
      }
    } catch (error) {
      logger.error(`Error adding document to ${collectionName}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  private async updateDocument<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    docId: string,
    data: Partial<T>,
    validator?: (data: Partial<T>) => string[],
    parentDocId?: string,
    subCollectionName?: string
  ): Promise<void> {
    try {
      if (validator) {
        const errors = validator(data);
        if (errors.length > 0) {
          logger.error(`Validation failed for updating ${collectionName}/${docId}`, { errors, data });
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
      }

      const docRef = parentDocId && subCollectionName
        ? this.getSubCollectionRef(collectionName, parentDocId, subCollectionName).doc(docId)
        : this.getCollectionRef(collectionName).doc(docId);

      await docRef.update({
        ...data,
        dateMiseAJour: formatDateForFirestore(new Date()),
      });
      logger.info(`Document ${docId} updated in ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`, { data });
    } catch (error) {
      logger.error(`Error updating document ${docId} in ${collectionName}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  private async deleteDocument(
    collectionName: string,
    docId: string,
    parentDocId?: string,
    subCollectionName?: string
  ): Promise<boolean> {
    try {
      const docRef = parentDocId && subCollectionName
        ? this.getSubCollectionRef(collectionName, parentDocId, subCollectionName).doc(docId)
        : this.getCollectionRef(collectionName).doc(docId);

      await docRef.delete();
      logger.info(`Document ${docId} deleted from ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting document ${docId} from ${collectionName}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  private listenToDocuments<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    onData: (data: T[]) => void,
    onError: (error: Error) => void,
    queryFn?: (
      ref: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>
    ) => FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>,
    parentDocId?: string,
    subCollectionName?: string
  ): () => void {
    try {
      let queryRef: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData> = parentDocId && subCollectionName
        ? this.getSubCollectionRef(collectionName, parentDocId, subCollectionName)
        : this.getCollectionRef(collectionName);

      if (queryFn) {
        queryRef = queryFn(queryRef);
      }

      const unsubscribe = queryRef.onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
          logger.info(`Data received for ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`, { count: items.length });
          onData(items);
        },
        (error) => {
          logger.error(`Error listening to ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`, { error: getErrorMessage(error) });
          onError(error);
        }
      );

      logger.info(`Started listening to ${collectionName}${parentDocId ? `/${parentDocId}/${subCollectionName}` : ''}`);
      return unsubscribe;
    } catch (error) {
      logger.error(`Error setting up listener for ${collectionName}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async ensureFamilyExists(): Promise<void> {
    try {
      const familyRef = firestore()
        .collection('users')
        .doc(this.userId)
        .collection('metadata')
        .doc('family');

      const familyDoc = await familyRef.get();
      if (!familyDoc.exists) {
        const currentDate = new Date();
        const familyData = {
          id: 'family1',
          creatorId: this.userId,
          familyName: 'Famille 1',
          dateCreation: formatDateForFirestore(currentDate),
          dateMiseAJour: formatDateForFirestore(currentDate),
          membersCount: 0,
          status: 'active',
          lastModifiedBy: this.userId,
        };

        await familyRef.set(familyData);
        logger.info('Family metadata created', { userId: this.userId, timestamp: currentDate.toISOString() });
      }
    } catch (error) {
      logger.error('Error ensuring family exists', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async getFamilyMembers(): Promise<MembreFamille[]> {
    try {
      const snapshot = await this.getCollectionRef('familyMembers').get();
      const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), userId: this.userId } as MembreFamille));
      logger.info('Family members fetched', { count: members.length });
      return members;
    } catch (error) {
      logger.error('Error fetching family members', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async getFamilyMembersForCurrentUser(): Promise<MembreFamille[]> {
    try {
      const snapshot = await this.getCollectionRef('familyMembers').where('familyId', '==', this.userId).get();
      const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), userId: this.userId } as MembreFamille));
      logger.info('Family members for current user fetched', { count: members.length });
      return members;
    } catch (error) {
      logger.error('Error fetching family members for current user', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addFamilyMember(member: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    try {
      const newMember: MembreFamille = {
        ...member,
        id: generateId('Member'),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        createurId: this.userId,
      };

      const familyRef = firestore()
        .collection('users')
        .doc(this.userId)
        .collection('metadata')
        .doc('family');

      return await firestore().runTransaction(async (transaction) => {
        const memberDocRef = this.getCollectionRef('familyMembers').doc(newMember.id);
        transaction.set(memberDocRef, newMember);

        const familyDoc = await transaction.get(familyRef);
        if (!familyDoc.exists) {
          throw new Error('Family metadata does not exist.');
        }
        const currentCount = familyDoc.data()?.membersCount || 0;
        transaction.update(familyRef, { membersCount: currentCount + 1 });

        logger.info('Family member added', { memberId: newMember.id, membersCount: currentCount + 1 });
        return newMember.id;
      });
    } catch (error) {
      logger.error('Error adding family member', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updateFamilyMember(memberId: string, data: Partial<MembreFamille>): Promise<void> {
    await this.updateDocument('familyMembers', memberId, data, validateMembreFamille);
  }

  async deleteFamilyMember(memberId: string): Promise<boolean> {
    try {
      const familyRef = firestore()
        .collection('users')
        .doc(this.userId)
        .collection('metadata')
        .doc('family');

      await firestore().runTransaction(async (transaction) => {
        const memberDocRef = this.getCollectionRef('familyMembers').doc(memberId);
        const memberDoc = await transaction.get(memberDocRef);
        if (!memberDoc.exists) {
          throw new Error('Member does not exist.');
        }
        transaction.delete(memberDocRef);

        const familyDoc = await transaction.get(familyRef);
        if (!familyDoc.exists) {
          throw new Error('Family metadata does not exist.');
        }
        const currentCount = familyDoc.data()?.membersCount || 0;
        if (currentCount > 0) {
          transaction.update(familyRef, { membersCount: currentCount - 1 });
        }

        logger.info('Family member deleted', { memberId, membersCount: currentCount - 1 });
      });

      return true;
    } catch (error) {
      logger.error('Error deleting family member', { error: getErrorMessage(error) });
      throw error;
    }
  }

  listenToFamilyMembers(onData: (data: MembreFamille[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('familyMembers', onData, onError);
  }

  async getIngredients(): Promise<Ingredient[]> {
    try {
      const snapshot = await this.getCollectionRef('ingredients').get();
      const ingredients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createurId: this.userId } as Ingredient));
      logger.info('Ingredients fetched', { count: ingredients.length });
      return ingredients;
    } catch (error) {
      logger.error('Error fetching ingredients', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: generateId('Ingredient'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      createurId: this.userId,
    };
    return this.addDocument('ingredients', newIngredient, validateIngredient);
  }

  async updateIngredient(ingredientId: string, data: Partial<Ingredient>): Promise<void> {
    await this.updateDocument('ingredients', ingredientId, data, validateIngredient);
  }

  async deleteIngredient(ingredientId: string): Promise<boolean> {
    return this.deleteDocument('ingredients', ingredientId);
  }

  listenToIngredients(onData: (data: Ingredient[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('ingredients', onData, onError);
  }


  async getRecipes(): Promise<Recette[]> {
    try {
      const snapshot = await this.getCollectionRef('recipes').get();
      const recipes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createurId: this.userId } as Recette));
      logger.info('Recipes fetched', { count: recipes.length });
      return recipes;
    } catch (error) {
      logger.error('Error fetching recipes', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addRecipe(recipe: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newRecipe: Recette = {
      ...recipe,
      id: generateId('Recette'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      createurId: this.userId,
    };
    return this.addDocument('recipes', newRecipe, validateRecette);
  }

  async updateRecipe(recipeId: string, data: Partial<Recette>): Promise<void> {
    await this.updateDocument('recipes', recipeId, data, validateRecette);
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    return this.deleteDocument('recipes', recipeId);
  }

  listenToRecipes(onData: (data: Recette[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('recipes', onData, onError);
  }

  async getMenus(): Promise<Menu[]> {
    try {
      const snapshot = await this.getCollectionRef('menus').get();
      const menus = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createurId: this.userId } as Menu));
      logger.info('Menus fetched', { count: menus.length });
      return menus;
    } catch (error) {
      logger.error('Error fetching menus', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addMenu(menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newMenu: Menu = {
      ...menu,
      id: generateId('Menu'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      createurId: this.userId,
    };
    return this.addDocument('menus', newMenu, validateMenu);
  }

  async updateMenu(menuId: string, data: Partial<Menu>): Promise<void> {
    await this.updateDocument('menus', menuId, data, validateMenu);
  }

  async deleteMenu(menuId: string): Promise<boolean> {
    return this.deleteDocument('menus', menuId);
  }

  listenToMenus(onData: (data: Menu[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('menus', onData, onError);
  }

  async getShoppingLists(): Promise<ListeCourses[]> {
    try {
      const snapshot = await this.getCollectionRef('shoppingLists').get();
      const lists = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createurId: this.userId } as ListeCourses));
      logger.info('Shopping lists fetched', { count: lists.length });
      return lists;
    } catch (error) {
      logger.error('Error fetching shopping lists', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addShoppingList(list: Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newList: ListeCourses = {
      ...list,
      id: generateId('Shopping'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      createurId: this.userId,
    };
    return this.addDocument('shoppingLists', newList, validateListeCourses);
  }

  async updateShoppingList(listId: string, data: Partial<ListeCourses>): Promise<void> {
    await this.updateDocument('shoppingLists', listId, data, validateListeCourses);
  }

  async deleteShoppingList(listId: string): Promise<boolean> {
    return this.deleteDocument('shoppingLists', listId);
  }

  listenToShoppingLists(onData: (data: ListeCourses[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('shoppingLists', onData, onError);
  }

  async getBudgets(): Promise<Budget[]> {
    try {
      const snapshot = await this.getCollectionRef('budgets').get();
      const budgets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createurId: this.userId } as Budget));
      logger.info('Budgets fetched', { count: budgets.length });
      return budgets;
    } catch (error) {
      logger.error('Error fetching budgets', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addBudget(budget: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newBudget: Budget = {
      ...budget,
      id: generateId('Budget'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      createurId: this.userId,
    };
    return this.addDocument('budgets', newBudget, validateBudget);
  }

  async updateBudget(budgetId: string, data: Partial<Budget>): Promise<void> {
    await this.updateDocument('budgets', budgetId, data, validateBudget);
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    return this.deleteDocument('budgets', budgetId);
  }

  listenToBudgets(onData: (data: Budget[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('budgets', onData, onError);
  }

  async getStores(): Promise<Store[]> {
    try {
      const snapshot = await this.getCollectionRef('stores').get();
      const stores = snapshot.docs.map((doc) => {
        const data = doc.data() as Store;
        return {
          id: doc.id,
          nom: data.nom || 'Unnamed Store',
          categorie: data.categorie || 'inconnu',
          articles: data.articles || [],
          localisation: data.localisation,
          horaires: data.horaires,
          contact: data.contact,
          promotions: data.promotions,
          dateCreation: data.dateCreation,
          dateMiseAJour: data.dateMiseAJour,
          createurId: this.userId,
        } as Store;
      });
      logger.info('Stores fetched successfully', { count: stores.length });
      return stores;
    } catch (error) {
      logger.error('Error fetching stores', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addStore(store: Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour' | 'createurId'>): Promise<string> {
    const newStore: Store = {
      ...store,
      id: generateId('Store'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      nom: store.nom || 'Unnamed Store',
      categorie: store.categorie || 'inconnu',
      articles: store.articles || [],
    };
    return this.addDocument('stores', newStore, validateStore);
  }

  async updateStore(storeId: string, data: Partial<Store>): Promise<void> {
    await this.updateDocument('stores', storeId, data, validateStore);
  }

  async deleteStore(storeId: string): Promise<boolean> {
    return this.deleteDocument('stores', storeId);
  }

  listenToStores(onData: (data: Store[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('stores', onData, onError);
  }

  async getStoreItems(storeId: string): Promise<StoreItem[]> {
    try {
      const snapshot = await this.getSubCollectionRef('stores', storeId, 'storeItems').get();
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), storeId } as StoreItem));
      logger.info('Store items fetched', { count: items.length, storeId });
      return items;
    } catch (error) {
      logger.error('Error fetching store items', { error: getErrorMessage(error), storeId });
      throw error;
    }
  }

  async addStoreItem(storeId: string, item: Omit<StoreItem, 'id' | 'dateMiseAJour' | 'storeId'>): Promise<string> {
    const newItem: StoreItem = {
      ...item,
      id: generateId('StoreItem'),
      dateMiseAJour: formatDateForFirestore(new Date()),
      storeId,
    };
    return this.addDocument('stores', newItem, validateStoreItem, storeId, 'storeItems');
  }

  async updateStoreItem(storeId: string, itemId: string, data: Partial<StoreItem>): Promise<void> {
    await this.updateDocument('stores', itemId, data, validateStoreItem, storeId, 'storeItems');
  }

  async deleteStoreItem(storeId: string, itemId: string): Promise<boolean> {
    return this.deleteDocument('stores', itemId, storeId, 'storeItems');
  }

  listenToStoreItems(storeId: string, onData: (data: StoreItem[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('stores', onData, onError, undefined, storeId, 'storeItems');
  }

  async getHistoriqueRepas(memberId?: string): Promise<HistoriqueRepas[]> {
    try {
      const baseQuery = this.getCollectionRef('historiqueRepas');
      const queryRef = memberId ? baseQuery.where('memberId', '==', memberId) : baseQuery;
      const snapshot = await queryRef.get();
      const historiqueRepas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HistoriqueRepas));
      logger.info('Meal history fetched', { count: historiqueRepas.length, memberId: memberId || 'all' });
      return historiqueRepas;
    } catch (error) {
      logger.error('Error fetching meal history', { error: getErrorMessage(error), memberId });
      throw error;
    }
  }

  async addHistoriqueRepas(historique: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>): Promise<string> {
    const newHistorique: HistoriqueRepas = {
      ...historique,
      id: generateId('Historique'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
    };
    return this.addDocument('historiqueRepas', newHistorique, validateHistoriqueRepas);
  }

  async updateHistoriqueRepas(historiqueId: string, data: Partial<HistoriqueRepas>): Promise<void> {
    await this.updateDocument('historiqueRepas', historiqueId, data, validateHistoriqueRepas);
  }

  async deleteHistoriqueRepas(historiqueId: string): Promise<boolean> {
    return this.deleteDocument('historiqueRepas', historiqueId);
  }

  listenToHistoriqueRepas(
    onData: (data: HistoriqueRepas[]) => void,
    onError: (error: Error) => void,
    memberId?: string
  ): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>) =>
      memberId ? ref.where('memberId', '==', memberId) : ref;
    return this.listenToDocuments('historiqueRepas', onData, onError, queryFn);
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const snapshot = await this.getCollectionRef('conversations').orderBy('date', 'desc').get();
      const conversations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Conversation, 'messages'>,
        messages: [],
      }));
      logger.info('Conversations fetched', { count: conversations.length });
      return conversations;
    } catch (error) {
      logger.error('Error fetching conversations', { error: getErrorMessage(error) });
      throw error;
    }
  }

  async addConversation(conversation: Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages'>): Promise<string> {
    const newConversation: Conversation = {
      ...conversation,
      id: generateId('Conversation'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      messages: [],
      userId: this.userId,
    };
    return this.addDocument('conversations', newConversation);
  }

  async updateConversation(conversationId: string, data: Partial<Omit<Conversation, 'messages'>>): Promise<void> {
    await this.updateDocument('conversations', conversationId, data);
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    logger.warn(
      `Deleting conversation ${conversationId}. Associated AI Interactions in subcollection will NOT be automatically deleted.`
    );
    return this.deleteDocument('conversations', conversationId);
  }

  listenToConversations(onData: (data: Conversation[]) => void, onError: (error: Error) => void): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>) => ref.orderBy('date', 'desc');
    return this.listenToDocuments('conversations', onData, onError, queryFn);
  }

  async getAiInteractionsForConversation(conversationId: string): Promise<AiInteraction[]> {
    try {
      const snapshot = await this.getSubCollectionRef('conversations', conversationId, 'aiInteractions').orderBy('timestamp').get();
      const interactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AiInteraction));
      logger.info('AI interactions fetched', { count: interactions.length, conversationId });
      return interactions;
    } catch (error) {
      logger.error('Error fetching AI interactions', { error: getErrorMessage(error), conversationId });
      throw error;
    }
  }

  async addAiInteractionToConversation(
    conversationId: string,
    interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour' | 'conversationId'>
  ): Promise<string> {
    try {
      const newInteraction: AiInteraction = {
        ...interaction,
        id: generateId('AIInteraction'),
        dateCreation: formatDateForFirestore(new Date()),
        dateMiseAJour: formatDateForFirestore(new Date()),
        conversationId,
      };

      const interactionId = await this.addDocument('conversations', newInteraction, undefined, conversationId, 'aiInteractions');

      // Log spécifique selon le type d'interaction
      switch (newInteraction.type) {
        case 'text':
          logger.info('AI text interaction added', {
            interactionId,
            conversationId,
            message: (newInteraction.content as { type: 'text'; message: string }).message,
            isUser: newInteraction.isUser,
          });
          break;
        case 'json':
          logger.info('AI JSON interaction added', {
            interactionId,
            conversationId,
            dataKeys: Object.keys((newInteraction.content as { type: 'json'; data: object }).data),
            isUser: newInteraction.isUser,
          });
          break;
        case 'image':
          logger.info('AI image interaction added', {
            interactionId,
            conversationId,
            uri: (newInteraction.content as { type: 'image'; uri: string; mimeType: string }).uri,
            mimeType: (newInteraction.content as { type: 'image'; uri: string; mimeType: string }).mimeType,
            isUser: newInteraction.isUser,
          });
          break;
        case 'menu_suggestion':
          logger.info('AI menu suggestion interaction added', {
            interactionId,
            conversationId,
            menu: (newInteraction.content as MenuSuggestionContent).menu,
            recipeCount: (newInteraction.content as MenuSuggestionContent).recipes?.length,
            isUser: newInteraction.isUser,
          });
          break;
        case 'shopping_list_suggestion':
          logger.info('AI shopping list suggestion interaction added', {
            interactionId,
            conversationId,
            listId: (newInteraction.content as { type: 'shopping_list_suggestion'; listId: string; items: any[] }).listId,
            itemCount: (newInteraction.content as { type: 'shopping_list_suggestion'; listId: string; items: any[] }).items.length,
            isUser: newInteraction.isUser,
          });
          break;
        case 'recipe_analysis':
          logger.info('AI recipe analysis interaction added', {
            interactionId,
            conversationId,
            recipeId: (newInteraction.content as { type: 'recipe_analysis'; recipeId: string; analysis: any }).recipeId,
            calories: (newInteraction.content as { type: 'recipe_analysis'; recipeId: string; analysis: any }).analysis.calories,
            isUser: newInteraction.isUser,
          });
          break;
        case 'recipe_suggestion':
          logger.info('AI recipe suggestion interaction added', {
            interactionId,
            conversationId,
            recipeId: (newInteraction.content as { type: 'recipe_suggestion'; recipeId: string; name: string }).recipeId,
            name: (newInteraction.content as { type: 'recipe_suggestion'; recipeId: string; name: string }).name,
            isUser: newInteraction.isUser,
          });
          break;
        case 'tool_use':
          logger.info('AI tool use interaction added', {
            interactionId,
            conversationId,
            toolName: (newInteraction.content as { type: 'tool_use'; toolName: string; parameters: object }).toolName,
            parameterKeys: Object.keys((newInteraction.content as { type: 'tool_use'; toolName: string; parameters: object }).parameters),
            isUser: newInteraction.isUser,
          });
          break;
        case 'tool_response':
          logger.info('AI tool response interaction added', {
            interactionId,
            conversationId,
            toolName: (newInteraction.content as { type: 'tool_response'; toolName: string; result: object }).toolName,
            resultKeys: Object.keys((newInteraction.content as { type: 'tool_response'; toolName: string; result: object }).result),
            isUser: newInteraction.isUser,
          });
          break;
        case 'error':
          logger.warn('AI error interaction added', {
            interactionId,
            conversationId,
            message: (newInteraction.content as { type: 'error'; message: string; code?: string }).message,
            code: (newInteraction.content as { type: 'error'; message: string; code?: string }).code,
            isUser: newInteraction.isUser,
          });
          break;
      }

      return interactionId;
    } catch (error) {
      logger.error('Error adding AI interaction', { error: getErrorMessage(error), conversationId, type: interaction.type });
      throw error;
    }
  }

  async updateAiInteractionInConversation(
    conversationId: string,
    interactionId: string,
    data: Partial<AiInteraction>
  ): Promise<void> {
    try {
      await this.updateDocument('conversations', interactionId, data, undefined, conversationId, 'aiInteractions');
      logger.info('AI interaction updated', {
        interactionId,
        conversationId,
        updatedFields: Object.keys(data),
        type: data.type || 'unknown',
      });
    } catch (error) {
      logger.error('Error updating AI interaction', { error: getErrorMessage(error), interactionId, conversationId });
      throw error;
    }
  }

  async deleteAiInteractionFromConversation(conversationId: string, interactionId: string): Promise<boolean> {
    try {
      const result = await this.deleteDocument('conversations', interactionId, conversationId, 'aiInteractions');
      logger.info('AI interaction deleted', { interactionId, conversationId });
      return result;
    } catch (error) {
      logger.error('Error deleting AI interaction', { error: getErrorMessage(error), interactionId, conversationId });
      throw error;
    }
  }

  listenToAiInteractionsForConversation(
    conversationId: string,
    onData: (data: AiInteraction[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>) => ref.orderBy('timestamp');
    return this.listenToDocuments('conversations', (data: AiInteraction[]) => {
      const typeCounts = data.reduce((acc, interaction) => {
        acc[interaction.type] = (acc[interaction.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      logger.info('AI interactions received', { conversationId, count: data.length, typeCounts });
      onData(data);
    }, onError, queryFn, conversationId, 'aiInteractions');
  }
}
