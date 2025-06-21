import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { ModalComponent } from '../../components/common/Modal';
import { login } from '../../hooks/SignUpFnAuth';
import { useNavigation } from '@react-navigation/native';
import { useFamilyData } from '../../hooks/useFamilyData';
import { Genre, UserRole } from '../../constants/categories';
import { MembreFamille } from '../../constants/entities';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingSummary'>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Configuration
const COLORS = {
  placeholder: 'rgba(207, 191, 191, 0.62)',
  primary: '#E95221',
  secondary: '#F2A03D',
  backgroundDark: '#0D0D0D',
  backgroundLight: '#1A1A1A',
  inputBg: '#282828',
  inputBorder: '#444',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  error: '#FF6B6B',
  buttonText: '#FFFFFF',
  cardBg: '#2C2C2C',
  shadow: '#000',
  editProfile: '#26A69A', // Green-cyan for edit profile button
};

const FONTS = {
  title: 22,
  sectionTitle: 18,
  profileName: 20,
  detailLabel: 8,
  detailValue: 12,
  button: 16,
  headerInfo: 12, // Smaller font for header details
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const UserOnboardingSummary: React.FC<{ route: { params: { userId: string } } }> = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [summaryData, setSummaryData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    nutrition: false,
    meals: false,
    ai: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading: familyLoading, error: familyError, addFamilyMember } = useFamilyData();

  useEffect(() => {
    loadSummary();
  }, []);

  const handleNext = async () => {

    navigation.navigate('Home');

  };


  const loadSummary = async () => {
    try {
      const steps = ['onboardingStep1', 'onboardingStep2', 'onboardingStep3', 'onboardingStep4', 'onboardingStep5'];
      const data: Record<string, any> = {};
      for (const step of steps) {
        const storedData = await AsyncStorage.getItem(step);
        if (storedData) {
          data[step] = JSON.parse(storedData);
        }
      }
      setSummaryData(data);
    } catch (e: any) {
      console.error('Error loading summary data:', e);
      setErrorMessage('Échec du chargement des données utilisateur.');
      setErrorModalVisible(true);
    }
  };

  const getTrimmedArray = (data: any): string[] => {
    return typeof data === 'string' && data ? data.split(',').map((s: string) => s.trim()).filter(s => s) : [];
  };

  const truncateName = (name: string, maxLength: number = 15): string => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      console.log('Starting onboarding completion for userId:', userId);
      const familyName = summaryData.onboardingStep1?.nom
        ? `Famille de ${summaryData.onboardingStep1.nom}`
        : 'Famille NutriPlanner';

      const memberData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        userId,
        nom: summaryData.onboardingStep1?.nom || '',
        prenom: summaryData.onboardingStep1?.prenom || '',
        dateNaissance: summaryData.onboardingStep1?.dateNaissance || '',
        genre: (summaryData.onboardingStep1?.genre as Genre) || 'autre',
        role: (summaryData.onboardingStep1?.role as UserRole) || 'parent',
        preferencesAlimentaires: getTrimmedArray(summaryData.onboardingStep2?.preferencesAlimentaires),
        allergies: getTrimmedArray(summaryData.onboardingStep2?.allergies),
        restrictionsMedicales: getTrimmedArray(summaryData.onboardingStep2?.restrictionsMedicales),
        photoProfil: summaryData.onboardingStep4?.photoProfil || '',
        repasFavoris: getTrimmedArray(summaryData.onboardingStep3?.repasFavoris),
        historiqueRepas: [],
        contactUrgence: {
          nom: summaryData.onboardingStep3?.contactUrgenceNom || '',
          telephone: summaryData.onboardingStep3?.contactUrgenceTelephone || '',
        },
        aiPreferences: {
          niveauEpices: Number(summaryData.onboardingStep5?.niveauEpices) || 1,
          apportCaloriqueCible: Number(summaryData.onboardingStep5?.apportCaloriqueCible) || 2000,
          cuisinesPreferees: getTrimmedArray(summaryData.onboardingStep5?.cuisinesPreferees),
        },
        historiqueSante: [],
        niveauAcces: 'admin',
        familyId: familyName,
        createurId: userId,
      };

      console.log('Adding family member:', memberData);
      const memberId = await addFamilyMember(memberData);
      if (!memberId) {
        throw new Error('Échec de l’enregistrement du membre de la famille.');
      }
      console.log('Family member added with ID:', memberId);

      await AsyncStorage.setItem('userProfile', JSON.stringify(memberData));

      const email = await AsyncStorage.getItem('signupEmail');
      const password = await AsyncStorage.getItem('signupPassword');
      if (!email || !password) {
        throw new Error('Identifiants de connexion manquants.');
      }
      console.log('Attempting login with email:', email);
      const loggedInUserId = await login(email, password);
      if (!loggedInUserId) {
        throw new Error('Échec de la connexion après inscription.');
      }
      console.log('Logged in with userId:', loggedInUserId);

      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setSuccessModalVisible(true);
      setTimeout(() => {
        console.log('Navigating to Home');
        navigation.replace('Home');
      }, 2000);
    } catch (err: any) {
      console.error('Error during onboarding completion:', err);
      setErrorMessage(err.message || 'Échec de la finalisation de l’inscription.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    const profileImage = summaryData.onboardingStep4?.photoProfil;
    try {
      if (profileImage && (profileImage.startsWith('http') || profileImage.startsWith('file://'))) {
        return { uri: profileImage };
      }
      return require('../../assets/images/ai.jpg');
    } catch (e) {
      console.error('Failed to load profile image, falling back to default:', e);
      return require('../../assets/images/ai.jpg');
    }
  };

  const navigateToEdit = (step: string) => {
    const currentFamilyId = 'family1';
    switch (step) {
      case 'onboardingStep1':
        navigation.navigate('UserOnboardingStep1', { userId, familyId: currentFamilyId });
        break;
      case 'onboardingStep2':
        navigation.navigate('UserOnboardingStep2', { userId, familyId: currentFamilyId });
        break;
      case 'onboardingStep3':
        navigation.navigate('UserOnboardingStep3', { userId, familyId: currentFamilyId });
        break;
      case 'onboardingStep4':
        navigation.navigate('UserOnboardingStep4', { userId, familyId: currentFamilyId });
        break;
      case 'onboardingStep5':
        navigation.navigate('UserOnboardingStep5', { userId, familyId: currentFamilyId });
        break;
    }
  };

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderDetailItem = (
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
    label: string,
    value: string | number,
  ) => {
    if (!value || value === 'N/A' || value === '') {
      return null;
    }
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    return (
      <View style={styles.detailGridItem}>
        <IconComponent name={iconName} size={18} color={COLORS.secondary} style={styles.itemIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemLabel}>{label}:</Text>
          <Text style={styles.itemValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderInfo = (
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
    label: string,
    value: string | number,
  ) => {
    if (!value || value === 'N/A' || value === '') {
      return null;
    }
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    return (
      <View style={styles.headerDetailItem}>
        <IconComponent name={iconName} size={14} color={COLORS.secondary} style={styles.headerItemIcon} />
        <Text style={styles.headerItemValue}>{value}</Text>
      </View>
    );
  };

  const renderListItems = (
    items: string[],
    label: string,
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
  ) => {
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    if (!items || items.length === 0 || (items.length === 1 && items[0] === '')) {
      return (
        <View style={styles.detailGridItem}>
          <IconComponent name="close" size={18} color={COLORS.secondary} style={styles.itemIcon} />
          <Text style={styles.itemValue}>Aucun {label.toLowerCase()}</Text>
        </View>
      );
    }
    return items.map((item, index) => (
      <View key={index} style={styles.detailGridItem}>
        <IconComponent name={iconName} size={18} color={COLORS.secondary} style={styles.itemIcon} />
        <Text style={styles.itemValue}>{truncateName(item, 15)}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.backgroundDark, COLORS.backgroundLight]} style={styles.backgroundGradient} />
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Image
              source={getImageSource()}
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => console.log('Échec du chargement de l’image, utilisation de l’image par défaut')}
            />
            {summaryData.onboardingStep1 && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {`${summaryData.onboardingStep1.nom || 'Nom'} ${summaryData.onboardingStep1.prenom || 'Prénom'}`}
                </Text>
                <View style={styles.personalDetailsColumn}>
                  {renderInfo('calendar', 'AntDesign', 'Date de Naissance', summaryData.onboardingStep1.dateNaissance || 'N/A')}
                  {renderInfo('user', 'FontAwesome', 'Rôle', summaryData.onboardingStep1.role || 'N/A')}
                  {renderInfo('phone', 'FontAwesome', 'Téléphone Urgence', summaryData.onboardingStep3?.contactUrgenceTelephone || 'N/A')}
                  {renderInfo('user-o', 'FontAwesome', 'Nom Contact', summaryData.onboardingStep3?.contactUrgenceNom || 'N/A')}
                </View>
                <TouchableOpacity onPress={() => navigateToEdit('onboardingStep1')} style={styles.editProfileButton}>
                  <FontAwesome name="edit" size={16} color={COLORS.editProfile} style={styles.editIcon} />
                  <Text style={[styles.editText, { color: COLORS.editProfile }]}>Modifier Profil</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Collapsible Sections */}
          <View style={styles.sectionsContainer}>
            {/* Section: Informations Personnelles et Contact */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('personal')}>
              <AntDesign name="user" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Informations Personnelles & Contact</Text>
              <AntDesign name={expandedSections.personal ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.personal && summaryData.onboardingStep1 && summaryData.onboardingStep3 && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderDetailItem('calendar', 'AntDesign', 'Date de Naissance', summaryData.onboardingStep1.dateNaissance || 'N/A')}
                  {renderDetailItem('user', 'FontAwesome', 'Rôle', summaryData.onboardingStep1.role || 'N/A')}
                  {renderDetailItem('phone', 'FontAwesome', 'Téléphone Urgence', summaryData.onboardingStep3.contactUrgenceTelephone || 'N/A')}
                  {renderDetailItem('user-o', 'FontAwesome', 'Nom Contact', summaryData.onboardingStep3.contactUrgenceNom || 'N/A')}
                </View>
              </View>
            )}

            {/* Section: Préférences Nutritionnelles */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('nutrition')}>
              <FontAwesome name="cutlery" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Préférences Nutritionnelles</Text>
              <AntDesign name={expandedSections.nutrition ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.nutrition && summaryData.onboardingStep2 && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderListItems(
                    getTrimmedArray(summaryData.onboardingStep2.preferencesAlimentaires),
                    'Préférences alimentaires',
                    'leaf',
                    'FontAwesome',
                  )}
                  {renderListItems(
                    getTrimmedArray(summaryData.onboardingStep2.allergies),
                    'Allergies alimentaires',
                    'exclamation-triangle',
                    'FontAwesome',
                  )}
                  {renderListItems(
                    getTrimmedArray(summaryData.onboardingStep2.restrictionsMedicales),
                    'Restrictions médicales',
                    'medkit',
                    'FontAwesome',
                  )}
                </View>
                <TouchableOpacity onPress={() => navigateToEdit('onboardingStep2')} style={styles.editButton}>
                  <FontAwesome name="edit" size={16} color={COLORS.secondary} style={styles.editIcon} />
                  <Text style={[styles.editText, { color: COLORS.secondary }]}>Modifier</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section: Repas Favoris */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('meals')}>
              <FontAwesome name="heart" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Repas Favoris</Text>
              <AntDesign name={expandedSections.meals ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.meals && summaryData.onboardingStep3 && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderListItems(
                    getTrimmedArray(summaryData.onboardingStep3.repasFavoris),
                    'Repas favoris',
                    'spoon',
                    'FontAwesome',
                  )}
                </View>
                <TouchableOpacity onPress={() => navigateToEdit('onboardingStep3')} style={styles.editButton}>
                  <FontAwesome name="edit" size={16} color={COLORS.secondary} style={styles.editIcon} />
                  <Text style={[styles.editText, { color: COLORS.secondary }]}>Modifier</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section: Paramètres IA */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('ai')}>
              <AntDesign name="setting" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Paramètres IA</Text>
              <AntDesign name={expandedSections.ai ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.ai && summaryData.onboardingStep5 && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderDetailItem(
                    'fire',
                    'FontAwesome',
                    'Niveau d’Épices',
                    summaryData.onboardingStep5.niveauEpices || '1',
                  )}
                  {renderDetailItem(
                    'fire',
                    'FontAwesome',
                    'Calories Cibles',
                    `${summaryData.onboardingStep5.apportCaloriqueCible || '2000'} kcal`,
                  )}
                  {renderListItems(
                    getTrimmedArray(summaryData.onboardingStep5.cuisinesPreferees),
                    'Cuisines préférées',
                    'cutlery',
                    'FontAwesome',
                  )}
                </View>
                <TouchableOpacity onPress={() => navigateToEdit('onboardingStep5')} style={styles.editButton}>
                  <FontAwesome name="edit" size={16} color={COLORS.secondary} style={styles.editIcon} />
                  <Text style={[styles.editText, { color: COLORS.secondary }]}>Modifier</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.modalMessageText}>{familyError}</Text>
          </View>
        </ScrollView>

        {/* Fixed Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.prevButton}
          >
            <AntDesign name="arrowleft" size={24} color={COLORS.text} />
            <Text style={styles.prevButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={ /*completeOnboarding*/ handleNext }
            style={styles.nextButtonOuter}
            disabled={isLoading }
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {isLoading  ? (
                <ActivityIndicator color={COLORS.buttonText} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Finaliser</Text>
                  <AntDesign name="check" size={24} color={COLORS.buttonText} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ModalComponent
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Erreur système"
      >
        <Image
          source={require('../../assets/icons/error.png')}
          style={styles.modalImage}
          accessibilityLabel="Icône d’erreur"
        />
        <Text style={styles.modalMessageText}>{errorMessage || familyError || 'Une erreur inconnue est survenue.'}</Text>
      </ModalComponent>
      <ModalComponent
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Confirmation"
      >
        <Text style={styles.modalMessageText}>Inscription validée avec succès ! Redirection en cours...</Text>
      </ModalComponent>
    </View>
  );
};

export default UserOnboardingSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl * 2, // Extra padding for navigation buttons
    paddingHorizontal: SPACING.m,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    marginBottom: SPACING.l,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    marginRight: SPACING.m,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: FONTS.profileName,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
  },
  personalDetailsColumn: {
    flexDirection: 'column',
    marginBottom: SPACING.s,
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerItemIcon: {
    marginRight: SPACING.s,
  },
  headerItemValue: {
    color: COLORS.textSecondary,
    fontSize: FONTS.headerInfo,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 166, 154, 0.2)', // Green-cyan with opacity
  },
  editIcon: {
    marginRight: SPACING.s,
  },
  editText: {
    fontSize: FONTS.detailValue,
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginBottom: SPACING.s,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionTitle: {
    color: COLORS.secondary,
    fontSize: FONTS.sectionTitle,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING.s,
  },
  sectionContent: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.m,
    padding: SPACING.s,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  itemIcon: {
    marginRight: SPACING.s,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.detailLabel,
    textTransform: 'uppercase',
  },
  itemValue: {
    color: COLORS.text,
    fontSize: FONTS.detailValue,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: SPACING.s,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 160, 61, 0.2)', // Secondary color with opacity
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
  },
  prevButtonText: {
    color: COLORS.text,
    fontSize: FONTS.button,
    marginLeft: SPACING.s,
  },
  nextButtonOuter: {
    flex: 1,
    marginLeft: SPACING.m,
    borderRadius: 15,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  nextButtonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: 'bold',
    marginRight: SPACING.s,
  },
  modalImage: {
    width: 80,
    height: 80,
    marginBottom: SPACING.m,
    borderRadius: 10,
  },
  modalMessageText: {
    color: COLORS.text,
    fontSize: FONTS.detailValue,
    textAlign: 'center',
  },
});
