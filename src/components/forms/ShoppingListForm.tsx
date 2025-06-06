import React, { useState, useEffect, useCallback} from 'react';
import { View, StyleSheet, ScrollView, Text, Switch } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateListeCourses } from '../../utils/dataValidators';
import { formatDate } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Ingredient, ListeCourses } from '../../constants/entities';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { useFirestore } from '../../hooks/useFirestore';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { Unit } from '../../constants/units';

// Define status options for the shopping list
type ShoppingListStatus = 'en cours' | 'terminée'|'archivée';
const SHOPPING_LIST_STATUS_OPTIONS: ShoppingListStatus[] = ['en cours', 'terminée','archivée'];

// Define all possible unit options from your Unit type
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

interface ShoppingListFormProps {
  onSubmit: (shoppingList: ListeCourses) => void;
  loading?: boolean;
  initialData?: Partial<ListeCourses>;
  familyId: string;
  createurId: string;
}

export const ShoppingListForm = ({ onSubmit, loading = false, initialData, familyId, createurId }: ShoppingListFormProps) => {
  const { addShoppingList } = useShoppingLists(createurId, familyId);
  const { getCollection } = useFirestore(createurId, familyId);

  const [nom, setNom] = useState(initialData?.nom || '');
  const [items, setItems] = useState<{ ingredientId: string; quantite: number; unite: Unit; achete: boolean; magasinSuggeré?: string }[]>(
    initialData?.items || [{ ingredientId: '', quantite: 0, unite: UNIT_OPTIONS[4], achete: false }] // Default to 'unité'
  );
  const [budgetEstime, setBudgetEstime] = useState(initialData?.budgetEstime?.toString() || '0');
  const [budgetReel, setBudgetReel] = useState(initialData?.budgetReel?.toString() || '');
  const [statut, setStatut] = useState<ShoppingListStatus>(initialData?.statut || SHOPPING_LIST_STATUS_OPTIONS[0]); // Default to 'en cours'
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [formErrors, setFormErrors] = useState<string[]>([]); // Renamed 'error' for clarity
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


  const validateForm = useCallback(() => {
    const shoppingListData: Partial<ListeCourses> = {
      nom,
      items,
      budgetEstime: Number(budgetEstime),
      budgetReel: budgetReel ? Number(budgetReel) : undefined,
      statut,
      notes,
      familyId,
      createurId,
    };
    const errors = validateListeCourses(shoppingListData as ListeCourses);
    setFormErrors(errors);
    return errors.length === 0;
  }, [nom, items, budgetEstime, budgetReel, statut, notes, familyId, createurId]);

  // Calculate estimated budget more accurately
  const calculateEstimatedBudget = useCallback(() => {
    const cost = items.reduce((sum, item) => {
      const ingredient = availableIngredients.find(i => i.id === item.ingredientId);
      return sum + (ingredient?.prixUnitaire || 0) * item.quantite;
    }, 0);
    setBudgetEstime(cost.toFixed(2)); // Format to 2 decimal places
  }, [items, availableIngredients]);

  useEffect(() => {
    calculateEstimatedBudget(); // Recalculate when items or availableIngredients change
    validateForm();
    fadeAnim.value = withTiming(formErrors.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [calculateEstimatedBudget, validateForm, formErrors.length, fadeAnim]);

  const handleAddItem = useCallback(() => {
    setItems(prev => [...prev, { ingredientId: '', quantite: 0, unite: UNIT_OPTIONS[4], achete: false }]);
    logger.info('Ajout d’un item à la liste de courses', { itemsLength: items.length + 1 });
  }, [items.length]);

  const handleItemChange = useCallback((index: number, field: keyof typeof items[0], value: string | number | boolean | Unit) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }, [items]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’un item de la liste de courses', { removedIndex: index });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      const shoppingListData: Omit<ListeCourses, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        familyId,
        createurId,
        nom,
        items,
        budgetEstime: Number(budgetEstime),
        budgetReel: budgetReel ? Number(budgetReel) : undefined,
        statut,
        notes,
      };
      setProgress(0.5);
      logger.info('Soumission de la liste de courses', { shoppingList: shoppingListData });
      const shoppingListId = await addShoppingList(shoppingListData);
      if (shoppingListId) {
        setProgress(1);
        setModalSuccessVisible(true);
        onSubmit({ ...shoppingListData, id: shoppingListId, dateCreation: formatDate(new Date()), dateMiseAJour: formatDate(new Date()) });
      } else {
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
      logger.warn('Validation échouée', { errors: formErrors });
    }
  }, [validateForm, familyId, createurId, nom, items, budgetEstime, budgetReel, statut, notes, addShoppingList, onSubmit, formErrors]);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.formTitle}>Créer ou Modifier une Liste de Courses</Text>

      <Input
        value={nom}
        onChangeText={setNom}
        placeholder="Nom de la liste"
        iconName="cart"
        iconPosition="left"
        keyboardType="default"
      />

      <Text style={styles.sectionTitle}>Articles de la Liste</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemRowContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.ingredientId}
              onValueChange={(itemValue) => handleItemChange(index, 'ingredientId', itemValue as string)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un ingrédient" value="" />
              {availableIngredients.map((ing) => (
                <Picker.Item key={ing.id} label={ing.nom} value={ing.id} />
              ))}
            </Picker>
          </View>
          <Input
            value={item.quantite.toString()}
            onChangeText={(val) => handleItemChange(index, 'quantite', Number(val) || 0)}
            placeholder="Quantité"
            iconName="numeric"
            iconPosition="left"
            keyboardType="numeric"
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.unite}
              onValueChange={(itemValue) => handleItemChange(index, 'unite', itemValue as Unit)}
              style={styles.picker}
            >
              {UNIT_OPTIONS.map((unit) => (
                <Picker.Item key={unit} label={unit.charAt(0).toUpperCase() + unit.slice(1)} value={unit} />
              ))}
            </Picker>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Acheté :</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={item.achete ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(val) => handleItemChange(index, 'achete', val)}
              value={item.achete}
            />
          </View>

          <Input
            value={item.magasinSuggeré || ''}
            onChangeText={(val) => handleItemChange(index, 'magasinSuggeré', val)}
            placeholder="Magasin suggéré (optionnel)"
            iconName="store"
            iconPosition="left"
            keyboardType="default"
          />

          <GradientButton
            title="Supprimer l'article"
            onPress={() => handleRemoveItem(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter un article"
        onPress={handleAddItem}
        style={styles.addButton}
        disabled={loading}
      />

      <Input
        value={budgetEstime}
        onChangeText={setBudgetEstime} // Keep for consistency, but it's editable=false
        placeholder="Budget estimé"
        iconName="currency-eur"
        iconPosition="left"
        keyboardType="decimal-pad"
        editable={false} // This field is calculated automatically
      />

      <Input
        value={budgetReel}
        onChangeText={setBudgetReel}
        placeholder="Budget réel (une fois les courses faites)"
        iconName="cash-usd"
        iconPosition="left"
        keyboardType="decimal-pad"
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={statut}
          onValueChange={(itemValue) => setStatut(itemValue as ShoppingListStatus)}
          style={styles.picker}
        >
          {SHOPPING_LIST_STATUS_OPTIONS.map((status) => (
            <Picker.Item key={status} label={status.charAt(0).toUpperCase() + status.slice(1)} value={status} />
          ))}
        </Picker>
      </View>

      <Input
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes additionnelles (optionnel)"
        iconName="note-text"
        iconPosition="left"
        keyboardType="default"
        multiline
        numberOfLines={2}
      />

      <GradientButton
        title={loading ? 'Enregistrement en cours...' : 'Enregistrer la Liste'}
        onPress={handleSubmit}
        disabled={loading || formErrors.length > 0}
        style={styles.submitButton}
      />

      {loading && <ProgressBar progress={progress} animated barColor="#FF6B00" />}

      <ModalComponent
        visible={modalSuccessVisible}
        onClose={() => setModalSuccessVisible(false)}
        title="Succès !"
        showCloseButton
      >
        <Text style={styles.modalText}>Votre liste de courses a été enregistrée avec succès !</Text>
      </ModalComponent>

      <ModalComponent
        visible={modalErrorVisible}
        onClose={() => setModalErrorVisible(false)}
        title="Erreur de Validation"
        showCloseButton
        animationType="fade"
      >
        <Text style={styles.modalText}>Veuillez corriger les problèmes suivants :</Text>
        {formErrors.map((err, index) => (
          <Text key={index} style={styles.errorDetail}>{`- ${err}`}</Text>
        ))}
      </ModalComponent>

      {formErrors.length > 0 && (
        <Animated.View style={[styles.errorContainer, animatedErrorStyle]}>
          <Text style={styles.errorText}>Des erreurs ont été détectées. Veuillez consulter le message d'erreur ci-dessus.</Text>
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
  formTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  itemRowContainer: {
    marginVertical: 10,
    // Adjust layout for multiple inputs per item
    flexDirection: 'column', // Changed to column for better stacking on small screens
    alignItems: 'stretch', // Stretch items to fill width
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a', // Slightly darker background for each item
  },
  pickerContainer: {
    flex: 1,
    marginVertical: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    color: '#ffffff',
    height: 50,
    width: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
    paddingHorizontal: 10,
    minHeight: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  switchLabel: {
    color: '#ffffff',
    fontSize: 16,
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
