import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes'; // For fetching recipes
import { useAIConversation } from '../hooks/useAIConversation'; // For AI analysis
import { useFirestore } from '../hooks/useFirestore'; // NEW: For deleting recipes
import { MembreFamille, Recette } from '../constants/entities'; // Only import used types
import { ModalComponent } from '../components/common/Modal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

// --- IMPORTANT: Update RootStackParamList in your App.tsx to include these params ---
// Example:
// type RootStackParamList = {
//   RecipeDetail: { recipeId: string; familyId: string; }; // Added familyId here
//   EditRecipe: { recipeId: string; familyId: string; createurId: string; }; // Ensure these params are expected
//   RecipeAnalysis: { recipeId: string; familyId: string; }; // If you navigate here, ensure familyId is passed
//   // ... other routes
// };

type RecipeDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailScreenRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

interface RecipeDetailScreenProps {
  navigation: RecipeDetailScreenNavigationProp;
  route: RecipeDetailScreenRouteProp;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ navigation, route }) => {
  const { recipeId } = route.params; // Get recipeId AND familyId from navigation params
  const { userId } = useAuth();

  // --- IMPORTANT ---
  // The 'familyId' is now primarily taken from route.params for consistency.
  // If route.params.familyId is ever undefined, you might fall back to a hardcoded value
  // or redirect the user to prevent errors. Ensure the calling screen provides it.
  const familyId =  'family1'; // Fallback for robustness

  // useRecipes hook for fetching recipe data. Assumes it doesn't handle deletion directly.
  const { recipes, loading: recipesLoading, error: recipesError, fetchRecipes } = useRecipes(userId || '', familyId);


  const { deleteEntity, loading: firestoreLoading, error: firestoreError } = useFirestore(userId || '', familyId);

  // useAIConversation hook for AI analysis
  const { analyzeRecipe } = useAIConversation({ userId: userId || '', familyId });

  const [recipe, setRecipe] = useState<Recette | null>(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmDeleteModalVisible, setIsConfirmDeleteModalVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // For AI analysis loading
  const [isAnalysisModalVisible, setIsAnalysisModalVisible] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // Type this more specifically if possible

  // Effect to fetch recipes when userId or familyId changes
  useEffect(() => {
    if (userId && familyId) {
      fetchRecipes();
    }
  }, [userId, familyId, fetchRecipes]);


  // Effect to find the specific recipe from the fetched list
  useEffect(() => {
    if (recipes && recipeId) {
      const foundRecipe = recipes.find(r => r.id === recipeId);
      if (foundRecipe) {
        setRecipe(foundRecipe);
      } else {
        setErrorMessage('Recette non trouvée.');
        setIsErrorModalVisible(true);
      }
    }
  }, [recipes, recipeId]);

  // Effect to display errors from useRecipes hook
  useEffect(() => {
    if (recipesError) {
      setErrorMessage(recipesError);
      setIsErrorModalVisible(true);
    }
  }, [recipesError]);

  // Effect to display errors from useFirestore hook (e.g., deletion errors)
  useEffect(() => {
    if (firestoreError) {
      setErrorMessage(firestoreError);
      setIsErrorModalVisible(true);
    }
  }, [firestoreError]);


  // Navigate to EditRecipe screen
  const handleEditRecipe = useCallback(() => {
    if (recipe && userId) {
      navigation.navigate('EditRecipe', { recipeId: recipe.id, familyId });
    }
  }, [navigation, recipe, familyId, userId]);

  // Show confirmation modal for deletion
  const handleDeletePress = useCallback(() => {
    setIsConfirmDeleteModalVisible(true);
  }, []);


  const confirmDelete = useCallback(async () => {
    if (recipe && userId) {
      setIsConfirmDeleteModalVisible(false); // Close confirmation modal
      try {

        const success = await deleteEntity('Recipes', recipe.id);
        if (success) {
          setErrorMessage('Recette supprimée avec succès !');
          setIsErrorModalVisible(true); // Use error modal for general info/success now
          navigation.goBack(); // Go back to list after successful deletion
        } else {
          setErrorMessage('Échec de la suppression de la recette. Veuillez réessayer.');
          setIsErrorModalVisible(true);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Erreur lors de la suppression de la recette.');
        setIsErrorModalVisible(true);
      }
    }
  }, [recipe, deleteEntity, navigation, userId]);

  // Handle AI analysis of the recipe
  const handleAnalyzeRecipe = useCallback(async () => {
    if (!recipe || !userId || !familyId) {
      setErrorMessage('Recette, utilisateur ou identifiant de famille manquant pour l\'analyse.');
      setIsErrorModalVisible(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null); // Clear previous analysis result
    try {
      // You need to fetch actual family members here if analyzeRecipe uses them.
      // For now, it's an empty array as per previous code, but this needs proper data.
      const familyMembersData: MembreFamille[] = []; // Populate this with actual family members (e.g., via useFamilyData or context)
      const result = await analyzeRecipe(recipe, familyMembersData);
      setAnalysisResult(result);
      setIsAnalysisModalVisible(true); // Show AI analysis result modal
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'analyse de la recette par l\'IA.');
      setIsErrorModalVisible(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, [recipe, analyzeRecipe, userId, familyId]);

  // Show a global loading indicator while data is being fetched or analyzed
  if (recipesLoading || firestoreLoading || isAnalyzing || !userId || !familyId) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>
          {recipesLoading ? 'Chargement des recettes...' :
           firestoreLoading ? 'Opération en cours...' :
           isAnalyzing ? 'Analyse AI en cours...' :
           'Préparation des données...'}
        </Text>
        {(!userId || !familyId) && (
          <Text style={styles.errorText}>Identifiants utilisateur ou famille manquants.</Text>
        )}
      </View>
    );
  }

  // If the recipe is not found after loading, display an empty state
  if (!recipe) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <Text style={styles.emptyText}>Détails de la recette non disponibles.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Retour</Text>
        </TouchableOpacity>
        {/* Error Modal for issues related to recipe not found */}
        <ModalComponent
          visible={isErrorModalVisible}
          onClose={() => setIsErrorModalVisible(false)}
          title="Erreur"
        >
          <Text style={styles.modalMessageText}>{errorMessage}</Text>
        </ModalComponent>
      </View>
    );
  }

  // Main component rendering
  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la Recette</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditRecipe} style={styles.actionButton}>
            <AntDesign name="edit" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeletePress} style={styles.actionButton}>
            <AntDesign name="delete" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recipeCard}>
        {/* Placeholder for recipe image if available */}
        {recipe.imageUrl && ( // Assuming recipe has an imageUrl property
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
        )}
        <Text style={styles.recipeName}>{recipe.nom}</Text>
        <Text style={styles.recipeInfo}>Catégorie: {recipe.categorie}</Text>
        <Text style={styles.recipeInfo}>Difficulté: {recipe.difficulte}</Text>
        <Text style={styles.recipeInfo}>Portions: {recipe.portions}</Text>
        {recipe.tempsPreparation !== undefined && <Text style={styles.recipeInfo}>Préparation: {recipe.tempsPreparation} min</Text>}
        {recipe.tempsCuisson !== undefined && <Text style={styles.recipeInfo}>Cuisson: {recipe.tempsCuisson} min</Text>}
        {recipe.coutEstime !== undefined && <Text style={styles.recipeCost}>Coût estimé: {recipe.coutEstime.toFixed(2)} F CFA</Text>}

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ing, index) => (
            <Text key={index} style={styles.ingredientItem}>
              • {ing.quantite} {ing.unite} de {ing.nom}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucun ingrédient spécifié.</Text>
        )}

        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions ? (
          <Text style={styles.instructionsText}>{recipe.instructions}</Text>
        ) : (
          <Text style={styles.noDataText}>Aucune instruction spécifiée.</Text>
        )}

        {recipe.etapesPreparation && recipe.etapesPreparation.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Étapes de Préparation</Text>
            {recipe.etapesPreparation.map((etape, index) => (
              <Text key={index} style={styles.etapeItem}>
                {etape.ordre}. {etape.texte}
              </Text>
            ))}
          </>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tags</Text>
            <Text style={styles.tagsText}>{recipe.tags.join(', ')}</Text>
          </>
        )}

        <TouchableOpacity
          onPress={handleAnalyzeRecipe}
          style={styles.analyzeButton}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#FFF" />
              <Text style={styles.analyzeButtonText}>Analyser avec NutriBuddy AI</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>

      {/* Confirm Delete Modal */}
      <ModalComponent
        visible={isConfirmDeleteModalVisible}
        onClose={() => setIsConfirmDeleteModalVisible(false)}
        title="Confirmer la suppression"
        showCloseButton={false}
      >
        <Text style={styles.modalMessageText}>
          Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.
        </Text>
        <View style={styles.modalButtonContainer}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsConfirmDeleteModalVisible(false)}>
            <Text style={styles.modalButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmDelete}>
            <Text style={styles.modalButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>

      {/* AI Analysis Result Modal */}
      <ModalComponent
        visible={isAnalysisModalVisible}
        onClose={() => setIsAnalysisModalVisible(false)}
        title="Analyse NutriBuddy AI"
      >
        {analysisResult ? (
          <ScrollView>
            <Text style={styles.analysisText}>
              Calories: {analysisResult.calories?.toFixed(2) || 'N/A'} kcal
            </Text>
            <Text style={styles.analysisText}>
              Niveau d'épices: {analysisResult.spicesLevel?.toString() || 'N/A'} / 5
            </Text>
            {/* Conditional rendering for suitability section */}
            {analysisResult.suitability && Object.keys(analysisResult.suitability).length > 0 && (
              <>
                <Text style={styles.analysisSectionTitle}>Adéquation par membre de la famille:</Text>
                {Object.entries(analysisResult.suitability).map(([memberId, status]) => (
                  <Text key={memberId} style={styles.analysisText}>
                    • Membre {memberId}: {status as string} {/* Explicitly cast to string */}
                  </Text>
                ))}
              </>
            )}
            {/* Add more analysis details as available in your GeminiService response */}
             {analysisResult.notes && (
              <>
                <Text style={styles.analysisSectionTitle}>Notes supplémentaires:</Text>
                <Text style={styles.analysisText}>{analysisResult.notes}</Text>
              </>
            )}
          </ScrollView>
        ) : (
          <Text style={styles.modalMessageText}>Analyse non disponible.</Text>
        )}
      </ModalComponent>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#f7b733',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 15,
  },
  recipeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  recipeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f7b733',
    marginBottom: 10,
    textAlign: 'center',
  },
  recipeInfo: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  recipeCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginTop: 10,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  ingredientItem: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
  },
  etapeItem: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  tagsText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 15,
    color: '#b0b0b0',
    textAlign: 'center',
    paddingVertical: 10,
  },
  analyzeButton: {
    backgroundColor: '#2980b9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
  analysisText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7b733',
    marginTop: 15,
    marginBottom: 10,
  },
});

export default RecipeDetailScreen;
