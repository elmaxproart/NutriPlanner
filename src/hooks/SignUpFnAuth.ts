import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { isValidEmail } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger'; // Ensure this path is correct

/**
 * Registers a new user with email and password.
 * Stores the user's ID in AsyncStorage upon successful registration.
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A Promise that resolves with an object containing the new user's ID.
 * @throws An Error if validation fails or if there's an issue with Firebase authentication.
 */
export const signUp = async (email: string, password: string): Promise<{ id: string }> => {
  if (!isValidEmail(email)) {
    logger.warn('Sign-up failed: Invalid email format provided', { email });
    throw new Error('Email invalide');
  }

  try {
    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const userId = userCredential.user.uid;


    await AsyncStorage.setItem('userId', userId);
    logger.info('User signed up successfully', { userId, email });
    return { id: userId };
  } catch (error: any) {
    let errorMessage = 'Erreur lors de la création du compte';
    logger.error('Sign-up error', { code: error.code, message: error.message, email });

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Cet email est déjà utilisé.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Le format de l\'email est invalide.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Authenticates an existing user with email and password.
 * Stores the user's ID in AsyncStorage upon successful login.
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A Promise that resolves with the logged-in user's ID.
 * @throws An Error if validation fails or if there's an issue with Firebase authentication.
 */
export const login = async (email: string, password: string): Promise<string> => {
  if (!isValidEmail(email)) {
    logger.warn('Login failed: Invalid email format provided', { email });
    throw new Error('Email invalide');
  }

  try {
    const authInstance = getAuth(); // Get the auth instance
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const userId = userCredential.user.uid;

    // Store the userId to indicate a logged-in state.
    // The previous 'userToken' might be redundant if 'userId' suffices.
    await AsyncStorage.setItem('userId', userId);
    logger.info('User logged in successfully', { userId, email });
    return userId;
  } catch (error: any) {
    let errorMessage = 'Erreur de connexion';
    logger.error('Login error', { code: error.code, message: error.message, email });

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential': // This covers both user-not-found and wrong-password in newer Firebase versions
        errorMessage = 'Email ou mot de passe incorrect.';
        break;
      case 'auth/wrong-password': // Included for older Firebase SDK versions, though 'invalid-credential' is preferred.
        errorMessage = 'Mot de passe incorrect.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives de connexion, veuillez réessayer plus tard.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Logs out the currently authenticated user.
 * Clears the user's ID from AsyncStorage upon successful logout.
 *
 * @returns A Promise that resolves when the user is successfully logged out.
 * @throws An Error if there's an issue during logout.
 */
export const logout = async (): Promise<void> => {
  try {
    const authInstance = getAuth();
    await authInstance.signOut();
    await AsyncStorage.removeItem('userId'); // Clear userId on logout
    logger.info('User logged out successfully');
  } catch (error: any) {
    logger.error('Logout error', { code: error.code, message: error.message });
    throw new Error('Erreur lors de la déconnexion.');
  }
};
