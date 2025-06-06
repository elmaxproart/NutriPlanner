import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Input } from '../common/Input';
import { GradientButton } from '../common/GradientButton';
import { ModalComponent } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { validateStore } from '../../utils/dataValidators';
import { formatDate } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type { Store, StoreItem, Promotion, Horaire, Contact, Localisation } from '../../constants/entities';
import { useStores } from '../../hooks/useStores';
import { useFirestore } from '../../hooks/useFirestore';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { IngredientCategory, StoreCategory} from '../../constants/categories';
import { Unit } from '../../constants/units';


const STORE_CATEGORY_OPTIONS: StoreCategory[] = [
  'supermarché',
  'poissonnerie',
  'épicerie',
  'marché local',
  'boucherie',
  'en ligne',
];

const DAYS_OF_WEEK: Horaire['jour'][] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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

interface StoreFormProps {
  onSubmit: (store: Store) => void;
  loading?: boolean;
  initialData?: Partial<Store>;
  familyId: string;
  createurId: string;
}

export const StoreForm = ({ onSubmit, loading = false, initialData, familyId, createurId }: StoreFormProps) => {
  const { addStore } = useStores(createurId, familyId);
  const { getCollection } = useFirestore(createurId, familyId);

  // Main States
  const [nom, setNom] = useState(initialData?.nom || '');
  const [categorie, setCategorie] = useState<StoreCategory>(initialData?.categorie || STORE_CATEGORY_OPTIONS[0]);
  const [localisation, setLocalisation] = useState<Localisation>(
    initialData?.localisation || { latitude: 0, longitude: 0, adresse: '' }
  );
  const [horaires, setHoraires] = useState<Horaire[]>(
    initialData?.horaires || DAYS_OF_WEEK.map(day => ({ jour: day, ouverture: '08:00', fermeture: '20:00' }))
  );
  const [contact, setContact] = useState<Contact>(initialData?.contact || { telephone: '', email: '', siteWeb: '' });
  const [articles, setArticles] = useState<StoreItem[]>(
    initialData?.articles || [{ id: '', storeId: '', nom: '', categorie: undefined, prixUnitaire: 0, unite: 'unité', stockDisponible: 0, dateMiseAJour: formatDate(new Date()).toString() }]
  );
  const [promotions, setPromotions] = useState<Promotion[]>(
    initialData?.promotions || [{ articleId: '', reduction: 0, dateDebut: '', dateFin: '' }]
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useSharedValue(0);

  // Available ingredients for StoreItem selection
  const [availableIngredients, setAvailableIngredients] = useState<{ id: string; nom: string; categorie?: IngredientCategory }[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        // Correctly type the result from getCollection
        const ingredientsData = await getCollection<any>('Ingredients');
        setAvailableIngredients(ingredientsData.map(ing => ({ id: ing.id, nom: ing.nom, categorie: ing.categorie })));
      } catch (err) {
        logger.error('Failed to fetch ingredients for StoreForm:', err as Error);
      }
    };
    fetchIngredients();
  }, [getCollection]);

  // Validation
  const validateForm = useCallback(() => {
    const storeData: Partial<Store> = {
      nom,
      categorie,
      localisation,
      horaires,
      contact,
      articles,
      promotions,
    };
    // Ensure that dateCreation and dateMiseAJour are handled by the backend/addStore function,
    // as they are usually timestamps set on creation/update. For validation, we can omit them
    // or add dummy values if validateStore strictly requires them.
    const errors = validateStore(storeData as Store); // Cast needed if Store has non-optional date fields
    setFormErrors(errors);
    return errors.length === 0;
  }, [nom, categorie, localisation, horaires, contact, articles, promotions]);

  useEffect(() => {
    validateForm();
    fadeAnim.value = withTiming(formErrors.length > 0 ? 1 : 0, { duration: 300, easing: Easing.ease });
  }, [validateForm, formErrors.length, fadeAnim]);

  // Handlers for nested states
  const handleLocalisationChange = useCallback((field: keyof Localisation, value: string | number) => {
    setLocalisation(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHoraireChange = useCallback((index: number, field: keyof Horaire, value: string) => {
    const newHoraires = [...horaires];
    newHoraires[index] = { ...newHoraires[index], [field]: value };
    setHoraires(newHoraires);
  }, [horaires]);

  const handleContactChange = useCallback((field: keyof Contact, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddArticle = useCallback(() => {
    setArticles(prev => [
      ...prev,
      { id: '', storeId: '', nom: '', categorie: undefined, prixUnitaire: 0, unite: 'unité', stockDisponible: 0, dateMiseAJour: formatDate(new Date()) },
    ]);
    logger.info('Adding new article field');
  }, []);

  const handleArticleChange = useCallback((index: number, field: keyof StoreItem, value: string | number) => {
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], [field]: value };

    // If ingredient name changes, try to auto-fill category and set article ID
    if (field === 'nom') {
      const selectedIngredient = availableIngredients.find(ing => ing.nom === value);
      if (selectedIngredient) {
        newArticles[index].id = selectedIngredient.id; // Link StoreItem ID to Ingredient ID
        if (selectedIngredient.categorie) {
          newArticles[index].categorie = selectedIngredient.categorie;
        }
      } else {
        newArticles[index].id = '';
        newArticles[index].categorie = undefined;
      }
    }

    setArticles(newArticles);
  }, [articles, availableIngredients]);

  const handleRemoveArticle = useCallback((index: number) => {
    setArticles(prev => prev.filter((_, i) => i !== index));
    logger.info('Removing article field');
  }, []);

  const handleAddPromotion = useCallback(() => {
    setPromotions(prev => [...prev, { articleId: '', reduction: 0, dateDebut: '', dateFin: '' }]);
    logger.info('Adding new promotion field');
  }, []);

  const handlePromotionChange = useCallback((index: number, field: keyof Promotion, value: string | number) => {
    const newPromotions = [...promotions];
    newPromotions[index] = { ...newPromotions[index], [field]: value };
    setPromotions(newPromotions);
  }, [promotions]);

  const handleRemovePromotion = useCallback((index: number) => {
    setPromotions(prev => prev.filter((_, i) => i !== index));
    logger.info('Removing promotion field');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      const currentDate = formatDate(new Date()); // Get current date once
      const storeData: Omit<Store, 'id'> = {
        nom,
        categorie,
        localisation,
        horaires,
        contact,
        articles,
        promotions,
        dateCreation: initialData?.dateCreation || currentDate, // Use initial if editing, otherwise current
        dateMiseAJour: currentDate, // Always update on submission
      };
      setProgress(0.5);
      logger.info('Submitting store data', { store: storeData });
      const storeId = await addStore(storeData);
      if (storeId) {
        setProgress(1);
        setModalSuccessVisible(true);
        // Pass the complete store object with ID and dates to onSubmit
        onSubmit({ ...storeData, id: storeId });
      } else {
        setModalErrorVisible(true);
      }
    } else {
      setModalErrorVisible(true);
      logger.warn('Form validation failed', { errors: formErrors });
    }
  }, [validateForm, nom, categorie, localisation, horaires, contact, articles, promotions, addStore, onSubmit, formErrors, initialData?.dateCreation]);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.formTitle}>Créer ou Modifier un Magasin</Text>

      <Input
        value={nom}
        onChangeText={setNom}
        placeholder="Nom du magasin"
        iconName="store"
        iconPosition="left"
        keyboardType="default"
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categorie}
          onValueChange={(itemValue) => setCategorie(itemValue as StoreCategory)}
          style={styles.picker}
        >
          {STORE_CATEGORY_OPTIONS.map((cat) => (
            <Picker.Item key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.sectionTitle}>Localisation</Text>
      <Input
        value={localisation.adresse}
        onChangeText={(val) => handleLocalisationChange('adresse', val)}
        placeholder="Adresse physique du magasin"
        iconName="map-marker"
        iconPosition="left"
        keyboardType="default"
      />
      <Input
        value={localisation.latitude !== 0 ? localisation.latitude.toString() : ''}
        onChangeText={(val) => handleLocalisationChange('latitude', Number(val) || 0)}
        placeholder="Latitude (ex: 4.8765)"
        iconName="latitude"
        iconPosition="left"
        keyboardType="numeric"
      />
      <Input
        value={localisation.longitude !== 0 ? localisation.longitude.toString() : ''}
        onChangeText={(val) => handleLocalisationChange('longitude', Number(val) || 0)}
        placeholder="Longitude (ex: 11.2345)"
        iconName="longitude"
        iconPosition="left"
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
      {horaires.map((horaire, index) => (
        <View key={index} style={styles.horaireContainer}>
          <Text style={styles.dayLabel}>{horaire.jour}</Text>
          <Input
            value={horaire.ouverture}
            onChangeText={(val) => handleHoraireChange(index, 'ouverture', val)}
            placeholder="Ouverture (HH:MM)"
            iconName="clock-in"
            iconPosition="left"
            keyboardType="default"
            style={styles.horaireInput}
          />
          <Input
            value={horaire.fermeture}
            onChangeText={(val) => handleHoraireChange(index, 'fermeture', val)}
            placeholder="Fermeture (HH:MM)"
            iconName="clock-out"
            iconPosition="left"
            keyboardType="default"
            style={styles.horaireInput}
          />
        </View>
      ))}

      <Text style={styles.sectionTitle}>Informations de Contact</Text>
      <Input
        value={contact.telephone}
        onChangeText={(val) => handleContactChange('telephone', val)}
        placeholder="Téléphone (ex: +237 6XX XXX XXX)"
        iconName="phone"
        iconPosition="left"
        keyboardType="phone-pad"
      />
      <Input
        value={contact.email || ''}
        onChangeText={(val) => handleContactChange('email', val)}
        placeholder="Email (ex: contact@magasin.com)"
        iconName="email"
        iconPosition="left"
        keyboardType="email-address"
      />
      <Input
        value={contact.siteWeb || ''}
        onChangeText={(val) => handleContactChange('siteWeb', val)}
        placeholder="Site web (ex: www.magasin.com)"
        iconName="web"
        iconPosition="left"
        keyboardType="url"
      />

      <Text style={styles.sectionTitle}>Articles disponibles</Text>
      {articles.map((article, index) => (
        <View key={index} style={styles.itemRowContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={article.nom}
              onValueChange={(itemValue) => handleArticleChange(index, 'nom', itemValue as string)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un ingrédient/article" value="" />
              {availableIngredients.map((ing) => (
                <Picker.Item key={ing.id} label={ing.nom} value={ing.nom} />
              ))}
            </Picker>
          </View>
          <Input
            value={article.categorie?.toString() || ''}
            onChangeText={(val) => handleArticleChange(index, 'categorie', val)}
            placeholder="Catégorie de l'article"
            iconName="tag"
            iconPosition="left"
            keyboardType="default"
            editable={!availableIngredients.find(ing => ing.nom === article.nom)?.categorie}
          />
          <Input
            value={article.prixUnitaire !== 0 ? article.prixUnitaire.toString() : ''}
            onChangeText={(val) => handleArticleChange(index, 'prixUnitaire', Number(val) || 0)}
            placeholder="Prix unitaire"
            iconName="currency-eur"
            iconPosition="left"
            keyboardType="numeric"
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={article.unite}
              onValueChange={(itemValue) => handleArticleChange(index, 'unite', itemValue as Unit)}
              style={styles.picker}
            >
              {UNIT_OPTIONS.map((unit) => (
                <Picker.Item key={unit} label={unit.charAt(0).toUpperCase() + unit.slice(1)} value={unit} />
              ))}
            </Picker>
          </View>
          <Input
            value={article.stockDisponible !== 0 ? article.stockDisponible.toString() : ''}
            onChangeText={(val) => handleArticleChange(index, 'stockDisponible', Number(val) || 0)}
            placeholder="Stock disponible"
            iconName="warehouse"
            iconPosition="left"
            keyboardType="numeric"
          />
          <GradientButton
            title="Supprimer l'article"
            onPress={() => handleRemoveArticle(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter un article"
        onPress={handleAddArticle}
        style={styles.addButton}
        disabled={loading}
      />

      <Text style={styles.sectionTitle}>Promotions actuelles</Text>
      {promotions.map((promo, index) => (
        <View key={index} style={styles.itemRowContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={promo.articleId}
              onValueChange={(itemValue) => handlePromotionChange(index, 'articleId', itemValue as string)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un article en promotion" value="" />
              {articles.map((article) => (
                <Picker.Item key={article.id || article.nom} label={article.nom} value={article.id || article.nom} />
              ))}
            </Picker>
          </View>
          <Input
            value={promo.reduction !== 0 ? promo.reduction.toString() : ''}
            onChangeText={(val) => handlePromotionChange(index, 'reduction', Number(val) || 0)}
            placeholder="Réduction (%)"
            iconName="percent"
            iconPosition="left"
            keyboardType="numeric"
          />
          <Input
            value={promo.dateDebut}
            onChangeText={(val) => handlePromotionChange(index, 'dateDebut', val)}
            placeholder="Date de début (AAAA-MM-JJ)"
            iconName="calendar-start"
            iconPosition="left"
            keyboardType="default"
          />
          <Input
            value={promo.dateFin}
            onChangeText={(val) => handlePromotionChange(index, 'dateFin', val)}
            placeholder="Date de fin (AAAA-MM-JJ)"
            iconName="calendar-end"
            iconPosition="left"
            keyboardType="default"
          />
          <GradientButton
            title="Supprimer la promotion"
            onPress={() => handleRemovePromotion(index)}
            style={styles.removeButton}
            disabled={loading}
          />
        </View>
      ))}
      <GradientButton
        title="Ajouter une promotion"
        onPress={handleAddPromotion}
        style={styles.addButton}
        disabled={loading}
      />

      <GradientButton
        title={loading ? 'Enregistrement en cours...' : 'Enregistrer le Magasin'}
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
        <Text style={styles.modalText}>Votre magasin a été enregistré avec succès !</Text>
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
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 5,
  },
  horaireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
  },
  dayLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 80,
  },
  horaireInput: {
    flex: 1,
    marginLeft: 10,
  },
  itemRowContainer: {
    marginVertical: 10,
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pickerContainer: {
    marginVertical: 5,
    backgroundColor: '#0d0d0d',
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
