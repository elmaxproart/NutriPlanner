import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import { MembreFamille } from '../constants/entities';
import { validateMembreFamille } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useFamilyData = () => {
  const { userId } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<MembreFamille[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firestoreService, addEntity, updateEntity, deleteEntity, loading: firestoreLoading, error: firestoreError } = useFirestore();

  useEffect(() => {
    if (!firestoreService || !userId) {
      setLoading(false);
      setError(firestoreError || 'Service Firestore non initialisé ou utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = firestoreService.listenToFamilyMembers(
      (members) => {
        setFamilyMembers(members);
        setLoading(false);
        logger.info('Family members updated', { count: members.length });
      },
      (err) => {
        const errorMsg = err.message || 'Erreur lors de la récupération des membres';
        setError(errorMsg);
        setLoading(false);
        logger.error('Error listening to family members', { error: errorMsg });
      }
    );

    return () => {
      unsubscribe();
      logger.info('Unsubscribed from family members listener');
    };
  }, [firestoreService, userId, firestoreError]);

  const addFamilyMember = useCallback(
    async (member: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return null;
      }

      const errors = validateMembreFamille({ ...member, id: '', dateCreation: '', dateMiseAJour: '' });
      if (errors.length > 0) {
        const errorMsg = `Validation failed: ${errors.join(', ')}`;
        setError(errorMsg);
        logger.error('Validation failed for family member', { errors });
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const memberId = await addEntity('FamilyMembers', { ...member, userId });
        if (memberId) {
          logger.info('Family member added', { memberId });
        }
        return memberId;
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de l’ajout du membre';
        setError(errorMsg);
        logger.error('Error adding family member', { error: errorMsg });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId, addEntity]
  );

  const fetchFamilyMembers = useCallback(async () => {
    if (!firestoreService || !userId) {
      setError('Service Firestore non initialisé ou utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const members = await firestoreService.getFamilyMembersForCurrentUser();
      setFamilyMembers(members);
      logger.info('Family members fetched', { count: members.length });
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de la récupération des membres';
      setError(errorMsg);
      logger.error('Error fetching family members', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  }, [firestoreService, userId]);

  const updateFamilyMember = useCallback(
    async (memberId: string, updates: Partial<MembreFamille>) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await updateEntity('FamilyMembers', memberId, updates);
        logger.info('Family member updated', { memberId });
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la mise à jour du membre';
        setError(errorMsg);
        logger.error('Error updating family member', { error: errorMsg });
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId, updateEntity]
  );

  const deleteFamilyMember = useCallback(
    async (memberId: string) => {
      if (!firestoreService || !userId) {
        setError('Service Firestore non initialisé ou utilisateur non connecté');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await deleteEntity('FamilyMembers', memberId);
        logger.info('Family member deleted', { memberId });
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur lors de la suppression du membre';
        setError(errorMsg);
        logger.error('Error deleting family member', { error: errorMsg });
      } finally {
        setLoading(false);
      }
    },
    [firestoreService, userId, deleteEntity]
  );

  return {
    familyMembers,
    loading: loading || firestoreLoading,
    error: error || firestoreError,
    addFamilyMember,
    fetchFamilyMembers,
    updateFamilyMember,
    deleteFamilyMember,
  };
};
