import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { RecipeForm } from '../components/forms/RecipeForm'; // RecipeForm must be updated to pass raw data
import { Recette } from '../constants/entities'; // Import Recette entity
import { ModalComponent } from '../components/common/Modal'; // Assuming ModalComponent is in this path
import { logger } from '../utils/logger'; // Your logger utility

type AddRecipeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddRecipe'>;

interface AddRecipeScreenProps {
  navigation: AddRecipeScreenNavigationProp;
}

const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ navigation }) => {
  const { userId, loading: authLoading } = useAuth();

    const hardcodedFamilyId = 'family1';

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { addEntity, loading: firestoreLoading, error: firestoreError } = useFirestore(userId || '', hardcodedFamilyId);


  useEffect(() => {
    if (firestoreError) {
      setErrorMessage(`Erreur de sauvegarde: ${firestoreError}`);
      setIsErrorModalVisible(true);
    }
  }, [firestoreError]);



  const handleSaveRecipe = async (recipeDataFromForm: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    if (!userId || !hardcodedFamilyId) {
      setErrorMessage('Identifiant utilisateur ou de famille non disponible. Veuillez vérifier votre connexion ou votre configuration.');
      setIsErrorModalVisible(true);
      return;
    }

    setIsSaving(true); // Start local saving indicator
    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages

    try {
      logger.info('Attempting to add recipe to Firestore', { userId, familyId: hardcodedFamilyId, recipeName: recipeDataFromForm.nom });
      const newRecipeId = await addEntity('Recipes', recipeDataFromForm);

      if (newRecipeId) {
        setSuccessMessage('Recette ajoutée avec succès !');
        setIsSuccessModalVisible(true);
        logger.info('Recipe added successfully', { newRecipeId });
        // After a short delay, hide modal and navigate
        setTimeout(() => {
          setIsSuccessModalVisible(false);
          navigation.replace('RecipeDetail', { recipeId: newRecipeId });
        }, 1500);
      } else {
        // If addEntity returns null without setting a firestoreError, provide a generic message
        if (!firestoreError) { // Check if useFirestore already set an error
             setErrorMessage('Échec de l\'ajout de la recette. Une erreur inattendue est survenue.');
             setIsErrorModalVisible(true);
             logger.error('Failed to add recipe, no specific Firestore error reported.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'ajout de la recette via Firestore.');
      setIsErrorModalVisible(true);
      logger.error('Error during recipe submission:', err.message);
    } finally {
      setIsSaving(false); // End local saving indicator
    }
  };

  /**
   * Handles the cancellation of the recipe creation process.
   * This navigates the user back to the previous screen in the navigation stack.
   */
  const handleCancel = () => {
    navigation.goBack(); // Navigates back to the screen that pushed AddRecipeScreen (e.g., RecipeListScreen)
  };

  // Show a loading indicator while authentication status is being determined
  if (authLoading || !userId) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des données utilisateur...</Text>
      </SafeAreaView>
    );
  }


  if (!hardcodedFamilyId || hardcodedFamilyId === 'family1') {
    return (
      <SafeAreaView style={styles.errorScreenContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <Text style={styles.errorScreenText}>
          Configuration manquante: L'identifiant de la famille n'est pas défini.
        </Text>
        <Text style={styles.errorScreenSubText}>
          Veuillez configurer l'identifiant de la famille pour cette application.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <RecipeForm
        onSubmit={handleSaveRecipe}
        onCancel={handleCancel}
        familyId={hardcodedFamilyId} // Passing the hardcoded familyId to the form
        createurId={userId}
        loading={isSaving || firestoreLoading} // Combine local saving with firestore hook's loading
      />

      {/* Success Modal for saving */}
      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
      >
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>

      {/* Error Modal for saving issues */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  errorScreenContainer: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorScreenText: {
    color: '#E74C3C',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorScreenSubText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AddRecipeScreen;
