import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { MembreFamille } from '../constants/entities';
import { validateMembreFamille } from '../utils/dataValidators';
import { logger } from '../utils/logger';

export const useFamilyData = (userId: string, familyId: string) => {
  const [familyMembers, setFamilyMembers] = useState<MembreFamille[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyMembers = useCallback(async () => {
    if (!userId || !familyId) {return;}
    setLoading(true);
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const members = await firestoreService.getFamilyMembers();
      setFamilyMembers(members);
      logger.info('Family members fetched', { count: members.length });
    } catch (err: any) {
      logger.error('Error fetching family members', { error: err.message });
      setError(err.message || 'Erreur lors de la récupération des membres');
    } finally {
      setLoading(false);
    }
  }, [userId, familyId]);

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const addFamilyMember = async (member: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    const errors = validateMembreFamille(member);
    if (errors.length > 0) {
      logger.error('Validation failed for family member', { errors });
      setError(`Validation failed: ${errors.join(', ')}`);
      return null;
    }
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      const memberId = await firestoreService.addFamilyMember(member);
      await fetchFamilyMembers();
      logger.info('Family member added', { memberId });
      return memberId;
    } catch (err: any) {
      logger.error('Error adding family member', { error: err.message });
      setError(err.message || 'Erreur lors de l’ajout du membre');
      return null;
    }
  };

  const updateFamilyMember = async (memberId: string, updates: Partial<MembreFamille>) => {
    try {
      const firestoreService = new FirestoreService(userId, familyId);
      await firestoreService.updateFamilyMember(memberId, updates);
      await fetchFamilyMembers();
      logger.info('Family member updated', { memberId });
    } catch (err: any) {
      logger.error('Error updating family member', { error: err.message });
      setError(err.message || 'Erreur lors de la mise à jour du membre');
    }
  };

  return { familyMembers, loading, error, fetchFamilyMembers, addFamilyMember, updateFamilyMember };
};
