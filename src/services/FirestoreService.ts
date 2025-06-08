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

export class FirestoreService {
  private userId: string;
  private familyId: string;

  constructor(userId: string, familyId: string) {
    if (!userId || !familyId) {
      throw new Error('User ID and Family ID are required');
    }
    this.userId = userId;
    this.familyId = familyId;
  }

  private getCollectionRef(collectionName: string): FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData> {
    return firestore()
      .collection('users')
      .doc(this.userId)
      .collection('families')
      .doc(this.familyId)
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
    if (validator) {
      const errors = validator(data);
      if (errors.length > 0) {
        logger.error(`Validation failed for ${collectionName}`, { errors, data });
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
    }
    try {
      let ref: FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;
      if (parentDocId && subCollectionName) {
        ref = this.getSubCollectionRef(collectionName, parentDocId, subCollectionName);
      } else {
        ref = this.getCollectionRef(collectionName);
      }

      const newDocRef = await ref.add(data);
      logger.info(`Document added to ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''), { id: newDocRef.id, data });
      return newDocRef.id;
    } catch (error) {
      logger.error(`Error adding document to ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''), { error });
      throw new Error(`Failed to add document to ${collectionName}`);
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
    if (validator) {
      const errors = validator(data);
      if (errors.length > 0) {
        logger.error(`Validation failed for updating ${collectionName} ${docId}`, { errors, data });
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
    }
    try {
      let docRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      if (parentDocId && subCollectionName) {
        docRef = this.getSubCollectionRef(collectionName, parentDocId, subCollectionName).doc(docId);
      } else {
        docRef = this.getCollectionRef(collectionName).doc(docId);
      }

      await docRef.update({
        ...data,
        dateMiseAJour: formatDateForFirestore(new Date()),
      });
      logger.info(`Document ${docId} updated in ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''), { data });
    } catch (error) {
      logger.error(`Error updating document ${docId} in ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''), { error });
      throw new Error(`Failed to update document in ${collectionName}`);
    }
  }

  private async deleteDocument(
    collectionName: string,
    docId: string,
    parentDocId?: string,
    subCollectionName?: string
  ): Promise<boolean> {
    try {
      let docRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      if (parentDocId && subCollectionName) {
        docRef = this.getSubCollectionRef(collectionName, parentDocId, subCollectionName).doc(docId);
      } else {
        docRef = this.getCollectionRef(collectionName).doc(docId);
      }

      await docRef.delete();
      logger.info(`Document ${docId} deleted from ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''));
      return true;
    } catch (error) {
      logger.error(`Error deleting document ${docId} from ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''), { error });
      throw new Error(`Failed to delete document from ${collectionName}`);
    }
  }

  private listenToDocuments<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    onData: (data: T[]) => void,
    onError: (error: Error) => void,
    queryFn?: (ref: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>) => FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>,
    parentDocId?: string,
    subCollectionName?: string
  ): () => void {
    let queryRef: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>;
    if (parentDocId && subCollectionName) {
      queryRef = this.getSubCollectionRef(collectionName, parentDocId, subCollectionName);
    } else {
      queryRef = this.getCollectionRef(collectionName);
    }

    if (queryFn) {
      queryRef = queryFn(queryRef);
    }

    const unsubscribe = queryRef.onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as T[];
        onData(items);
      },
      error => {
        logger.error(`Error listening to ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : '') + `:, ${getErrorMessage(error)}`, { error });
        onError(error as Error);
      }
    );
    logger.info(`Started listening to ${collectionName}` + (parentDocId ? `/${parentDocId}/${subCollectionName}` : ''));
    return unsubscribe;
  }

  // --- Création de la famille avec validation et transaction ---
  async createFamily(familyId: string, familyName?: string): Promise<void> {
    const familyRef = firestore()
      .collection('users')
      .doc(this.userId)
      .collection('families')
      .doc(familyId);

    try {
      const familyDoc = await familyRef.get();
      if (familyDoc.exists()) {
        throw new Error('Une famille avec cet ID existe déjà.');
      }


      await firestore().runTransaction(async (transaction) => {
        const newFamilyData = {
          id: familyId,
          creatorId: this.userId,
          familyName: familyName || `Famille ${generateId('FamilyName')}`,
          dateCreation: formatDateForFirestore(new Date()),
          dateMiseAJour: formatDateForFirestore(new Date()),
          membersCount: 0,
          status: 'active',
        };
        transaction.set(familyRef, newFamilyData);
      });

      logger.info('Family created successfully', { familyId, creatorId: this.userId, familyName });
    } catch (error) {
      logger.error('Error creating family', { error: getErrorMessage(error), familyId });
      throw new Error(`Failed to create family: ${getErrorMessage(error)}`);
    }
  }

  // --- MembreFamille avec mise à jour de membersCount ---
  async getFamilyMembers(): Promise<MembreFamille[]> {
    try {
      const snapshot = await this.getCollectionRef('familyMembers').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, userId: this.userId } as MembreFamille));
    } catch (error) {
      logger.error('Error fetching family members', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch family members');
    }
  }

  async addFamilyMember(member: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newMember: MembreFamille = {
      ...member,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Family'),
      familyId: this.familyId,
      createurId: this.userId,
    };

    const familyRef = firestore()
      .collection('users')
      .doc(this.userId)
      .collection('families')
      .doc(this.familyId);

    try {
      // Utiliser une transaction pour ajouter le membre et incrémenter membersCount atomiquement
      const memberId = await firestore().runTransaction(async (transaction) => {
        const memberDocRef = this.getCollectionRef('familyMembers').doc();
        transaction.set(memberDocRef, newMember);

        const familyDoc = await transaction.get(familyRef);
        if (!familyDoc.exists) {
          throw new Error('La famille n\'existe pas.');
        }
        const currentCount = familyDoc.data()?.membersCount || 0;
        transaction.update(familyRef, { membersCount: currentCount + 1 });

        return memberDocRef.id;
      });

      await this.getCollectionRef('familyMembers').doc(memberId).get(); // Forcer la mise à jour du cache
      logger.info('Family member added', { memberId });
      return memberId;
    } catch (error) {
      logger.error('Error adding family member', { error: getErrorMessage(error) });
      throw new Error(`Failed to add family member: ${getErrorMessage(error)}`);
    }
  }

  async updateFamilyMember(memberId: string, data: Partial<MembreFamille>): Promise<void> {
    return this.updateDocument('familyMembers', memberId, data, validateMembreFamille);
  }

  async deleteFamilyMember(memberId: string): Promise<boolean> {
    const familyRef = firestore()
      .collection('users')
      .doc(this.userId)
      .collection('families')
      .doc(this.familyId);

    try {
      // Utiliser une transaction pour supprimer le membre et décrémenter membersCount
      await firestore().runTransaction(async (transaction) => {
        const memberDocRef = this.getCollectionRef('familyMembers').doc(memberId);
        const memberDoc = await transaction.get(memberDocRef);
        if (!memberDoc.exists) {
          throw new Error('Le membre n\'existe pas.');
        }
        transaction.delete(memberDocRef);

        const familyDoc = await transaction.get(familyRef);
        if (!familyDoc.exists) {
          throw new Error('La famille n\'existe pas.');
        }
        const currentCount = familyDoc.data()?.membersCount || 0;
        if (currentCount > 0) {
          transaction.update(familyRef, { membersCount: currentCount - 1 });
        }
      });

      logger.info(`Family member ${memberId} deleted`);
      return true;
    } catch (error) {
      logger.error(`Error deleting family member ${memberId}`, { error: getErrorMessage(error) });
      throw new Error(`Failed to delete family member: ${getErrorMessage(error)}`);
    }
  }

  listenToFamilyMembers(onData: (data: MembreFamille[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('familyMembers', onData, onError);
  }

  // --- Ingrédients ---
  async getIngredients(): Promise<Ingredient[]> {
    try {
      const snapshot = await this.getCollectionRef('ingredients').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as Ingredient));
    } catch (error) {
      logger.error('Error fetching ingredients', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch ingredients');
    }
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newIngredient: Ingredient = {
      ...ingredient,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Ingredient'),
      familyId: this.familyId,
      createurId: this.userId,
    };
    return this.addDocument('ingredients', newIngredient, validateIngredient);
  }

  async updateIngredient(ingredientId: string, data: Partial<Ingredient>): Promise<void> {
    return this.updateDocument('ingredients', ingredientId, data, validateIngredient);
  }

  async deleteIngredient(ingredientId: string): Promise<boolean> {
    return this.deleteDocument('ingredients', ingredientId);
  }

  listenToIngredients(onData: (data: Ingredient[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('ingredients', onData, onError);
  }

  // --- Recettes ---
  async getRecipes(): Promise<Recette[]> {
    try {
      const snapshot = await this.getCollectionRef('recipes').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as Recette));
    } catch (error) {
      logger.error('Error fetching recipes', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch recipes');
    }
  }

  async addRecipe(recipe: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newRecipe: Recette = {
      ...recipe,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Recette'),
      familyId: this.familyId,
      createurId: this.userId,
    };
    return this.addDocument('recipes', newRecipe, validateRecette);
  }

  async updateRecipe(recipeId: string, data: Partial<Recette>): Promise<void> {
    return this.updateDocument('recipes', recipeId, data, validateRecette);
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    return this.deleteDocument('recipes', recipeId);
  }

  listenToRecipes(onData: (data: Recette[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('recipes', onData, onError);
  }

  // --- Menus ---
  async getMenus(): Promise<Menu[]> {
    try {
      const snapshot = await this.getCollectionRef('menus').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as Menu));
    } catch (error) {
      logger.error('Error fetching menus', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch menus');
    }
  }

  async addMenu(menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newMenu: Menu = {
      ...menu,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Menu'),
      familyId: this.familyId,
      createurId: this.userId,
    };
    return this.addDocument('menus', newMenu, validateMenu);
  }

  async updateMenu(menuId: string, data: Partial<Menu>): Promise<void> {
    return this.updateDocument('menus', menuId, data, validateMenu);
  }

  async deleteMenu(menuId: string): Promise<boolean> {
    return this.deleteDocument('menus', menuId);
  }

  listenToMenus(onData: (data: Menu[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('menus', onData, onError);
  }

  // --- Listes de Courses ---
  async getShoppingLists(): Promise<ListeCourses[]> {
    try {
      const snapshot = await this.getCollectionRef('shoppingLists').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as ListeCourses));
    } catch (error) {
      logger.error('Error fetching shopping lists', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch shopping lists');
    }
  }

  async addShoppingList(list: Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newList: ListeCourses = {
      ...list,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Shopping'),
      familyId: this.familyId,
      createurId: this.userId,
    };
    return this.addDocument('shoppingLists', newList, validateListeCourses);
  }

  async updateShoppingList(listId: string, data: Partial<ListeCourses>): Promise<void> {
    return this.updateDocument('shoppingLists', listId, data, validateListeCourses);
  }

  async deleteShoppingList(listId: string): Promise<boolean> {
    return this.deleteDocument('shoppingLists', listId);
  }

  listenToShoppingLists(onData: (data: ListeCourses[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('shoppingLists', onData, onError);
  }

  // --- Budgets ---
  async getBudgets(): Promise<Budget[]> {
    try {
      const snapshot = await this.getCollectionRef('budgets').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as Budget));
    } catch (error) {
      logger.error('Error fetching budgets', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch budgets');
    }
  }

  async addBudget(budget: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newBudget: Budget = {
      ...budget,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Budget'),
      familyId: this.familyId,
      createurId: this.userId,
    };
    return this.addDocument('budgets', newBudget, validateBudget);
  }

  async updateBudget(budgetId: string, data: Partial<Budget>): Promise<void> {
    return this.updateDocument('budgets', budgetId, data, validateBudget);
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    return this.deleteDocument('budgets', budgetId);
  }

  listenToBudgets(onData: (data: Budget[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('budgets', onData, onError);
  }

  // --- Magasins (Stores) ---
  async getStores(): Promise<Store[]> {
    try {
      const snapshot = await this.getCollectionRef('stores').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), familyId: this.familyId, createurId: this.userId } as unknown as Store));
    } catch (error) {
      logger.error('Error fetching stores', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch stores');
    }
  }

  async addStore(store: Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour' | 'familyId' | 'createurId'>): Promise<string> {
    const newStore: Store = {
      ...store,
      id: generateId('Store'),
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
    };
    return this.addDocument('stores', newStore, validateStore);
  }

  async updateStore(storeId: string, data: Partial<Store>): Promise<void> {
    return this.updateDocument('stores', storeId, data, validateStore);
  }

  async deleteStore(storeId: string): Promise<boolean> {
    return this.deleteDocument('stores', storeId);
  }

  listenToStores(onData: (data: Store[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('stores', onData, onError);
  }

  // --- Articles de Magasin (Store Items) ---
  async getStoreItems(storeId: string): Promise<StoreItem[]> {
    try {
      const snapshot = await this.getSubCollectionRef('stores', storeId, 'storeItems').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), storeId: storeId } as StoreItem));
    } catch (error) {
      logger.error(`Error fetching store items for store ${storeId}`, { error: getErrorMessage(error) });
      throw new Error(`Failed to fetch store items for store ${storeId}`);
    }
  }

  async addStoreItem(storeId: string, item: Omit<StoreItem, 'id' | 'dateMiseAJour' | 'storeId'>): Promise<string> {
    const newItem: StoreItem = {
      ...item,
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('StoreItem'),
      storeId: storeId,
    };
    return this.addDocument('stores', newItem, validateStoreItem, storeId, 'storeItems');
  }

  async updateStoreItem(storeId: string, itemId: string, data: Partial<StoreItem>): Promise<void> {
    return this.updateDocument('stores', itemId, data, validateStoreItem, storeId, 'storeItems');
  }

  async deleteStoreItem(storeId: string, itemId: string): Promise<boolean> {
    return this.deleteDocument('stores', itemId, storeId, 'storeItems');
  }

  listenToStoreItems(storeId: string, onData: (data: StoreItem[]) => void, onError: (error: Error) => void): () => void {
    return this.listenToDocuments('stores', onData, onError, undefined, storeId, 'storeItems');
  }

  // --- Historique des Repas ---
  async getHistoriqueRepas(memberId?: string): Promise<HistoriqueRepas[]> {
    try {
      const baseQuery = this.getCollectionRef('historiqueRepas');
      const queryRef = memberId ? baseQuery.where('memberId', '==', memberId) : baseQuery;
      const snapshot = await queryRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoriqueRepas));
    } catch (error) {
      logger.error('Error fetching meal history', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch meal history');
    }
  }

  async addHistoriqueRepas(historique: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'>): Promise<string> {
    const newHistorique: HistoriqueRepas = {
      ...historique,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Historique'),
    };
    return this.addDocument('historiqueRepas', newHistorique, validateHistoriqueRepas);
  }

  async updateHistoriqueRepas(historiqueId: string, data: Partial<HistoriqueRepas>): Promise<void> {
    return this.updateDocument('historiqueRepas', historiqueId, data, validateHistoriqueRepas);
  }

  async deleteHistoriqueRepas(historiqueId: string): Promise<boolean> {
    return this.deleteDocument('historiqueRepas', historiqueId);
  }

  listenToHistoriqueRepas(onData: (data: HistoriqueRepas[]) => void, onError: (error: Error) => void, memberId?: string): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query) => (memberId ? ref.where('memberId', '==', memberId) : ref);
    return this.listenToDocuments('historiqueRepas', onData, onError, queryFn);
  }

  // --- Conversations ---
  async getConversations(): Promise<Conversation[]> {
    try {
      const snapshot = await this.getCollectionRef('conversations').orderBy('date', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Conversation, 'messages'>, messages: [] }));
    } catch (error) {
      logger.error('Error fetching conversations', { error: getErrorMessage(error) });
      throw new Error('Failed to fetch conversations');
    }
  }

  async addConversation(conversation: Omit<Conversation, 'id' | 'dateCreation' | 'dateMiseAJour' | 'messages'>): Promise<string> {
    const newConversation: Conversation = {
      ...conversation,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('Conv'),
      messages: [],
      familyId: this.familyId,
      userId: this.userId,
    };
    return this.addDocument('conversations', newConversation);
  }

  async updateConversation(conversationId: string, data: Partial<Omit<Conversation, 'messages'>>): Promise<void> {
    return this.updateDocument('conversations', conversationId, data);
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    logger.warn(`Deleting conversation ${conversationId}. Note: Associated AI Interactions in subcollection will NOT be automatically deleted.`);
    return this.deleteDocument('conversations', conversationId);
  }

  listenToConversations(onData: (data: Conversation[]) => void, onError: (error: Error) => void): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query) => ref.orderBy('date', 'desc');
    return this.listenToDocuments('conversations', onData, onError, queryFn);
  }

  // --- AI Interactions ---
  async getAiInteractionsForConversation(conversationId: string): Promise<AiInteraction[]> {
    try {
      const snapshot = await this.getSubCollectionRef('conversations', conversationId, 'aiInteractions').orderBy('timestamp').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiInteraction));
    } catch (error) {
      logger.error(`Error fetching AI interactions for conversation ${conversationId}`, { error: getErrorMessage(error) });
      throw new Error(`Failed to fetch AI interactions for conversation ${conversationId}`);
    }
  }

  async addAiInteractionToConversation(conversationId: string, interaction: Omit<AiInteraction, 'id' | 'dateCreation' | 'dateMiseAJour' | 'conversationId'>): Promise<string> {
    const newInteraction: AiInteraction = {
      ...interaction,
      dateCreation: formatDateForFirestore(new Date()),
      dateMiseAJour: formatDateForFirestore(new Date()),
      id: generateId('AIInt'),
      conversationId: conversationId,
    };
    return this.addDocument('conversations', newInteraction, undefined, conversationId, 'aiInteractions');
  }

  async updateAiInteractionInConversation(conversationId: string, interactionId: string, data: Partial<AiInteraction>): Promise<void> {
    return this.updateDocument('conversations', interactionId, data, undefined, conversationId, 'aiInteractions');
  }

  async deleteAiInteractionFromConversation(conversationId: string, interactionId: string): Promise<boolean> {
    return this.deleteDocument('conversations', interactionId, conversationId, 'aiInteractions');
  }

  listenToAiInteractionsForConversation(conversationId: string, onData: (data: AiInteraction[]) => void, onError: (error: Error) => void): () => void {
    const queryFn = (ref: FirebaseFirestoreTypes.Query) => ref.orderBy('timestamp');
    return this.listenToDocuments('conversations', onData, onError, queryFn, conversationId, 'aiInteractions');
  }
}
