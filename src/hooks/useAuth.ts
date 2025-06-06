import { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        logger.info('User authenticated', { userId: user.uid });
      } else {
        setUserId(null);
        logger.info('No user authenticated');
      }
      setLoading(false);
    });
    return subscriber;
  }, []);

  const signOut = async () => {
    try {
      await auth().signOut();
      setUserId(null);
      logger.info('User signed out successfully');
    } catch (err: any) {
      logger.error('Sign out failed', { error: err.message });
      setError(err.message || 'Erreur lors de la déconnexion');
    }
  };

  return { userId, loading, error, signOut };
};
