import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateBudget } from '../../utils/dataValidators';
import { formatDate, generateId } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Budget } from '../../constants/entities'; // Assurez-vous que cette entité est correcte
import { Currency } from '../../constants/config'; // Assurez-vous que ce type est correct
import { useBudget } from '../../hooks/useBudget'; // Import du hook useBudget
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'react-native-animatable';

// Définir les options statiques pour les catégories de dépense
const EXPENSE_CATEGORIES = ['nourriture', 'hygiène', 'entretien', 'autre'] as const;
const CURRENCY_OPTIONS: Currency[] = ['FCFA','EUR', 'USD']; // Ordre basé sur la localisation (Cameroun)

interface BudgetFormProps {
  onSubmit: (budget: Budget) => void;
  loading?: boolean; // Le loading prop du parent, si passé
  initialData?: Partial<Budget>;
  familyId: string;
  createurId: string;
}

export const BudgetForm = ({ onSubmit, loading: parentLoading = false, initialData, familyId, createurId }: BudgetFormProps) => {


  const { addBudget, checkBudgetAlerts, loading: hookLoading } = useBudget(createurId, familyId);


  const isLoading = parentLoading || hookLoading;

  // États du formulaire
  const [mois, setMois] = useState(initialData?.mois || new Date().toISOString().slice(0, 7));
  const [plafond, setPlafond] = useState(initialData?.plafond?.toString() || '0');
  const [devise, setDevise] = useState<Currency | 'FCFA'>(initialData?.devise || 'FCFA');
  const [depenses, setDepenses] = useState<Budget['depenses']>(
    initialData?.depenses && initialData.depenses.length > 0
      ? initialData.depenses
      : [{ date: formatDate(new Date()), montant: 0, description: '', categorie: 'nourriture', preuveAchatUrl: undefined }]
  );

  // États pour les erreurs et alertes
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<string[]>([]); // Pour les alertes spécifiques au budget
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [progressBarProgress, setProgressBarProgress] = useState(0); // Renommé pour éviter le conflit avec 'progress' dans le style
  const fadeAnim = useSharedValue(0);

  // Fonction de validation du formulaire
  const validateForm = useCallback(() => {
    // Les dépenses doivent avoir des montants en nombres pour la validation
    const budgetDataForValidation: Budget = {
      id: initialData?.id || generateId('temp'), // ID temporaire pour la validation si c'est un nouveau budget
      familyId,
      createurId,
      dateCreation: initialData?.dateCreation || formatDate(new Date()),
      dateMiseAJour: initialData?.dateMiseAJour || formatDate(new Date()),
      mois,
      plafond: Number(plafond),
      devise,
      depenses: depenses.map(d => ({ ...d, montant: Number(d.montant) })),
    };
    const errors = validateBudget(budgetDataForValidation);
    setFormErrors(errors);
    return errors.length === 0;
  }, [mois, plafond, devise, depenses, familyId, createurId, initialData]);

  // useEffect pour la validation et les alertes (déclenché lors des changements d'état du formulaire)
  useEffect(() => {
    const isValid = validateForm();
    fadeAnim.value = withTiming(formErrors.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });

    // Vérifier les alertes budgétaires si le formulaire est potentiellement valide
    if (isValid) {
      const budgetForAlerts: Budget = {
        id: initialData?.id || generateId('temp'),
        familyId,
        createurId,
        dateCreation: initialData?.dateCreation || formatDate(new Date()),
        dateMiseAJour: initialData?.dateMiseAJour || formatDate(new Date()),
        mois,
        plafond: Number(plafond),
        devise,
        depenses: depenses.map(d => ({ ...d, montant: Number(d.montant) })),
      };
      const alerts = checkBudgetAlerts(budgetForAlerts);
      setBudgetAlerts(alerts);
    } else {
      setBudgetAlerts([]); // Effacer les alertes si le formulaire a des erreurs de base
    }
  }, [validateForm, formErrors.length, fadeAnim, mois, plafond, devise, depenses, familyId, createurId, checkBudgetAlerts, initialData]);


  // Handlers pour la gestion des dépenses individuelles
  const handleAddDepense = useCallback(() => {
    setDepenses(prev => [
      ...prev,
      { date: formatDate(new Date()), montant: 0, description: '', categorie: 'nourriture', preuveAchatUrl: undefined },
    ]);
    logger.info('Ajout d’une nouvelle ligne de dépense.');
  }, []);

  const handleDepenseChange = useCallback((index: number, field: keyof typeof depenses[0], value: string | number) => {
    const newDepenses = [...depenses];
    if (field === 'montant') {
      newDepenses[index] = { ...newDepenses[index], [field]: Number(value) || 0 };
    } else {
      newDepenses[index] = { ...newDepenses[index], [field]: value };
    }
    setDepenses(newDepenses);
  }, [depenses]);

  const handleRemoveDepense = useCallback((index: number) => {
    setDepenses(prev => prev.filter((_, i) => i !== index));
    logger.info('Suppression d’une ligne de dépense', { removedIndex: index });
  }, []);

  // Handler de soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      setProgressBarProgress(0.5);
      const budgetDataToSubmit: Omit<Budget, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        mois,
        plafond: Number(plafond),
        devise,
        depenses: depenses.map(d => ({ ...d, montant: Number(d.montant) })),
        familyId,
        createurId,
      };

      logger.info('Tentative de soumission du budget', { budget: budgetDataToSubmit });

      const budgetId = await addBudget(budgetDataToSubmit);
      if (budgetId) {
        setProgressBarProgress(1);
        setModalSuccessVisible(true);
        onSubmit({
          ...budgetDataToSubmit,
          id: budgetId,
          dateCreation: initialData?.dateCreation || formatDate(new Date()),
          dateMiseAJour: formatDate(new Date()),
        });
      } else {
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
      logger.warn('Validation du formulaire échouée', { errors: formErrors });
    }
  }, [validateForm, mois, plafond, devise, depenses, familyId, createurId, addBudget, onSubmit, initialData, formErrors]);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  // Calcul du total dépensé pour l'affichage
  const totalSpent = useMemo(() => {
    return depenses.reduce((sum, d) => sum + Number(d.montant), 0);
  }, [depenses]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.formTitle}>Gérer le Budget Familial</Text>

      {/* Champs principaux du budget */}
      <Input
        value={mois}
        onChangeText={setMois}
        placeholder="Mois (AAAA-MM)"
        iconName="calendar"
        iconPosition="left"
        keyboardType="default"
        autoCapitalize="none"
      />
      <Input
        value={plafond}
        onChangeText={setPlafond}
        placeholder="Plafond du budget"
        iconName="currency-eur"
        iconPosition="left"
        keyboardType="numeric"
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={devise}
          onValueChange={(itemValue) => setDevise(itemValue as Currency)}
          style={styles.picker}
          testID="currency-picker"
        >
          {CURRENCY_OPTIONS.map((curr) => (
            <Picker.Item key={curr} label={curr} value={curr} />
          ))}
        </Picker>
      </View>

      <Text style={styles.sectionTitle}>Détails des Dépenses</Text>
      {depenses.map((depense, index) => (
        <View key={index} style={styles.depenseContainer}>
          <Input
            value={depense.date}
            onChangeText={(val) => handleDepenseChange(index, 'date', val)}
            placeholder="Date (AAAA-MM-JJ)"
            iconName="calendar"
            iconPosition="left"
            keyboardType="default"
            style={styles.inputHalfWidth}
          />
          <Input
            value={depense.montant === 0 ? '' : depense.montant.toString()} // Affiche vide si 0
            onChangeText={(val) => handleDepenseChange(index, 'montant', val)}
            placeholder="Montant"
            iconName="currency-eur"
            iconPosition="left"
            keyboardType="numeric"
            style={styles.inputHalfWidth}
          />
          <Input
            value={depense.description}
            onChangeText={(val) => handleDepenseChange(index, 'description', val)}
            placeholder="Description de la dépense"
            iconName="note"
            iconPosition="left"
            keyboardType="default"
            multiline
            numberOfLines={1}
            style={styles.inputFullWidth}
          />
          <View style={[styles.pickerContainer, styles.inputFullWidth]}>
            <Picker
              selectedValue={depense.categorie}
              onValueChange={(itemValue) => handleDepenseChange(index, 'categorie', itemValue as typeof EXPENSE_CATEGORIES[number])}
              style={styles.picker}
              testID={`depense-category-${index}`}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
              ))}
            </Picker>
          </View>
          {depenses.length > 1 && ( // Bouton supprimer uniquement s'il y a plus d'une dépense
            <GradientButton
              title="Supprimer la dépense"
              onPress={() => handleRemoveDepense(index)}
              style={styles.removeButton}
              disabled={isLoading}
            />
          )}
        </View>
      ))}
      <GradientButton
        title="Ajouter une dépense"
        onPress={handleAddDepense}
        style={styles.addButton}
        disabled={isLoading}
      />

      {/* Résumé et alertes */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total dépensé : <Text style={styles.summaryValue}>{totalSpent.toFixed(2)} {devise}</Text></Text>
        {budgetAlerts.length > 0 && (
          <View style={styles.alertContainer} testID="budget-alert-container">
            <Text style={styles.alertTitle}>Alertes de budget :</Text>
            {budgetAlerts.map((alert, index) => (
              <Text key={index} style={styles.alertText} testID={`alert-message-${index}`}>{`- ${alert}`}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Bouton de soumission */}
      <GradientButton
        title={isLoading ? 'Enregistrement en cours...' : 'Enregistrer le Budget'}
        onPress={handleSubmit}
        disabled={isLoading || formErrors.length > 0}
        style={styles.submitButton}
      />

      {/* Barre de progression */}
      {isLoading && <ProgressBar progress={progressBarProgress} animated barColor="#FF6B00" />}

      {/* Modals de succès et d'erreur */}
      <ModalComponent
        visible={modalSuccessVisible}
        onClose={() => setModalSuccessVisible(false)}
        title="Succès !"
        showCloseButton
      >
        <Text style={styles.modalText}>Votre budget a été enregistré avec succès !</Text>
        <Image source={require('../assets/icons/success.png')} style={styles.icon} resizeMode="contain" />
        {totalSpent > Number(plafond) && (
          <Text style={styles.warningText}>
            Attention : Le montant total des dépenses ({totalSpent.toFixed(2)} {devise}) dépasse le plafond ({Number(plafond).toFixed(2)} {devise}).
          </Text>
        )}
      </ModalComponent>

      <ModalComponent
        visible={modalErrorVisible}
        onClose={() => setModalErrorVisible(false)}
        title="Erreur de Validation"
        showCloseButton
        animationType="fade"
      >
        <Text style={styles.modalText}>Veuillez corriger les problèmes suivants pour soumettre le budget :</Text>
        {formErrors.map((err, index) => (
          <Text key={index} style={styles.errorDetail} testID={`error-detail-${index}`}>{`- ${err}`}</Text>
        ))}
      </ModalComponent>

      {/* Message d'erreur animé en bas du formulaire */}
      {formErrors.length > 0 && (
        <Animated.View style={[styles.errorContainer, animatedErrorStyle]} testID="animated-error-message">
          <Text style={styles.errorText}>Des erreurs de validation ont été détectées. Veuillez les corriger.</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
     icon: {
    width: 60,
    height: 60,
    marginBottom: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  container: {
    padding: 16,
    backgroundColor: '#0d0d0d', // Fond sombre pour l'esthétique
    paddingBottom: 50, // Espace pour le défilement
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 8,
  },
  pickerContainer: {
    marginVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 50,
    justifyContent: 'center',
    width: '100%',
  },
  picker: {
    color: '#ffffff',
    height: 50,
    width: '100%',
  },
  depenseContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputHalfWidth: {
    width: '48%', // Pour avoir deux champs par ligne
    marginBottom: 10,
  },
  inputFullWidth: {
    width: '100%',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#28a745', // Bouton vert pour ajouter
    marginVertical: 15,
  },
  removeButton: {
    backgroundColor: '#dc3545', // Bouton rouge pour supprimer
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
  },
  summaryContainer: {
    marginTop: 25,
    padding: 18,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  summaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryValue: {
    color: '#00BFFF', // Couleur vive pour le montant
  },
  alertContainer: {
    padding: 12,
    backgroundColor: '#2a2a2a', // Fond légèrement plus clair pour les alertes
    borderRadius: 8,
    marginVertical: 10,
    borderColor: '#F39C12',
    borderWidth: 1,
  },
  alertTitle: {
    color: '#F39C12', // Orange pour les titres d'alerte
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  alertText: {
    color: '#F39C12',
    fontSize: 14,
    marginTop: 3,
  },
  submitButton: {
    marginVertical: 25,
  },
  modalText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningText: {
    color: '#F39C12',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginTop: 15,
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorDetail: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'left',
    marginTop: 5,
  },
});
