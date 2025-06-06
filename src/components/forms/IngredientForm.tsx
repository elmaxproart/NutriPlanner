import React, { useState, useEffect, useCallback } from 'react';
import {  StyleSheet, ScrollView, Text } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateIngredient } from '../../utils/dataValidators';
import { formatDate, generateId } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Ingredient } from '../../constants/entities';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Unit } from '../../constants/units';
import { IngredientCategory } from '../../constants/categories';

interface IngredientFormProps {
  onSubmit: (ingredient: Ingredient) => void;
  loading?: boolean;
  initialData?: Partial<Ingredient>;
  familyId: string;
  createurId: string;
}


export const IngredientForm = ({ onSubmit, loading = false, initialData, familyId, createurId }: IngredientFormProps) => {
  const [nom, setNom] = useState(initialData?.nom || '');
  const [quantite, setQuantite] = useState(initialData?.quantite?.toString() || '1');
  const [unite, setUnite] = useState<Unit>(initialData?.unite || 'unité');
  const [categorie, setCategorie] = useState<IngredientCategory | undefined>(initialData?.categorie);
  const [prixUnitaire, setPrixUnitaire] = useState(initialData?.prixUnitaire?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [perissable, setPerissable] = useState(initialData?.perissable || false);
  const [datePeremption, setDatePeremption] = useState(initialData?.datePeremption || '');
  const [dateAchat, setDateAchat] = useState(initialData?.dateAchat || '');
  const [stockActuel, setStockActuel] = useState(initialData?.stockActuel?.toString() || '0');
  const [marque, setMarque] = useState(initialData?.marque || '');
  const [error, setError] = useState<string[]>([]);
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useSharedValue(0);

  const validateForm = useCallback(() => {
    const ingredientData: Partial<Ingredient> = {
      nom,
      quantite: Number(quantite),
      unite,
      categorie,
      prixUnitaire: prixUnitaire ? Number(prixUnitaire) : undefined,
      description,
      perissable,
      datePeremption,
      dateAchat,
      stockActuel: Number(stockActuel),
      marque,
      familyId,
      createurId,
    };
    const errors = validateIngredient(ingredientData as Ingredient);
    setError(errors);
    return errors.length === 0;
  }, [nom, quantite, unite, categorie, prixUnitaire, description, perissable, datePeremption, dateAchat, stockActuel, marque, familyId, createurId]);

  useEffect(() => {
    validateForm();
    fadeAnim.value = withTiming(error.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [nom, quantite, unite, categorie, prixUnitaire, description, perissable, datePeremption, dateAchat, stockActuel, marque, familyId, createurId, validateForm, error.length, fadeAnim]);

  const handleSubmit = () => {
    if (validateForm()) {
      const ingredientData: Ingredient = {
        id: initialData?.id || generateId('ingredient'),
        familyId,
        createurId,
        dateCreation: formatDate(new Date()),
        dateMiseAJour: initialData?.dateMiseAJour || formatDate(new Date()),
        nom,
        quantite: Number(quantite),
        unite,
        categorie,
        prixUnitaire: prixUnitaire ? Number(prixUnitaire) : undefined,
        description,
        perissable,
        datePeremption,
        dateAchat,
        stockActuel: Number(stockActuel),
        marque,
        fournisseur: initialData?.fournisseur || [],
        valeurNutritionnelle: initialData?.valeurNutritionnelle || {
          calories: 0,
          proteines: 0,
          glucides: 0,
          lipides: 0,
        },
      };
      setProgress(0.5);
      logger.info('Soumission de l\'ingrédient', { ingredient: ingredientData });
      setTimeout(() => {
        onSubmit(ingredientData);
        setProgress(1);
        setModalSuccessVisible(true);
      }, 500);
    } else {
      setModalErrorVisible(true);
      logger.warn('Validation échouée', { errors: error });
    }
  };

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input
        value={nom}
        onChangeText={setNom}
        placeholder="Nom de l'ingrédient"
        iconName="food"
        iconPosition="left"
        keyboardType="default"
      />
      <Input
        value={quantite}
        onChangeText={setQuantite}
        placeholder="Quantité"
        iconName="numeric"
        iconPosition="left"
        keyboardType="numeric"
      />
      <Input
        value={unite}
        onChangeText={(val) => setUnite(val as Unit)}
        placeholder="Unité"
        iconName="scale"
        iconPosition="left"
        editable={false}
      />
      <Input
        value={categorie?.toString() || ''}
        onChangeText={(val) => setCategorie(val as IngredientCategory)}
        placeholder="Catégorie"
        iconName="tag"
        iconPosition="left"
        editable={false}
      />
      <Input
        value={prixUnitaire}
        onChangeText={setPrixUnitaire}
        placeholder="Prix unitaire"
        iconName="currency-eur"
        iconPosition="left"
        keyboardType="decimal-pad"
      />
      <Input
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        iconName="note"
        iconPosition="left"
        keyboardType="default"
        multiline
        numberOfLines={2}
      />
      <Input
        value={perissable ? 'Oui' : 'Non'}
        onChangeText={(val) => setPerissable(val === 'Oui')}
        placeholder="Périssable"
        iconName="clock"
        iconPosition="left"
        editable={false}
      />
      <Input
        value={datePeremption}
        onChangeText={setDatePeremption}
        placeholder="Date de péremption (YYYY-MM-DD)"
        iconName="calendar"
        iconPosition="left"
        keyboardType="default"
      />
      <Input
        value={dateAchat}
        onChangeText={setDateAchat}
        placeholder="Date d'achat (YYYY-MM-DD)"
        iconName="calendar-check"
        iconPosition="left"
        keyboardType="default"
      />
      <Input
        value={stockActuel}
        onChangeText={setStockActuel}
        placeholder="Stock actuel"
        iconName="warehouse"
        iconPosition="left"
        keyboardType="numeric"
      />
      <Input
        value={marque}
        onChangeText={setMarque}
        placeholder="Marque"
        iconName="label"
        iconPosition="left"
        keyboardType="default"
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
        <Text style={styles.modalText}>Ingrédient enregistré avec succès !</Text>
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
          <Text key={index} style={styles.errorDetail}>{`- ${err}`}</Text>
        ))}
      </ModalComponent>
      {error.length > 0 && (
        <Animated.View style={[styles.errorContainer, animatedErrorStyle]}>
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



