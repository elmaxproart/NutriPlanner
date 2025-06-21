/* eslint-disable @typescript-eslint/no-shadow */
import React, { useState, useEffect, useCallback, useRef, JSX } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { useRecipes } from '../../hooks/useRecipes';
import { Recette, Ingredient } from '../../constants/entities';
import { RecipeCategory } from '../../constants/categories';
import { Unit } from '../../constants/units';
import { logger } from '../../utils/logger';
import { formatDate } from '../../utils/helpers';

// Configuration
const COLORS = {
  primary: '#E95221',
  secondary: '#F2A03D',
  backgroundDark: '#0D0D0D',
  backgroundLight: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  cardBg: '#2C2C2C',
  shadow: '#000',
  buttonText: '#FFFFFF',
};

const FONTS = {
  title: 20,
  description: 14,
  button: 14,
  modalTitle: 18,
  modalText: 14,
  inputLabel: 16,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const { height } = Dimensions.get('window');

const DIFFICULTY_OPTIONS = ['facile', 'moyen', 'difficile'] as const;
const RECIPE_CATEGORIES_OPTIONS: RecipeCategory[] = [
  'entrée',
  'plat principal',
  'dessert',
  'accompagnement',
  'boisson',
  'snack',
];
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

interface RecipeWizardProps {
  onSubmit: (recipeData: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'>) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<Recette>;
  createurId: string;
}

interface StepConfig {
  title: string;
  description: string;
  icon: string;
  content: JSX.Element;
}

export const RecipeWizard: React.FC<RecipeWizardProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  createurId,
}) => {
  const { recipes, addRecipe, estimateCost, loading: recipesLoading, error: recipesError } = useRecipes();
  const [index, setIndex] = useState(0);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Form state
  const [nom, setNom] = useState(initialData?.nom || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || []);
  const [instructions, setInstructions] = useState(initialData?.instructions?.join('\n') || '');
  const [tempsPreparation, setTempsPreparation] = useState(initialData?.tempsPreparation?.toString() || '0');
  const [tempsCuisson, setTempsCuisson] = useState(initialData?.tempsCuisson?.toString() || '');
  const [portions, setPortions] = useState(initialData?.portions?.toString() || '1');
  const [categorie, setCategorie] = useState<RecipeCategory>(initialData?.categorie || 'entrée');
  const [difficulte, setDifficulte] = useState<'facile' | 'moyen' | 'difficile'>(initialData?.difficulte || 'facile');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [etapesPreparation, setEtapesPreparation] = useState<{ texte: string; ordre: number }[]>(
    initialData?.etapesPreparation || [{ texte: '', ordre: 1 }]
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [coutEstime, setCoutEstime] = useState(initialData?.coutEstime?.toString() || '0');
  const [variantes, setVariantes] = useState<{ nom: string; modifications: string }[]>(
    initialData?.variantes || []
  );
  const [tutorielVideo, setTutorielVideo] = useState(initialData?.tutorielVideo || '');
  const [commentaires, setCommentaires] = useState<{ userId: string; texte: string; date: string }[]>(
    initialData?.commentaires || []
  );
  const [aiAnalysis, setAiAnalysis] = useState<{
    caloriesTotales: number;
    niveauEpices: number;
    adequationMembres: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' };
  }>({
    caloriesTotales: initialData?.aiAnalysis?.caloriesTotales || 0,
    niveauEpices: initialData?.aiAnalysis?.niveauEpices || 0,
    adequationMembres: initialData?.aiAnalysis?.adequationMembres || {},
  });

  // Animation on index change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);


  useEffect(() => {
    if (nom && ingredients.length && portions) {
      const recipe: Recette = {
        id: 'temp',
        nom,
        ingredients,
        instructions: instructions.split('\n').filter(Boolean),
        tempsPreparation: Number(tempsPreparation) || 0,
        tempsCuisson: tempsCuisson ? Number(tempsCuisson) : undefined,
        portions: Number(portions) || 1,
        categorie,
        difficulte,
        imageUrl: imageUrl || undefined,
        etapesPreparation,
        tags: tags.length ? tags : undefined,
        coutEstime: Number(coutEstime) || undefined,
        variantes: variantes.length ? variantes : undefined,
        tutorielVideo: tutorielVideo || undefined,
        commentaires: commentaires.length ? commentaires : undefined,
        aiAnalysis,
        createurId,
        dateCreation: formatDate(new Date()),
        dateMiseAJour: formatDate(new Date()),
      };
      estimateCost(recipe.id).then(cost => setCoutEstime(cost?.toString() || '0'));
    }
  }, [nom, ingredients, tempsPreparation, tempsCuisson, portions, categorie, difficulte, imageUrl, etapesPreparation, tags, coutEstime, variantes, tutorielVideo, commentaires, aiAnalysis, estimateCost, createurId, instructions]);

  // Ingredient handling
  const handleAddIngredient = useCallback(() => {
    setIngredients(prev => [
      ...prev,
      {
        id: '',
        nom: '',
        quantite: 0,
        unite: 'unité',
        createurId,
        perissable: false,
        stockActuel: 0,
        dateCreation: formatDate(new Date()),
      },
    ]);
    logger.info('Ajout d’un ingrédient', { ingredientsLength: ingredients.length + 1 });
  }, [ingredients.length, createurId]);

  const handleIngredientChange = useCallback(
    (index: number, field: keyof Ingredient, value: string | number | Unit) => {
      const newIngredients = [...ingredients];
      if (field === 'id' && typeof value === 'string') {
        const selectedIngredient = recipes
          .flatMap(r => r.ingredients)
          .find(ing => ing.id === value);
        if (selectedIngredient) {
          newIngredients[index] = {
            ...newIngredients[index],
            id: value,
            nom: selectedIngredient.nom,
            unite: selectedIngredient.unite,
            createurId,
          };
        }
      } else {
        newIngredients[index] = { ...newIngredients[index], [field]: value, createurId };
      }
      setIngredients(newIngredients);
    },
    [ingredients, recipes, createurId]
  );

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’un ingrédient', { removedIndex: index });
  }, []);

  // Etape handling
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
    setEtapesPreparation(prev =>
      prev.filter((_, i) => i !== index).map((etape, idx) => ({ ...etape, ordre: idx + 1 }))
    );
    logger.info('Suppression d’une étape', { removedIndex: index });
  }, []);

  // Variante handling
  const handleAddVariante = useCallback(() => {
    setVariantes(prev => [...prev, { nom: '', modifications: '' }]);
    logger.info('Ajout d’une variante', { variantesLength: variantes.length + 1 });
  }, [variantes.length]);

  const handleVarianteChange = useCallback(
    (index: number, field: 'nom' | 'modifications', value: string) => {
      const newVariantes = [...variantes];
      newVariantes[index] = { ...newVariantes[index], [field]: value };
      setVariantes(newVariantes);
    },
    [variantes]
  );

  const handleRemoveVariante = useCallback((index: number) => {
    setVariantes(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’une variante', { removedIndex: index });
  }, []);

  // Commentaire handling
  const handleAddCommentaire = useCallback(() => {
    setCommentaires(prev => [
      ...prev,
      { userId: createurId, texte: '', date: formatDate(new Date()) },
    ]);
    logger.info('Ajout d’un commentaire', { commentairesLength: commentaires.length + 1 });
  }, [commentaires.length, createurId]);

  const handleCommentaireChange = useCallback((index: number, value: string) => {
    const newCommentaires = [...commentaires];
    newCommentaires[index] = { ...newCommentaires[index], texte: value };
    setCommentaires(newCommentaires);
  }, [commentaires]);

  const handleRemoveCommentaire = useCallback((index: number) => {
    setCommentaires(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’un commentaire', { removedIndex: index });
  }, []);

  // Validation
  const validateStep = useCallback(() => {
    const errors: string[] = [];
    if (index === 0 && !nom) {errors.push('Le nom de la recette est requis.');}
    if (index === 1 && ingredients.length === 0) {errors.push('Au moins un ingrédient est requis.');}
    if (index === 1) {
      ingredients.forEach((ing, i) => {
        if (!ing.id) {errors.push(`L'ingrédient ${i + 1} doit être sélectionné.`);}
        if (ing.quantite <= 0) {errors.push(`La quantité de l'ingrédient ${i + 1} doit être supérieure à 0.`);}
      });
    }
    if (index === 2 && etapesPreparation.every(step => !step.texte.trim()))
      {errors.push('Au moins une étape de préparation est requise.');}
    if (index === 3 && (Number(tempsPreparation) <= 0))
      {errors.push('Le temps de préparation doit être supérieur à 0.');}
    setErrorMessages(errors);
    return errors.length === 0;
  }, [index, nom, ingredients, etapesPreparation, tempsPreparation]);

  // Steps configuration
  const steps: StepConfig[] = [
    {
      title: 'Nom et Catégorie',
      description: 'Donnez un nom savoureux à votre recette et choisissez sa catégorie.',
      icon: 'book-open',
      content: (
        <View style={styles.stepContent}>
          <Input
            value={nom}
            onChangeText={setNom}
            placeholder="Nom de la recette"
            iconName="book-open"
            iconPosition="left"
            keyboardType="default"
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
        </View>
      ),
    },
    {
      title: 'Ingrédients',
      description: 'Ajoutez les ingrédients nécessaires pour votre recette.',
      icon: 'shopping-cart',
      content: (
        <View style={styles.stepContent}>
          {ingredients.map((ingredient, i) => (
            <View key={i} style={styles.ingredientContainer} testID={`ingredient-row-${i}`}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={ingredient.id}
                  onValueChange={(val) => handleIngredientChange(i, 'id', val as string)}
                  style={styles.picker}
                  testID={`ingredient-picker-${i}`}
                >
                  <Picker.Item label="Sélectionner un ingrédient" value="" />
                  {recipes.flatMap(r => r.ingredients).map((ing) => (
                    <Picker.Item key={ing.id} label={ing.nom} value={ing.id} />
                  ))}
                </Picker>
              </View>
              <Input
                value={ingredient.quantite.toString()}
                onChangeText={(val) => handleIngredientChange(i, 'quantite', Number(val) || 0)}
                placeholder="Quantité"
                iconName="numeric"
                iconPosition="left"
                keyboardType="numeric"
              />
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={ingredient.unite}
                  onValueChange={(val) => handleIngredientChange(i, 'unite', val as Unit)}
                  style={styles.picker}
                  testID={`unit-picker-${i}`}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
              <GradientButton
                title="Supprimer"
                onPress={() => handleRemoveIngredient(i)}
                style={styles.removeButton}
                disabled={loading || recipesLoading}
              />
            </View>
          ))}
          <GradientButton
            title="Ajouter un ingrédient"
            onPress={handleAddIngredient}
            style={styles.addButton}
            disabled={loading || recipesLoading}
          />
        </View>
      ),
    },
    {
      title: 'Étapes de Préparation',
      description: 'Décrivez les étapes pour préparer votre recette.',
      icon: 'format-list-numbered',
      content: (
        <View style={styles.stepContent}>
          {etapesPreparation.map((etape, i) => (
            <View key={i} style={styles.etapeContainer} testID={`etape-row-${i}`}>
              <Input
                value={etape.texte}
                onChangeText={(val) => handleEtapeChange(i, val)}
                placeholder={`Étape ${etape.ordre}`}
                iconName="format-list-numbered"
                iconPosition="left"
                keyboardType="default"
                multiline
                numberOfLines={2}
              />
              <GradientButton
                title="Supprimer"
                onPress={() => handleRemoveEtape(i)}
                style={styles.removeButton}
                disabled={loading || recipesLoading}
              />
            </View>
          ))}
          <GradientButton
            title="Ajouter une étape"
            onPress={handleAddEtape}
            style={styles.addButton}
            disabled={loading || recipesLoading}
          />
        </View>
      ),
    },
    {
      title: 'Détails Finaux',
      description: 'Complétez les détails, ajoutez des variantes et analyses.',
      icon: 'clock',
      content: (
        <View style={styles.stepContent}>
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
          <Input
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="URL de l'image"
            iconName="image"
            iconPosition="left"
            keyboardType="url"
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
          <Input
            value={tags.join(', ')}
            onChangeText={(val) => setTags(val.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Tags (séparés par des virgules)"
            iconName="label"
            iconPosition="left"
            keyboardType="default"
          />
          <Input
            value={tutorielVideo}
            onChangeText={setTutorielVideo}
            placeholder="URL du tutoriel vidéo"
            iconName="video"
            iconPosition="left"
            keyboardType="url"
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
          {/* Variantes */}
          {variantes.map((variante, i) => (
            <View key={i} style={styles.varianteContainer} testID={`variante-row-${i}`}>
              <Input
                value={variante.nom}
                onChangeText={(val) => handleVarianteChange(i, 'nom', val)}
                placeholder="Nom de la variante"
                iconName="swap-horizontal"
                iconPosition="left"
                keyboardType="default"
              />
              <Input
                value={variante.modifications}
                onChangeText={(val) => handleVarianteChange(i, 'modifications', val)}
                placeholder="Modifications"
                iconName="pencil"
                iconPosition="left"
                keyboardType="default"
                multiline
                numberOfLines={2}
              />
              <GradientButton
                title="Supprimer"
                onPress={() => handleRemoveVariante(i)}
                style={styles.removeButton}
                disabled={loading || recipesLoading}
              />
            </View>
          ))}
          <GradientButton
            title="Ajouter une variante"
            onPress={handleAddVariante}
            style={styles.addButton}
            disabled={loading || recipesLoading}
          />
          {/* Commentaires */}
          {commentaires.map((commentaire, i) => (
            <View key={i} style={styles.commentaireContainer} testID={`commentaire-row-${i}`}>
              <Input
                value={commentaire.texte}
                onChangeText={(val) => handleCommentaireChange(i, val)}
                placeholder="Commentaire"
                iconName="comment"
                iconPosition="left"
                keyboardType="default"
                multiline
                numberOfLines={2}
              />
              <GradientButton
                title="Supprimer"
                onPress={() => handleRemoveCommentaire(i)}
                style={styles.removeButton}
                disabled={loading || recipesLoading}
              />
            </View>
          ))}
          <GradientButton
            title="Ajouter un commentaire"
            onPress={handleAddCommentaire}
            style={styles.addButton}
            disabled={loading || recipesLoading}
          />
          {/* AI Analysis */}
          <Input
            value={aiAnalysis.caloriesTotales.toString()}
            onChangeText={(val) =>
              setAiAnalysis({ ...aiAnalysis, caloriesTotales: Number(val) || 0 })
            }
            placeholder="Calories totales"
            iconName="fire"
            iconPosition="left"
            keyboardType="numeric"
          />
          <Input
            value={aiAnalysis.niveauEpices.toString()}
            onChangeText={(val) =>
              setAiAnalysis({ ...aiAnalysis, niveauEpices: Number(val) || 0 })
            }
            placeholder="Niveau d'épices (1-5)"
            iconName="chili-hot"
            iconPosition="left"
            keyboardType="numeric"
          />
        </View>
      ),
    },
  ];

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep() && index < steps.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex(index + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
      });
    } else if (!validateStep()) {
      setModalErrorVisible(true);
    }
  }, [validateStep, index, steps.length, fadeAnim, slideAnim]);

  const handleBack = useCallback(() => {
    if (index > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex(index - 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
      });
    }
  }, [index, fadeAnim, slideAnim]);

  const handleCancelPress = useCallback(() => {
    setModalCancelVisible(true);
  }, []);

  const confirmCancel = useCallback(() => {
    setModalCancelVisible(false);
    onCancel();
  }, [onCancel]);

  const handleSubmit = useCallback(async () => {
    if (validateStep()) {
      const recipeData: Omit<Recette, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        nom,
        ingredients,
        instructions: instructions.split('\n').filter(Boolean),
        tempsPreparation: Number(tempsPreparation) || 0,
        tempsCuisson: tempsCuisson ? Number(tempsCuisson) : undefined,
        portions: Number(portions) || 1,
        categorie,
        difficulte,
        imageUrl: imageUrl || undefined,
        etapesPreparation,
        tags: tags.length ? tags : undefined,
        coutEstime: Number(coutEstime) || undefined,
        variantes: variantes.length ? variantes : undefined,
        tutorielVideo: tutorielVideo || undefined,
        commentaires: commentaires.length ? commentaires : undefined,
        aiAnalysis: Object.keys(aiAnalysis).length ? aiAnalysis : undefined,
        createurId,
      };
      logger.info('Soumission de la recette', { recipe: recipeData });
      const recipeId = await addRecipe(recipeData);
      if (recipeId) {
        onSubmit(recipeData);
      } else {
        setErrorMessages(['Échec de l’ajout de la recette.']);
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
    }
  }, [
    validateStep,
    nom,
    ingredients,
    instructions,
    tempsPreparation,
    tempsCuisson,
    portions,
    categorie,
    difficulte,
    imageUrl,
    etapesPreparation,
    tags,
    coutEstime,
    variantes,
    tutorielVideo,
    commentaires,
    aiAnalysis,
    createurId,
    addRecipe,
    onSubmit,
  ]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const { title, description, icon, content } = steps[index];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/koki.jpg')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', COLORS.backgroundDark]}
          style={styles.gradientOverlay}
        />
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerDescription}>{description}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <FontAwesome name={icon} size={40} color={COLORS.secondary} style={styles.stepIcon} />
          {content}
        </Animated.View>
        <View style={styles.progressContainer}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, index === i && styles.activeDot]}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.navButton, index === 0 && styles.disabledButton]}
          disabled={index === 0 || loading || recipesLoading}
        >
          <FontAwesome name="arrow-left" size={16} color={COLORS.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCancelPress}
          style={styles.navButton}
          disabled={loading || recipesLoading}
        >
          <FontAwesome name="times" size={16} color={COLORS.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        {index === steps.length - 1 ? (
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.nextButtonOuter}
            disabled={loading || recipesLoading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.buttonText}>Enregistrer</Text>
              <FontAwesome name="check" size={16} color={COLORS.buttonText} style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextButtonOuter}
            disabled={loading || recipesLoading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.buttonText}>Suivant</Text>
              <FontAwesome name="arrow-right" size={16} color={COLORS.buttonText} style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
      <ModalComponent
        visible={modalErrorVisible}
        onClose={() => setModalErrorVisible(false)}
        title="Erreur"
        showCloseButton
        animationType="fade"
      >
        <Image
          source={require('../../assets/icons/error.png')}
          style={styles.modalImage}
          resizeMode="contain"
        />
        <Text style={styles.modalText}>Veuillez corriger les erreurs suivantes :</Text>
        {errorMessages.map((err, i) => (
          <Text key={i} style={styles.errorDetail} testID={`error-detail-${i}`}>{`- ${err}`}</Text>
        ))}
      </ModalComponent>
      <ModalComponent
        visible={modalCancelVisible}
        onClose={() => setModalCancelVisible(false)}
        title="Confirmer l'annulation"
        showCloseButton={false}
        animationType="fade"
      >
        <Image
          source={require('../../assets/icons/alert.png')}
          style={styles.modalImage}
          resizeMode="contain"
        />
        <Text style={styles.modalText}>Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.</Text>
        <View style={styles.modalButtonContainer}>
          <GradientButton
            title="Annuler"
            onPress={() => setModalCancelVisible(false)}
            style={styles.modalButton}
          />
          <GradientButton
            title="Confirmer"
            onPress={confirmCancel}
            style={[styles.modalButton, styles.confirmButton]}
          />
        </View>
      </ModalComponent>
      {recipesError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{recipesError}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    height: height * 0.3,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  headerTitle: {
    position: 'absolute',
    bottom: SPACING.l,
    left: SPACING.m,
    color: COLORS.text,
    fontSize: FONTS.title,
    fontWeight: '700',
  },
  headerDescription: {
    position: 'absolute',
    bottom: SPACING.s,
    left: SPACING.m,
    color: COLORS.textSecondary,
    fontSize: FONTS.description,
  },
  scrollContent: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.xl * 2,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.m,
    marginVertical: SPACING.m,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  stepIcon: {
    marginBottom: SPACING.m,
  },
  stepContent: {
    width: '100%',
  },
  ingredientContainer: {
    marginVertical: SPACING.s,
    flexDirection: 'column',
  },
  etapeContainer: {
    marginVertical: SPACING.s,
    flexDirection: 'column',
  },
  varianteContainer: {
    marginVertical: SPACING.s,
    flexDirection: 'column',
  },
  commentaireContainer: {
    marginVertical: SPACING.s,
    flexDirection: 'column',
  },
  pickerContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    marginVertical: SPACING.xs,
  },
  picker: {
    color: COLORS.text,
    height: 50,
  },
  addButton: {
    backgroundColor: '#2980b9',
    marginVertical: SPACING.s,
  },
  removeButton: {
    backgroundColor: '#E74C3C',
    marginVertical: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.m,
    gap: SPACING.s,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#777',
  },
  activeDot: {
    backgroundColor: COLORS.secondary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonOuter: {
    flex: 1,
    marginLeft: SPACING.m,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
  buttonIcon: {
    marginHorizontal: SPACING.xs,
  },
  modalText: {
    color: COLORS.text,
    fontSize: FONTS.modalText,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  errorDetail: {
    color: '#E74C3C',
    fontSize: FONTS.modalText,
    textAlign: 'left',
    marginTop: SPACING.xs,
  },
  errorContainer: {
    padding: SPACING.s,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    marginVertical: SPACING.m,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: FONTS.description,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 100,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  confirmButton: {
    backgroundColor: '#E74C3C',
  },
});
