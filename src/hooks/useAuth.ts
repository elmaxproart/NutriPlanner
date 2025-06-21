import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, FirebaseAuthTypes} from '@react-native-firebase/auth';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [use, setUser] = useState<FirebaseAuthTypes.User  | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authInstance = getAuth();

    const subscriber = onAuthStateChanged(authInstance, user => {
      if (user) {
        setUserId(user.uid);
        setUser(user);
        logger.info('User authenticated', { userId: user.uid });
      } else {
        setUserId(null);
        setUser(null);
        logger.info('No user authenticated');
      }
      setLoading(false);
    });

    return subscriber;
  }, []);

  const signOut = async () => {
    try {
      const authInstance = getAuth();
      await firebaseSignOut(authInstance);
      setUserId(null);
      setUser(null);
      logger.info('User signed out successfully');
    } catch (err: any) {
      logger.error('Sign out failed', { error: err.message });
      setError(err.message || 'Erreur lors de la déconnexion');
    }
  };

  return { userId, use, loading, error, signOut };
};
