import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateMenu } from '../../utils/dataValidators';
import { formatDate, generateId } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Menu } from '../../constants/entities';
import { MealType, MenuStatus } from '../../constants/categories';
import { useMenus } from '../../hooks/useMenus';
import { useRecipes } from '../../hooks/useRecipes';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';


const MEAL_TYPE_OPTIONS: MealType[] = [
  'petit-déjeuner',
  'déjeuner',
  'dîner',
  'collation',
];



const MENU_STATUS_OPTIONS: MenuStatus[] = [
  'planifié',
  'terminé',
  'annulé',
];

interface MenuFormProps {
  onSubmit: (menu: Menu) => void;
  loading?: boolean;
  initialData?: Partial<Menu>;
  familyId: string;
  createurId: string;
}

export const MenuForm = ({ onSubmit, loading = false, initialData, familyId, createurId }: MenuFormProps) => {
  const { addMenu, estimateMenuCost } = useMenus(createurId, familyId);
  const { recipes, fetchRecipes } = useRecipes(createurId, familyId);

  const [date, setDate] = useState(initialData?.date || formatDate(new Date()));
  const [typeRepas, setTypeRepas] = useState<MealType>(initialData?.typeRepas || MEAL_TYPE_OPTIONS[0]); // Use first option as default
  const [recettes, setRecettes] = useState<{ recetteId: string; portionsServies: number }[]>(
    initialData?.recettes || [{ recetteId: '', portionsServies: 1 }]
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [coutTotalEstime, setCoutTotalEstime] = useState(initialData?.coutTotalEstime?.toString() || '0');
  const [statut, setStatut] = useState<MenuStatus>(initialData?.statut || MENU_STATUS_OPTIONS[0]); // Use first option as default
  const [formErrors, setFormErrors] = useState<string[]>([]); // Renamed 'error' to 'formErrors' for clarity
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const validateForm = useCallback(() => {
    const menuData: Partial<Menu> = {
      date,
      typeRepas,
      recettes,
      description,
      notes,
      coutTotalEstime: Number(coutTotalEstime),
      statut,
      familyId,
      createurId,
    };
    const errors = validateMenu(menuData as Menu);
    setFormErrors(errors);
    return errors.length === 0;
  }, [date, typeRepas, recettes, description, notes, coutTotalEstime, statut, familyId, createurId]);

  const calculateEstimatedMenuCost = useCallback(async () => {
    // We need a complete Menu object for estimation. Provide sensible defaults if initialData is incomplete.
    const menuForEstimation: Menu = {
      id: initialData?.id || generateId('menu'),
      dateCreation: initialData?.dateCreation || formatDate(new Date()),
      dateMiseAJour: initialData?.dateMiseAJour || formatDate(new Date()),
      familyId,
      createurId,
      date,
      typeRepas,
      recettes,
      description,
      notes,
      coutTotalEstime: 0, // This will be calculated
      statut,
    };
    const cost = await estimateMenuCost(menuForEstimation);
    setCoutTotalEstime(cost?.toString() || '0');
  }, [date, typeRepas, recettes, description, notes, statut, familyId, createurId, estimateMenuCost, initialData]);

  useEffect(() => {
    calculateEstimatedMenuCost();
    validateForm(); // Re-validate when relevant data changes
    fadeAnim.value = withTiming(formErrors.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [calculateEstimatedMenuCost, validateForm, formErrors.length, fadeAnim]);

  const handleAddRecette = useCallback(() => {
    setRecettes(prev => [...prev, { recetteId: '', portionsServies: 1 }]);
    logger.info('Ajout d’une recette au menu', { recettesLength: recettes.length + 1 });
  }, [recettes.length]);

  const handleRecetteChange = useCallback((index: number, field: keyof typeof recettes[0], value: string | number) => {
    const newRecettes = [...recettes];
    newRecettes[index] = { ...newRecettes[index], [field]: value };
    setRecettes(newRecettes);
  }, [recettes]);

  const handleRemoveRecette = useCallback((index: number) => {
    setRecettes(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’une recette du menu', { removedIndex: index });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      const menuData: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        familyId,
        createurId,
        date,
        typeRepas,
        recettes,
        description,
        notes,
        coutTotalEstime: Number(coutTotalEstime),
        statut,
      };
      setProgress(0.5);
      logger.info('Soumission du menu', { menu: menuData });
      const menuId = await addMenu(menuData);
      if (menuId) {
        setProgress(1);
        setModalSuccessVisible(true);
        onSubmit({ ...menuData, id: menuId, dateCreation: formatDate(new Date()), dateMiseAJour: formatDate(new Date()) });
      } else {
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
      logger.warn('Validation échouée', { errors: formErrors });
    }
  }, [validateForm, familyId, createurId, date, typeRepas, recettes, description, notes, coutTotalEstime, statut, addMenu, onSubmit, formErrors]);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.formTitle}>Créer ou Modifier un Menu</Text>

      <Input
        value={date}
        onChangeText={setDate}
        placeholder="Date (AAAA-MM-JJ)"
        iconName="calendar"
        iconPosition="left"
        keyboardType="default"
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={typeRepas}
          onValueChange={(itemValue) => setTypeRepas(itemValue as MealType)}
          style={styles.picker}
        >
          {MEAL_TYPE_OPTIONS.map((type) => (
            <Picker.Item key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} value={type} />
          ))}
        </Picker>
      </View>

      <Text style={styles.sectionTitle}>Recettes du Menu</Text>
      {recettes.map((recette, index) => (
        <View key={index} style={styles.itemRowContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={recette.recetteId}
              onValueChange={(itemValue) => handleRecetteChange(index, 'recetteId', itemValue as string)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une recette" value="" />
              {recipes.map((r) => (
                <Picker.Item key={r.id} label={r.nom} value={r.id} />
              ))}
            </Picker>
          </View>
          <Input
            value={recette.portionsServies.toString()}
            onChangeText={(val) => handleRecetteChange(index, 'portionsServies', Number(val) || 1)}
            placeholder="Portions servies"
            iconName="account-group"
            iconPosition="left"
            keyboardType="numeric"
          />
          <GradientButton
            title="Supprimer"
            onPress={() => handleRemoveRecette(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter une recette"
        onPress={handleAddRecette}
        style={styles.addButton}
        disabled={loading}
      />

      <Input
        value={description}
        onChangeText={setDescription}
        placeholder="Description du menu (optionnel)"
        iconName="note"
        iconPosition="left"
        keyboardType="default"
        multiline
        numberOfLines={2}
      />

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

      <Input
        value={coutTotalEstime}
        onChangeText={setCoutTotalEstime} // Keep onChangeText for consistency, though editable is false
        placeholder="Coût total estimé"
        iconName="currency-eur"
        iconPosition="left"
        keyboardType="decimal-pad"
        editable={false} // This field is calculated, not directly editable
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={statut}
          onValueChange={(itemValue) => setStatut(itemValue as MenuStatus)}
          style={styles.picker}
        >
          {MENU_STATUS_OPTIONS.map((status) => (
            <Picker.Item key={status} label={status.charAt(0).toUpperCase() + status.slice(1)} value={status} />
          ))}
        </Picker>
      </View>

      <GradientButton
        title={loading ? 'Enregistrement en cours...' : 'Enregistrer le Menu'}
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
        <Text style={styles.modalText}>Votre menu a été enregistré avec succès !</Text>
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
    minHeight: 50, // Ensure consistent height with Input
    justifyContent: 'center',
  },
  picker: {
    color: '#ffffff',
    height: 50,
    width: '100%',
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
