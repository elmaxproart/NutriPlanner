import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/FirestoreService';
import { Menu, Ingredient, MembreFamille } from '../constants/entities';
import { useAuth } from './useAuth';

export const useFirestore = () => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [familyMembers, setFamilyMembers] = useState<MembreFamille[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchMenus = useCallback(async () => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      const fetchedMenus = await service.getMenus();
      setMenus(fetchedMenus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des menus');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchIngredients = useCallback(async () => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      const fetchedIngredients = await service.getIngredients();
      setIngredients(fetchedIngredients);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des ingrédients');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFamilyMembers = useCallback(async () => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      const fetchedMembers = await service.getFamilyMembers();
      setFamilyMembers(fetchedMembers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des membres de la famille');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addMenu = async (menu: Omit<Menu, 'id' | 'createurId' | 'dateCreation'>) => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      await service.addMenu({ ...menu, createurId: userId, dateCreation: new Date().toISOString() });
      await fetchMenus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ajout du menu');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = async (ingredient: Omit<Ingredient, 'id' | 'createurId' | 'dateCreation'>) => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      await service.addIngredient({ ...ingredient, createurId: userId, dateCreation: new Date().toISOString() });
      await fetchIngredients();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ajout de l’ingrédient');
    } finally {
      setLoading(false);
    }
  };

  const addFamilyMember = async (member: Omit<MembreFamille, 'id' | 'userId' | 'familyId'>) => {
    if (!userId) {return;}
    setLoading(true);
    try {
      const service = new FirestoreService(userId);
      await service.addFamilyMember({ ...member, userId, familyId: userId });
      await fetchFamilyMembers();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ajout du membre de la famille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchIngredients();
    fetchFamilyMembers();
  }, [fetchFamilyMembers, fetchIngredients, fetchMenus, userId]);

  return {
    menus,
    ingredients,
    familyMembers,
    loading,
    error,
    fetchMenus,
    fetchIngredients,
    fetchFamilyMembers,
    addMenu,
    addIngredient,
    addFamilyMember,
  };
};
