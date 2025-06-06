import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { Store, StoreItem } from '../constants/entities';
import { validateStore, validateStoreItem } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useStores = (userId: string, familyId: string) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getStores();
      setStores(data);
      logger.info('Stores fetched', { count: data.length });
    } catch (err: any) {
      logger.error('Error fetching stores', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des magasins');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  const fetchStoreItems = useCallback(async (storeId: string) => {
    if (!userId || !familyId || !storeId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const data = await firestoreService.getStoreItems(storeId);
      setStoreItems(data);
      logger.info('Store items fetched', { storeId, count: data.length });
    } catch (err: any) {
      logger.error('Error fetching store items', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des articles');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const addStore = async (store: Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateStore(store);
    if (errors.length > 0) {
      logger.error('Validation failed for store', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const storeId = await firestoreService.addStore(store);
      await fetchStores();
      logger.info('Store added', { storeId });
      return storeId;
    } catch (err: any) {
      logger.error('Error adding store', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout du magasin');
      return null;
    }
  };

  const addStoreItem = async (storeId: string, item: Omit<StoreItem, 'id' | 'dateMiseAJour'>) => {
    const errors = validateStoreItem(item);
    if (errors.length > 0) {
      logger.error('Validation failed for store item', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const itemId = await firestoreService.addStoreItem(storeId, item);
      await fetchStoreItems(storeId);
      logger.info('Store item added', { itemId });
      return itemId;
    } catch (err: any) {
      logger.error('Error adding store item', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout de l’article');
      return null;
    }
  };

  return { stores, storeItems, loading, error, fetchStores, fetchStoreItems, addStore, addStoreItem };
};
