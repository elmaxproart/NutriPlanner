import auth from '@react-native-firebase/auth';
import { isValidEmail } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const signUp = async (email: string, password: string): Promise<{ id: string }> => {
  if (!isValidEmail(email)) {
    throw new Error('Email invalide');
  }

  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;

    // Stockage sécurisé des informations
    await Promise.all([
      AsyncStorage.setItem('signupEmail', email),
      AsyncStorage.setItem('signupPassword', password),
      AsyncStorage.setItem('userId', userId),
    ]);

    return { id: userId };
  } catch (error: any) {
    let errorMessage = 'Erreur lors de la création du compte';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Cet email est déjà utilisé';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Format email invalide';
        break;
      case 'auth/weak-password':
        errorMessage = 'Le mot de passe doit faire au moins 6 caractères';
        break;
      default:
        console.error('Erreur inscription:', error);
        errorMessage = error.message || errorMessage;
    }

    throw new Error(errorMessage);
  }
};

export const login = async (email: string, password: string): Promise<string> => {
  if (!isValidEmail(email)) {
    throw new Error('Email invalide');
  }

  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;

    await AsyncStorage.setItem('userToken', userId);
    return userId;
  } catch (error: any) {
    let errorMessage = 'Erreur de connexion';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        errorMessage = 'Email ou mot de passe incorrect';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Mot de passe incorrect';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives, réessayez plus tard';
        break;
      default:
        console.error('Erreur connexion:', error);
        errorMessage = error.message || errorMessage;
    }

    throw new Error(errorMessage);
  }
};
