import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@react-native-firebase/auth';

/**
 * Fonction de création de compte
 */
export const signUp = async (email: string, password: string) => {
  try {
    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
    throw error;
  }
};

/**
 * Fonction de connexion
 */
export const login = async (email: string, password: string) => {
  try {
    const authInstance = getAuth();
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw error;
  }
};