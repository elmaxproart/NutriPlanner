import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { UserRole } from '../../constants/categories';
import { MembreFamille } from '../../constants/entities';
import { useAuth } from '../../hooks/useAuth';
import { validateMembreFamille } from '../../utils/dataValidators';
import { Avatar } from '../common/Avatar';
import { GradientButton } from '../common/GradientButton';
import { Input } from '../common/Input';
import { ModalComponent } from '../common/Modal';



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
  error: '#E74C3C',
};

const FONTS = {
  title: 24,
  subtitle: 16,
  description: 14,
  button: 16,
  modalTitle: 20,
  modalText: 16,
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

const GENDER_OPTIONS = ['homme', 'femme', 'autre'] as const;
const ROLE_OPTIONS: UserRole[] = ['parent', 'enfant', 'conjoint', 'autre'];
const ACCESS_LEVEL_OPTIONS = ['admin', 'membre'] as const;

interface FamilyMemberWizardProps {
  initialData?: Partial<MembreFamille>;
  onSave: (memberData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => void;
  onCancel: () => void;
  loading?: boolean;
  familyId: string;
  isEditing?: boolean;
}

interface StepConfig {
  title: string;
  description: string;
  icon: string;
  content: React.ReactNode;
}

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FamilyMemberWizard: React.FC<FamilyMemberWizardProps> = ({
  initialData,
  onSave,
  onCancel,
  loading = false,
  familyId,
  isEditing = false,
}) => {
  const { userId } = useAuth();
  const [index, setIndex] = useState(0);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [modalDatePickerVisible, setModalDatePickerVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Form state
  const [formData, setFormData] = useState<Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>>({
    nom: initialData?.nom || '',
    prenom: initialData?.prenom || '',
    dateNaissance: initialData?.dateNaissance || '',
    genre: initialData?.genre || 'homme',
    role: initialData?.role || 'parent',
    preferencesAlimentaires: initialData?.preferencesAlimentaires || [],
    allergies: initialData?.allergies || [],
    restrictionsMedicales: initialData?.restrictionsMedicales || [],
    niveauAcces: initialData?.niveauAcces || 'membre',
    photoProfil: initialData?.photoProfil || '',
    historiqueRepas: initialData?.historiqueRepas || [],
    repasFavoris: initialData?.repasFavoris || [],
    contactUrgence: initialData?.contactUrgence || { nom: '', telephone: '' },
    aiPreferences: initialData?.aiPreferences || {
      niveauEpices: 0,
      apportCaloriqueCible: 0,
      cuisinesPreferees: [],
    },
    userId: userId || '',
    familyId,
    createurId: initialData?.createurId || userId || '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.photoProfil || null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialData?.dateNaissance ? new Date(initialData.dateNaissance) : new Date()
  );

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
  }, [fadeAnim, index, slideAnim]);

  // Handle image pick
  const handleImagePick = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        const uri = response.assets[0].uri;
        setSelectedImage(uri);
        setFormData((prev) => ({ ...prev, photoProfil: uri }));
      }
    });
  }, []);

  // Handle date selection
  const handleDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      setFormData((prev) => ({ ...prev, dateNaissance: formatDateToString(date) }));
    }
    setModalDatePickerVisible(false);
  }, []);

  // Validation
  const validateStep = useCallback(() => {
    const errors: string[] = [];
    if (index === 0) {
      if (!formData.nom) {errors.push('Le nom est requis.');}
      if (!formData.prenom) {errors.push('Le prénom est requis.');}
      if (!formData.dateNaissance.match(/^\d{4}-\d{2}-\d{2}$/))
        {errors.push('La date de naissance doit être au format AAAA-MM-JJ.');}
      if (new Date(formData.dateNaissance) > new Date())
        {errors.push('La date de naissance ne peut pas être future.');}
    }
    if (index === 2) {
      if (!formData.contactUrgence.nom) {errors.push('Le nom du contact d\'urgence est requis.');}
      if (!formData.contactUrgence.telephone.match(/^\+?\d{10,15}$/))
        {errors.push('Le téléphone du contact d\'urgence doit être valide.');}
      if (formData.aiPreferences.niveauEpices < 0 || formData.aiPreferences.niveauEpices > 5)
        {errors.push('Le niveau d\'épices doit être entre 1 et 5.');}
      if (formData.aiPreferences.apportCaloriqueCible < 0)
        {errors.push('L\'apport calorique cible ne peut pas être négatif.');}
    }
    setErrorMessages(errors);
    return errors.length === 0;
  }, [index, formData]);


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
  }, [fadeAnim, index, slideAnim]);

  const handleCancelPress = useCallback(() => {
    setModalCancelVisible(true);
  }, []);

  const confirmCancel = useCallback(() => {
    setModalCancelVisible(false);
    onCancel();
  }, [onCancel]);

  const handleSubmit = useCallback(async () => {
    if (validateStep()) {
      const validationErrors = validateMembreFamille(formData as MembreFamille);
      if (validationErrors.length > 0) {
        setErrorMessages(validationErrors);
        setModalErrorVisible(true);
        return;
      }
      onSave(formData);
    } else {
      setModalErrorVisible(true);
    }
  }, [validateStep, formData, onSave]);

  // Steps configuration
  const steps: StepConfig[] = [
    {
      title: isEditing ? 'Modifier les Informations Personnelles' : 'Informations Personnelles',
      description: isEditing
        ? 'Modifiez les informations de base du membre de la famille.'
        : 'Remplissez les informations de base du membre de la famille.',
      icon: 'account',
      content: (
        <View style={styles.stepContent}>
          <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
            <Avatar
              size={120}
              source={
                selectedImage
                  ? { uri: selectedImage }
                  : formData.photoProfil
                  ? { uri: formData.photoProfil }
                  : require('../../assets/images/ia.jpg')
              }
            />
            <Text style={styles.avatarText}>Changer la photo de profil</Text>
          </TouchableOpacity>
          <Input
            value={formData.nom}
            onChangeText={(text) => setFormData({ ...formData, nom: text })}
            placeholder="Nom"
            iconName="account"
            iconPosition="left"
          />
          <Input
            value={formData.prenom}
            onChangeText={(text) => setFormData({ ...formData, prenom: text })}
            placeholder="Prénom"
            iconName="account"
            iconPosition="left"
          />
          <TouchableOpacity
            onPress={() => setModalDatePickerVisible(true)}
            style={styles.dateInputContainer}
          >
            <Input
              value={formData.dateNaissance}
              placeholder="Date de naissance (AAAA-MM-JJ)"
              iconName="calendar"
              iconPosition="left"
              editable={false}
            />
          </TouchableOpacity>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.genre}
              onValueChange={(val) => setFormData({ ...formData, genre: val })}
              style={styles.picker}
              testID="gender-picker"
            >
              {GENDER_OPTIONS.map((gender) => (
                <Picker.Item key={gender} label={gender.charAt(0).toUpperCase() + gender.slice(1)} value={gender} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
              style={styles.picker}
              testID="role-picker"
            >
              {ROLE_OPTIONS.map((role) => (
                <Picker.Item key={role} label={role.charAt(0).toUpperCase() + role.slice(1)} value={role} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.niveauAcces}
              onValueChange={(val) => setFormData({ ...formData, niveauAcces: val })}
              style={styles.picker}
              testID="access-level-picker"
            >
              {ACCESS_LEVEL_OPTIONS.map((level) => (
                <Picker.Item key={level} label={level.charAt(0).toUpperCase() + level.slice(1)} value={level} />
              ))}
            </Picker>
          </View>
        </View>
      ),
    },
    {
      title: isEditing ? 'Modifier les Préférences Alimentaires' : 'Préférences Alimentaires',
      description: isEditing
        ? 'Modifiez les préférences et restrictions alimentaires du membre.'
        : 'Ajoutez les préférences et restrictions alimentaires du membre.',
      icon: 'food',
      content: (
        <View style={styles.stepContent}>
          <Input
            value={formData.preferencesAlimentaires.join(', ')}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                preferencesAlimentaires: text.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="Préférences alimentaires (séparées par des virgules)"
            iconName="food"
            iconPosition="left"
            multiline
            numberOfLines={2}
          />
          <Input
            value={formData.allergies.join(', ')}
            onChangeText={(text) =>
              setFormData({ ...formData, allergies: text.split(',').map((s) => s.trim()).filter(Boolean) })
            }
            placeholder="Allergies (séparées par des virgules)"
            iconName="alert"
            iconPosition="left"
            multiline
            numberOfLines={2}
          />
          <Input
            value={formData.restrictionsMedicales.join(', ')}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                restrictionsMedicales: text.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="Restrictions médicales (séparées par des virgules)"
            iconName="hospital-box"
            iconPosition="left"
            multiline
            numberOfLines={2}
          />
          <Input
            value={formData.repasFavoris?.join(', ') || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, repasFavoris: text.split(',').map((s) => s.trim()).filter(Boolean) })
            }
            placeholder="Repas favoris (séparées par des virgules)"
            iconName="heart"
            iconPosition="left"
            multiline
            numberOfLines={2}
          />
        </View>
      ),
    },
    {
      title: isEditing ? 'Modifier Contact et Préférences IA' : 'Contact et Préférences IA',
      description: isEditing
        ? 'Modifiez les informations de contact et les préférences IA.'
        : 'Ajoutez les informations de contact et les préférences IA.',
      icon: 'phone',
      content: (
        <View style={styles.stepContent}>
          <Input
            value={formData.contactUrgence.nom}
            onChangeText={(text) =>
              setFormData({ ...formData, contactUrgence: { ...formData.contactUrgence, nom: text } })
            }
            placeholder="Nom du contact d'urgence"
            iconName="account-box"
            iconPosition="left"
          />
          <Input
            value={formData.contactUrgence.telephone}
            onChangeText={(text) =>
              setFormData({ ...formData, contactUrgence: { ...formData.contactUrgence, telephone: text } })
            }
            placeholder="Téléphone du contact d'urgence"
            iconName="phone"
            iconPosition="left"
            keyboardType="phone-pad"
          />
          <Input
            value={formData.aiPreferences.niveauEpices.toString()}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                aiPreferences: { ...formData.aiPreferences, niveauEpices: Number(text) || 0 },
              })
            }
            placeholder="Niveau d'épices (1-5)"
            iconName="fire"
            iconPosition="left"
            keyboardType="numeric"
          />
          <Input
            value={formData.aiPreferences.apportCaloriqueCible.toString()}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                aiPreferences: { ...formData.aiPreferences, apportCaloriqueCible: Number(text) || 0 },
              })
            }
            placeholder="Apport calorique cible (kcal)"
            iconName="scale"
            iconPosition="left"
            keyboardType="numeric"
          />
          <Input
            value={formData.aiPreferences.cuisinesPreferees.join(', ')}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                aiPreferences: {
                  ...formData.aiPreferences,
                  cuisinesPreferees: text.split(',').map((s) => s.trim()).filter(Boolean),
                },
              })
            }
            placeholder="Cuisines préférées (séparées par des virgules)"
            iconName="globe"
            iconPosition="left"
            multiline
            numberOfLines={2}
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
          disabled={index === 0 || loading}
        >
          <FontAwesome name="arrow-left" size={16} color={COLORS.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Précédent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCancelPress}
          style={styles.navButton}
          disabled={loading}
        >
          <FontAwesome name="times" size={16} color={COLORS.text} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        {index === steps.length - 1 ? (
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.nextButtonOuter}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Modifier' : 'Enregistrer'}</Text>
              <FontAwesome name="check" size={16} color={COLORS.buttonText} style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextButtonOuter}
            disabled={loading}
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
        showCloseButton
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
      <ModalComponent
        visible={modalDatePickerVisible}
        onClose={() => setModalDatePickerVisible(false)}
        title="Sélectionner la date de naissance"
        showCloseButton
        animationType="slide"
      >
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            maximumDate={new Date()}
            locale="fr"
            style={{ backgroundColor: COLORS.cardBg }}
          />
          <GradientButton
            title="Confirmer"
            onPress={() => setModalDatePickerVisible(false)}
            style={styles.modalButton}
          />
        </View>
      </ModalComponent>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>
            {isEditing ? 'Mise à jour en cours...' : 'Enregistrement en cours...'}
          </Text>
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
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  avatarText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.description,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
  dateInputContainer: {
    marginVertical: SPACING.xs,
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
    color: COLORS.error,
    fontSize: FONTS.modalText,
    textAlign: 'left',
    marginTop: SPACING.xs,
  },
  modalImage: {
    width: '100%',
    height: 100,
    marginBottom: SPACING.m,
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
    backgroundColor: COLORS.error,
  },
  datePickerContainer: {
    alignItems: 'center',
    padding: SPACING.m,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 15,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: FONTS.modalText,
    marginTop: SPACING.m,
  },
});

