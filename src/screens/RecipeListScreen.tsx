import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar, // Added for consistent styling
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes'; // For fetching recipes
import { useFirestore } from '../hooks/useFirestore'; // NEW: For deleting recipes
import { ModalComponent } from '../components/common/Modal';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Recette } from '../constants/entities';


type RecipeListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecipeList'>;

interface RecipeListScreenProps {
  navigation: RecipeListScreenNavigationProp;
}

const RecipeListScreen: React.FC<RecipeListScreenProps> = ({ navigation }) => {
  const { userId } = useAuth();


  const familyId = 'family1';

  // useRecipes hook for fetching recipe data.
  const { recipes, loading: recipesLoading, error: recipesError, fetchRecipes } = useRecipes(userId || '', familyId);

  // NEW: Initialize useFirestore for deletion operations
  const { deleteEntity, loading: firestoreLoading, error: firestoreError } = useFirestore(userId || '', familyId);

  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Effect to fetch recipes when the component mounts or userId/familyId changes
  useEffect(() => {
    if (userId && familyId) {
      fetchRecipes();
    }
  }, [userId, familyId, fetchRecipes]); // Added fetchRecipes to dependency array

  // Effect to handle and display errors from useRecipes hook
  useEffect(() => {
    if (recipesError) {
      setErrorMessage(recipesError);
      setIsErrorModalVisible(true);
    }
  }, [recipesError]);

  // Effect to handle and display errors from useFirestore hook (e.g., deletion errors)
  useEffect(() => {
    if (firestoreError) {
      setErrorMessage(firestoreError);
      setIsErrorModalVisible(true);
    }
  }, [firestoreError]);


  // Filter recipes based on the search term
  const filteredRecipes = React.useMemo(() => {
    if (!searchTerm) {
      return recipes;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.nom.toLowerCase().includes(lowerCaseSearchTerm) ||
        recipe.categorie.toLowerCase().includes(lowerCaseSearchTerm) ||
        recipe.tags?.some((tag) => tag.toLowerCase().includes(lowerCaseSearchTerm)) ||
        recipe.ingredients?.some((ing) => ing.nom.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [recipes, searchTerm]);

  // Navigate to RecipeDetail screen, passing both recipeId and familyId
  const handleCardPress = (recipeId: string) => {
    navigation.navigate('RecipeDetail', { recipeId});
  };

  // Navigate to AddRecipe screen
  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  // Prepare for recipe deletion by setting the ID and showing confirmation modal
  const handleDeletePress = useCallback((recipeId: string) => {
    setRecipeToDelete(recipeId);
    setIsConfirmDeleteModalVisible(true);
  }, []);

  // Execute recipe deletion after confirmation
  const confirmDelete = useCallback(async () => {
    if (recipeToDelete && userId && familyId) { // Ensure all necessary IDs are present
      setIsConfirmDeleteModalVisible(false); // Close confirmation modal
      try {
        // Use deleteEntity from useFirestore for actual deletion
        const success = await deleteEntity('Recipes', recipeToDelete);
        if (success) {
          setErrorMessage('Recette supprimée avec succès !');
          setIsErrorModalVisible(true); // Re-use error modal for success messages
          // Re-fetch recipes to update the list after deletion
          fetchRecipes();
        } else {
          // If deleteEntity returns false without setting a firestoreError, use a generic message
          if (!firestoreError) {
              setErrorMessage('Échec de la suppression de la recette. La recette n\'a peut-être pas été trouvée ou des permissions manquent.');
          }
          setIsErrorModalVisible(true);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Erreur lors de la suppression de la recette.');
        setIsErrorModalVisible(true);
      } finally {
        setRecipeToDelete(null); // Clear the recipeToDelete state
      }
    }
  }, [recipeToDelete, userId, familyId, deleteEntity, fetchRecipes, firestoreError]); // Added fetchRecipes and firestoreError to dependencies

  // Cancel the delete operation
  const cancelDelete = useCallback(() => {
    setIsConfirmDeleteModalVisible(false);
    setRecipeToDelete(null);
  }, []);

  // Render individual recipe item for the FlatList
  const renderRecipeItem = ({ item }: { item: Recette }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleCardPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.recipeName}>{item.nom}</Text>
        <TouchableOpacity onPress={() => handleDeletePress(item.id)} style={styles.deleteButton}>
          <AntDesign name="delete" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      <Text style={styles.recipeCategory}>Catégorie: {item.categorie}</Text>
      {item.tempsPreparation !== undefined && (
        <Text style={styles.recipeInfo}>Préparation: {item.tempsPreparation} min</Text>
      )}
      {item.portions !== undefined && (
        <Text style={styles.recipeInfo}>Portions: {item.portions}</Text>
      )}
      {item.coutEstime !== undefined && (
        <Text style={styles.recipeCost}>Coût estimé: {item.coutEstime.toFixed(2)} F CFA</Text>
      )}
    </TouchableOpacity>
  );

  // Show a loading indicator while recipes are being fetched or Firestore operation is in progress
  if (recipesLoading || firestoreLoading || !userId || !familyId) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des recettes...</Text>
        {(!userId || !familyId) && (
            <Text style={styles.errorText}>Identifiants utilisateur ou famille manquants.</Text>
        )}
      </View>
    );
  }

  // Main component rendering
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <Text style={styles.headerTitle}>Vos Recettes</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher une recette..."
        placeholderTextColor="#aaa"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* List of Recipes */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeItem}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <AntDesign name="spoon" size={50} color="#b0b0b0" style={styles.emptyIcon} />
            <Text style={styles.emptyListText}>Aucune recette trouvée.</Text>
            <Text style={styles.emptyListSubText}>Ajoutez votre première recette !</Text>
          </View>
        }
      />

      {/* Floating Action Button to Add a Recipe */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
        <AntDesign name="pluscircle" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Ajouter une recette</Text>
      </TouchableOpacity>

      {/* Error/Information Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Information"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>

      {/* Confirm Delete Modal */}
      <ModalComponent
        visible={isConfirmDeleteModalVisible}
        onClose={cancelDelete}
        title="Confirmer la suppression"
        showCloseButton={false} // Don't show close button for critical confirmation
      >
        <Text style={styles.modalMessageText}>
          Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.
        </Text>
        <View style={styles.modalButtonContainer}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={cancelDelete}>
            <Text style={styles.modalButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmDelete}>
            <Text style={styles.modalButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>
    </View>
  );
};

// Stylesheet for the RecipeListScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingTop: 20, // Adjust for status bar or safe area
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: { // Added style for error messages in loading state
    color: '#E74C3C',
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    color: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80, // Ensure space for the floating action button at the bottom
  },
  recipeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f7b733',
    flex: 1, // Allow text to wrap within the available space
  },
  deleteButton: {
    padding: 5,
  },
  recipeCategory: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 5,
  },
  recipeInfo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 3,
  },
  recipeCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60', // Green for cost
    marginTop: 10,
    textAlign: 'right',
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50, // Vertical padding for empty list message
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyListText: {
    color: '#b0b0b0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListSubText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  addButton: {
    position: 'absolute', // Position the button absolutely
    bottom: 20, // 20 units from the bottom
    right: 20, // 20 units from the right
    backgroundColor: '#f7b733', // Accent color for the button
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // Make it pill-shaped
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10, // Space between icon and text
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  modalCancelButton: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default RecipeListScreen;
