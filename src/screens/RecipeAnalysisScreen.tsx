import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { useAIConversation } from '../hooks/useAIConversation';
import { ModalComponent } from '../components/common/Modal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { MembreFamille, Recette } from '../constants/entities'; // Assuming Recette entity



type RecipeAnalysisScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecipeAnalysis'>;
type RecipeAnalysisScreenRouteProp = RouteProp<RootStackParamList, 'RecipeAnalysis'>;

interface RecipeAnalysisScreenProps {
  navigation: RecipeAnalysisScreenNavigationProp;
  route: RecipeAnalysisScreenRouteProp;
}

const RecipeAnalysisScreen: React.FC<RecipeAnalysisScreenProps> = ({ navigation, route }) => {
  const { recipeId } = route.params;
  const { userId } = useAuth();

  const familyId = 'family1';

  const { recipes, loading: recipesLoading, error: recipesError } = useRecipes(userId || '', familyId);
  const { analyzeRecipe } = useAIConversation({ familyId }); // Pass the familyId to AI conversation hook

  const [recipe, setRecipe] = useState<Recette | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // Keep as 'any' or define a more specific AI response interface
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchAndAnalyzeRecipe = async () => {
      setLoadingAnalysis(true);
      setErrorMessage('');
      try {
        if (!recipes || recipes.length === 0) {
          // If recipes are not yet loaded, wait for the `recipes` dependency to update.
          // This `return` prevents redundant fetches until `recipes` is populated.
          return;
        }

        const foundRecipe = recipes.find(r => r.id === recipeId);
        if (!foundRecipe) {
          setErrorMessage('Recette non trouvée pour l\'analyse.');
          setIsErrorModalVisible(true);
          setLoadingAnalysis(false);
          return;
        }
        setRecipe(foundRecipe);

        // Fetch family members data for AI analysis. This is a placeholder.
        // In a real app, you would use a hook like `useFamilyData` to get the actual family members.
        const familyMembersData: MembreFamille[] = []; // Populate this with actual family members
        const result = await analyzeRecipe(foundRecipe, familyMembersData);
        setAnalysisResult(result);

      } catch (err: any) {
        setErrorMessage(err.message || 'Une erreur est survenue lors de l\'analyse de la recette.');
        setIsErrorModalVisible(true);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    // Trigger the fetch and analysis only if userId and familyId are available
    // and when recipes are loaded or still loading (to avoid infinite loops)
    if (userId && familyId && (recipes.length > 0 || !recipesLoading)) {
      fetchAndAnalyzeRecipe();
    }
  }, [recipeId, recipes, recipesLoading, analyzeRecipe, userId, familyId]); // Add userId and familyId to dependencies

  // Effect to handle and display errors from the useRecipes hook
  useEffect(() => {
    if (recipesError) {
      setErrorMessage(recipesError);
      setIsErrorModalVisible(true);
    }
  }, [recipesError]);

  // Show a global loading indicator while data is being fetched or analyzed
  if (loadingAnalysis || recipesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Analyse de la recette par NutriBuddy AI...</Text>
      </View>
    );
  }

  // If the recipe is not found after loading, display an empty state
  if (!recipe) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Impossible de charger les détails de la recette pour l'analyse.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Retour</Text>
        </TouchableOpacity>
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse de Recette AI</Text>
        <View style={styles.headerRightPlaceholder} /> {/* Moved inline style to StyleSheet */}
      </View>

      <View style={styles.analysisCard}>
        <Text style={styles.recipeNameAnalyzed}>{recipe.nom}</Text>
        <Text style={styles.analysisSectionTitle}>Résultats d'Analyse :</Text>

        {analysisResult ? (
          <>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>Calories:</Text>
              <Text style={styles.analysisValue}>
                {analysisResult.calories?.toFixed(2) || 'N/A'} kcal
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>Niveau d'épices:</Text>
              <Text style={styles.analysisValue}>
                {analysisResult.spicesLevel?.toString() || 'N/A'} / 5 {/* Ensured toString() for number */}
              </Text>
            </View>

            {analysisResult.suitability && Object.keys(analysisResult.suitability).length > 0 && (
              <>
                <Text style={styles.analysisSubSectionTitle}>Adéquation par membre de la famille:</Text>
                {Object.entries(analysisResult.suitability).map(([memberId, status]) => (
                  <View key={memberId} style={styles.suitabilityItem}>
                    <Text style={styles.suitabilityMember}>Membre {memberId}:</Text>
                    {/* Explicitly cast 'status' to string to fix TypeScript error */}
                    <Text style={[
                      styles.suitabilityStatus,
                      status === 'adapté' && styles.statusAdapted,
                      status === 'non adapté' && styles.statusNotAdapted,
                      status === 'modifié' && styles.statusModified,
                    ]}>
                      {status as string}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Add more detailed analysis fields here based on your AI response structure */}
            {analysisResult.notes && (
              <>
                <Text style={styles.analysisSubSectionTitle}>Notes supplémentaires:</Text>
                <Text style={styles.analysisText}>{analysisResult.notes}</Text>
              </>
            )}
          </>
        ) : (
          <Text style={styles.noAnalysisText}>Aucune analyse disponible pour cette recette.</Text>
        )}

      </View>

      {/* Error Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
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
  headerRightPlaceholder: { // Added style for placeholder
    width: 24,
  },
  analysisCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  recipeNameAnalyzed: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f7b733',
    marginBottom: 15,
    textAlign: 'center',
  },
  analysisSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  analysisSubSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7b733',
    marginTop: 15,
    marginBottom: 10,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  analysisValue: {
    fontSize: 16,
    color: '#FFF',
  },
  suitabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  suitabilityMember: {
    fontSize: 15,
    color: '#ccc',
  },
  suitabilityStatus: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusAdapted: {
    color: '#27AE60', // Green
  },
  statusNotAdapted: {
    color: '#E74C3C', // Red
  },
  statusModified: {
    color: '#F39C12', // Orange/Yellow
  },
  analysisText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: 10,
  },
  noAnalysisText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default RecipeAnalysisScreen;
