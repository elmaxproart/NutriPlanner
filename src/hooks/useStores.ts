import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { Store, StoreItem } from '../constants/entities';
import { validateStore, validateStoreItem } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, getCollection, addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();

  const fetchStores = useCallback(async () => {
    if (!firestoreService) {
      setError('Service Firestore non initialisé');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCollection<Store>('Stores');
      setStores(data);
      logger.info('Magasins récupérés', { count: data.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération des magasins';
      logger.error('Erreur lors de la récupération des magasins', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [firestoreService, getCollection]);

  const fetchStoreItems = useCallback(
    async (storeId: string) => {
      if (!firestoreService || !storeId) {
        setError('Service Firestore non initialisé ou storeId manquant');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getCollection<StoreItem>('StoreItems', storeId);
        setStoreItems(data);
        logger.info('Articles de magasin récupérés', { storeId, count: data.length });
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la récupération des articles';
        logger.error('Erreur lors de la récupération des articles', { error: errorMsg });
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, getCollection]
  );

  useEffect(() => {
    if (!firestoreLoading && !firestoreError) {
      fetchStores();
    }
  }, [fetchStores, firestoreLoading, firestoreError]);

  const addStore = useCallback(
    async (store: Omit<Store, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!firestoreService) {
        setError('Service Firestore non initialisé');
        return null;
      }

      const errors = validateStore(store);
      if (errors.length > 0) {
        const errorMsg = `Validation failed: ${errors.join(', ')}`;
        logger.error('Validation failed pour magasin', { errors });
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const storeId = await addEntity('Stores', store);
        if (storeId) {
          await fetchStores();
          logger.info('Magasin ajouté', { storeId });
        }
        return storeId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout du magasin';
        logger.error('Erreur lors de l’ajout du magasin', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, addEntity, fetchStores]
  );

  const addStoreItem = useCallback(
    async (storeId: string, item: Omit<StoreItem, 'id' | 'dateMiseAJour'>) => {
      if (!firestoreService || !storeId) {
        setError('Service Firestore non initialisé ou storeId manquant');
        return null;
      }

      const errors = validateStoreItem(item);
      if (errors.length > 0) {
        const errorMsg = `Validation failed: ${errors.join(', ')}`;
        logger.error('Validation failed pour article de magasin', { errors });
        setError(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const itemId = await addEntity('StoreItems', { storeId, item });
        if (itemId) {
          await fetchStoreItems(storeId);
          logger.info('Article de magasin ajouté', { itemId });
        }
        return itemId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout de l’article';
        logger.error('Erreur lors de l’ajout de l’article', { error: errorMsg });
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, addEntity, fetchStoreItems]
  );

  return {
    stores,
    storeItems,
    loading: loading || firestoreLoading,
    error: error || firestoreError,
    fetchStores,
    fetchStoreItems,
    addStore,
    addStoreItem,
  };
};
