import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, Text, Image } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { RecipeWizard } from '../components/forms/RecipeWizard';
import { Recette } from '../constants/entities';
import { ModalComponent } from '../components/common/Modal';
import { logger } from '../utils/logger';

type AddRecipeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddRecipe'>;

interface AddRecipeScreenProps {
  navigation: AddRecipeScreenNavigationProp;
}

const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ navigation }) => {
  const { userId, loading: authLoading } = useAuth();
  const { addRecipe, loading: recipesLoading } = useRecipes();
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRecipe = async (recipeData: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    if (!userId) {
      setErrorMessage('Utilisateur non connecté. Veuillez vous connecter.');
      setIsErrorModalVisible(true);
      logger.error('No userId available for recipe submission');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      logger.info('Attempting to add recipe', { userId, recipeName: recipeData.nom });
      const recipeId = await addRecipe(recipeData);
      if (recipeId) {
        setSuccessMessage('Recette ajoutée avec succès !');
        setIsSuccessModalVisible(true);
        logger.info('Recipe added successfully', { recipeId });
        setTimeout(() => {
          setIsSuccessModalVisible(false);
          navigation.replace('RecipeDetail', { recipeId });
        }, 1500);
      } else {
        setErrorMessage('Échec de l’ajout de la recette.');
        setIsErrorModalVisible(true);
        logger.error('Failed to add recipe');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de l’ajout de la recette.';
      setErrorMessage(errorMsg);
      setIsErrorModalVisible(true);
      logger.error('Error during recipe submission', { error: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (authLoading || !userId) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des données utilisateur...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <RecipeWizard
        onSubmit={handleSaveRecipe}
        onCancel={handleCancel}
        loading={isSaving || recipesLoading}
        createurId={userId}
      />
      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
        showCloseButton
        animationType="fade"
      >
        <Image
          source={require('../assets/icons/success.png')}
          style={styles.modalImage}
          resizeMode="contain"
        />
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
        showCloseButton
        animationType="fade"
      >
        <Image
          source={require('../assets/icons/error.png')}
          style={styles.modalImage}
          resizeMode="contain"
        />
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
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: 100,
    marginBottom: 10,
  },
});

export default AddRecipeScreen;
