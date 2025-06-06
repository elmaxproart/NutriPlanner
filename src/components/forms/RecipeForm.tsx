import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateRecette } from '../../utils/dataValidators';
import { formatDate, generateId } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Recette, Ingredient } from '../../constants/entities';
import { useRecipes } from '../../hooks/useRecipes';
import { useFirestore } from '../../hooks/useFirestore';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { RecipeCategory } from '../../constants/categories'; // Ensure Unit is imported
import { Unit } from '../../constants/units';

const DIFFICULTY_OPTIONS = ['facile', 'moyen', 'difficile'] as const;
const RECIPE_CATEGORIES_OPTIONS: RecipeCategory[] = [
  'entrée',
  'plat principal',
  'dessert',
  'accompagnement',
  'boisson',
  'snack',
];

// Define an array from your Unit type for mapping in the Picker
const UNIT_OPTIONS: Unit[] = [
  'g',
  'kg',
  'ml',
  'l',
  'unité',
  'cuillère à soupe',
  'cuillère à café',
  'pincée',
  'tranche',
  'boîte',
  'paquet',
];


interface RecipeFormProps {
  onSubmit: (recipe: Recette) => void;
  loading?: boolean;
  initialData?: Partial<Recette>;
  familyId: string;
  createurId: string;
}

export const RecipeForm = ({ onSubmit, loading = false, initialData, familyId, createurId }: RecipeFormProps) => {
  const { addRecipe, estimateCost } = useRecipes(createurId, familyId);
  const { getCollection } = useFirestore(createurId, familyId);

  // États principaux
  const [nom, setNom] = useState(initialData?.nom || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || []
  );
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [tempsPreparation, setTempsPreparation] = useState(initialData?.tempsPreparation?.toString() || '0');
  const [tempsCuisson, setTempsCuisson] = useState(initialData?.tempsCuisson?.toString() || '');
  const [portions, setPortions] = useState(initialData?.portions?.toString() || '1');
  const [categorie, setCategorie] = useState<RecipeCategory | undefined>(initialData?.categorie || 'entrée');
  const [difficulte, setDifficulte] = useState<'facile' | 'moyen' | 'difficile'>(initialData?.difficulte || 'facile');
  const [etapesPreparation, setEtapesPreparation] = useState<{ texte: string; ordre: number }[]>(
    initialData?.etapesPreparation || [{ texte: '', ordre: 1 }]
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [coutEstime, setCoutEstime] = useState(initialData?.coutEstime?.toString() || '0');
  const [error, setError] = useState<string[]>([]);
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useSharedValue(0);

  // Récupérer les ingrédients disponibles pour le picker
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  useEffect(() => {
    const fetchIngredients = async () => {
      const ingredientsData = await getCollection<Ingredient>('Ingredients');
      setAvailableIngredients(ingredientsData);
    };
    fetchIngredients();
  }, [getCollection]);

  // Validation mémorisée
  const validateForm = useCallback(() => {
    const recipeData: Partial<Recette> = {
      nom,
      ingredients,
      instructions,
      tempsPreparation: Number(tempsPreparation),
      tempsCuisson: tempsCuisson ? Number(tempsCuisson) : undefined,
      portions: Number(portions),
      categorie: categorie || 'entrée',
      difficulte,
      etapesPreparation,
      tags,
      coutEstime: Number(coutEstime),
      familyId,
      createurId,
    };
    const errors = validateRecette(recipeData as Recette);
    setError(errors);
    return errors.length === 0;
  }, [nom, ingredients, instructions, tempsPreparation, tempsCuisson, portions, categorie, difficulte, etapesPreparation, tags, coutEstime, familyId, createurId]);

  // Estimation du coût mémorisée
  const estimatedCost = useMemo(async () => {
    const recipe: Recette = {
      id: initialData?.id || generateId('recipe'),
      familyId,
      createurId,
      dateCreation: formatDate(new Date()),
      nom,
      ingredients,
      instructions,
      tempsPreparation: Number(tempsPreparation),
      portions: Number(portions),
      categorie: categorie || 'entrée',
      difficulte,
      etapesPreparation,
      tags,
    };
    // Ensure tempsCuisson is added if it exists
    if (tempsCuisson) {
        recipe.tempsCuisson = Number(tempsCuisson);
    }
    return await estimateCost(recipe);
  }, [nom, ingredients, instructions, tempsPreparation, portions, categorie, difficulte, etapesPreparation, tags, familyId, createurId, estimateCost, initialData, tempsCuisson]);

  useEffect(() => {
    estimatedCost.then(cost => setCoutEstime(cost?.toString() || '0'));
    validateForm();
    fadeAnim.value = withTiming(error.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [estimatedCost, validateForm, error.length, fadeAnim]);

  const handleAddIngredient = useCallback(() => {
    setIngredients(prev => [...prev]);
    logger.info('Ajout d’un ingrédient', { ingredientsLength: ingredients.length + 1 });
  }, [ingredients.length]);

  const handleIngredientChange = useCallback((index: number, field: keyof typeof ingredients[0], value: string | number | Unit) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  }, [ingredients]);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’un ingrédient', { removedIndex: index });
  }, []);

  const handleAddEtape = useCallback(() => {
    setEtapesPreparation(prev => [...prev, { texte: '', ordre: prev.length + 1 }]);
    logger.info('Ajout d’une étape', { etapesLength: etapesPreparation.length + 1 });
  }, [etapesPreparation.length]);

  const handleEtapeChange = useCallback((index: number, value: string) => {
    const newEtapes = [...etapesPreparation];
    newEtapes[index] = { ...newEtapes[index], texte: value };
    setEtapesPreparation(newEtapes);
  }, [etapesPreparation]);

  const handleRemoveEtape = useCallback((index: number) => {
    setEtapesPreparation(prev => prev.filter((_, i) => i !== index).map((etape, idx) => ({ ...etape, ordre: idx + 1 })));
    logger.info('Suppression d’une étape', { removedIndex: index });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      const recipeData: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        familyId,
        createurId,
        nom,
        ingredients,
        instructions,
        tempsPreparation: Number(tempsPreparation),
        tempsCuisson: tempsCuisson ? Number(tempsCuisson) : undefined,
        portions: Number(portions),
        categorie: categorie || 'entrée',
        difficulte,
        etapesPreparation,
        tags,
        coutEstime: Number(coutEstime),
      };
      setProgress(0.5);
      logger.info('Soumission de la recette', { recipe: recipeData });
      const recipeId = await addRecipe(recipeData);
      if (recipeId) {
        setProgress(1);
        setModalSuccessVisible(true);
        onSubmit({ ...recipeData, id: recipeId, dateCreation: formatDate(new Date()), dateMiseAJour: formatDate(new Date()) });
      } else {
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
      logger.warn('Validation échouée', { errors: error });
    }
  }, [validateForm, familyId, createurId, nom, ingredients, instructions, tempsPreparation, tempsCuisson, portions, categorie, difficulte, etapesPreparation, tags, coutEstime, addRecipe, onSubmit, error]);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input
        value={nom}
        onChangeText={setNom}
        placeholder="Nom de la recette"
        iconName="book-open"
        iconPosition="left"
        keyboardType="default"
      />
      <Text style={styles.sectionTitle}>Ingrédients</Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientContainer} testID={`ingredient-row-${index}`}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ingredient.id}
              onValueChange={(val) => handleIngredientChange(index, 'id', val as string)}
              style={styles.picker}
              testID={`ingredient-picker-${index}`}
            >
              <Picker.Item label="Sélectionner un ingrédient" value="" />
              {availableIngredients.map((ing) => (
                <Picker.Item key={ing.id} label={ing.nom} value={ing.id} />
              ))}
            </Picker>
          </View>
          <Input
            value={ingredient.quantite.toString()}
            onChangeText={(val) => handleIngredientChange(index, 'quantite', Number(val) || 0)}
            placeholder="Quantité"
            iconName="numeric"
            iconPosition="left"
            keyboardType="numeric"
          />
          {/* CORRECTED PICKER FOR UNITS */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ingredient.unite}
              onValueChange={(val) => handleIngredientChange(index, 'unite', val as Unit)}
              style={styles.picker}
              testID={`unit-picker-${index}`}
            >
              {UNIT_OPTIONS.map((unit) => (
                <Picker.Item key={unit} label={unit} value={unit} />
              ))}
            </Picker>
          </View>
          {/* END CORRECTED PICKER */}
          <GradientButton
            title="Supprimer"
            onPress={() => handleRemoveIngredient(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter un ingrédient"
        onPress={handleAddIngredient}
        style={styles.addButton}
        disabled={loading}
      />
      <Input
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Instructions"
        iconName="note-text"
        iconPosition="left"
        keyboardType="default"
        multiline
        numberOfLines={3}

      />
      <Text style={styles.sectionTitle}>Étapes de préparation</Text>
      {etapesPreparation.map((etape, index) => (
        <View key={index} style={styles.etapeContainer} testID={`etape-row-${index}`}>
          <Input
            value={etape.texte}
            onChangeText={(val) => handleEtapeChange(index, val)}
            placeholder={`Étape ${etape.ordre}`}
            iconName="format-list-numbered"
            iconPosition="left"
            keyboardType="default"
            multiline
            numberOfLines={2}

          />
          <GradientButton
            title="Supprimer"
            onPress={() => handleRemoveEtape(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter une étape"
        onPress={handleAddEtape}
        style={styles.addButton}
        disabled={loading}
      />
      <Input
        value={tempsPreparation}
        onChangeText={setTempsPreparation}
        placeholder="Temps de préparation (minutes)"
        iconName="clock"
        iconPosition="left"
        keyboardType="numeric"
      />
      <Input
        value={tempsCuisson}
        onChangeText={setTempsCuisson}
        placeholder="Temps de cuisson (minutes)"
        iconName="timer"
        iconPosition="left"
        keyboardType="numeric"
      />
      <Input
        value={portions}
        onChangeText={setPortions}
        placeholder="Nombre de portions"
        iconName="account-group"
        iconPosition="left"
        keyboardType="numeric"
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categorie}
          onValueChange={(val) => setCategorie(val as RecipeCategory)}
          style={styles.picker}
          testID="category-picker"
        >
          {RECIPE_CATEGORIES_OPTIONS.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={difficulte}
          onValueChange={(val) => setDifficulte(val as typeof DIFFICULTY_OPTIONS[number])}
          style={styles.picker}
          testID="difficulty-picker"
        >
          {DIFFICULTY_OPTIONS.map((diff) => (
            <Picker.Item key={diff} label={diff} value={diff} />
          ))}
        </Picker>
      </View>
      <Input
        value={tags.join(', ')}
        onChangeText={(val) => setTags(val.split(',').map(s => s.trim()))}
        placeholder="Tags (séparés par des virgules)"
        iconName="label"
        iconPosition="left"
        keyboardType="default"
      />
      <Input
        value={coutEstime}
        onChangeText={setCoutEstime}
        placeholder="Coût estimé"
        iconName="currency-eur"
        iconPosition="left"
        keyboardType="decimal-pad"
        editable={false}
      />
      <GradientButton
        title={loading ? 'Enregistrement...' : 'Enregistrer'}
        onPress={handleSubmit}
        disabled={loading || error.length > 0}
        style={styles.submitButton}
      />
      <ProgressBar progress={progress} animated barColor="#FF6B00" />
      <ModalComponent
        visible={modalSuccessVisible}
        onClose={() => setModalSuccessVisible(false)}
        title="Succès"
        showCloseButton
      >
        <Text style={styles.modalText}>Recette enregistrée avec succès !</Text>
      </ModalComponent>
      <ModalComponent
        visible={modalErrorVisible}
        onClose={() => setModalErrorVisible(false)}
        title="Erreur"
        showCloseButton
        animationType="fade"
      >
        <Text style={styles.modalText}>Veuillez corriger les erreurs suivantes :</Text>
        {error.map((err, index) => (
          <Text key={index} style={styles.errorDetail} testID={`error-detail-${index}`}>{`- ${err}`}</Text>
        ))}
      </ModalComponent>
      {error.length > 0 && (
        <Animated.View style={[styles.errorContainer, animatedErrorStyle]} testID="error-container">
          <Text style={styles.errorText}>Erreurs détectées. Consultez le modal pour plus de détails.</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0d0d0d',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  ingredientContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  etapeContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pickerContainer: {
    flex: 1,
    marginVertical: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  picker: {
    color: '#ffffff',
    height: 50,
  },
  addButton: {
    backgroundColor: '#2980b9',
    marginVertical: 10,
  },
  removeButton: {
    backgroundColor: '#E74C3C',
    marginVertical: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  submitButton: {
    marginVertical: 20,
  },
  modalText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'left',
    marginTop: 5,
  },
});
