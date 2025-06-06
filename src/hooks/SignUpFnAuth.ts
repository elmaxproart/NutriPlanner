import { useState, useCallback } from 'react';
import auth from '@react-native-firebase/auth';
import { logger } from '../utils/logger';
import { generateId, isValidEmail } from '../utils/helpers';
import type { MembreFamille } from '../constants/entities';

interface AuthResult {
  userId: string;
  familyId: string;
  member?: MembreFamille;
}

export const useSignUpFnAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (email: string, password: string, initialData: Partial<MembreFamille>): Promise<AuthResult | null> => {
    setLoading(true);
    setError(null);

    if (!isValidEmail(email)) {
      setError('Email invalide');
      logger.error('Invalid email provided', { email });
      setLoading(false);
      return null;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      logger.error('Password too short', { email });
      setLoading(false);
      return null;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      const familyId = generateId('family');
      const member: MembreFamille = {
        id: userId,
        userId,
        familyId,
        createurId: userId,
        dateCreation: new Date().toISOString(),
        nom: initialData?.nom || '',
        prenom: initialData?.prenom || '',
        dateNaissance: initialData?.dateNaissance || '',
        genre: initialData?.genre || 'autre',
        role: initialData?.role || 'parent',
        preferencesAlimentaires: initialData?.preferencesAlimentaires || [],
        allergies: initialData?.allergies || [],
        restrictionsMedicales: initialData?.restrictionsMedicales || [],
        historiqueRepas: [],
        niveauAcces: 'admin',
        contactUrgence: {
          nom: initialData?.contactUrgence?.nom || '',
          telephone: initialData?.contactUrgence?.telephone || '',
        },
        aiPreferences: {
          niveauEpices: initialData?.aiPreferences?.niveauEpices || 0,
          apportCaloriqueCible: initialData?.aiPreferences?.apportCaloriqueCible || 0,
          cuisinesPreferees: initialData?.aiPreferences?.cuisinesPreferees || [],
        },
      };
      logger.info('User signed up successfully', { userId, familyId });
      return { userId, familyId, member };
    } catch (err: any) {
      logger.error('Sign up failed', { error: err.message });
      setError(err.message || 'Erreur lors de la création du compte');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    if (!isValidEmail(email)) {
      setError('Email invalide');
      logger.error('Invalid email provided', { email });
      setLoading(false);
      return null;
    }

    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      logger.info('User logged in successfully', { userId });
      return userId;
    } catch (err: any) {
      logger.error('Login failed', { error: err.message });
      setError(err.message || 'Erreur lors de la connexion');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signUp, login, loading, error };
};
