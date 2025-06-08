import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
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

const UserOnboardingSummary: React.FC<{ route: { params: { userId: string } } }> = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [summaryData, setSummaryData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const { loading: familyLoading, error: familyError, createFamily, addFamilyMember } = useFamilyData(userId);

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
    loadSummary();
  }, [titleOpacity]);

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
      setErrorMessage('Échec du chargement des données utilisateur.');
      setErrorModalVisible(true);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Créer la famille avec le nom basé sur le nom de l'utilisateur
      const familyName = summaryData.onboardingStep1?.nom
        ? `Famille de ${summaryData.onboardingStep1.nom}`
        : 'Famille NutriPlanner';
      await createFamily(userId, familyName);


      const memberData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        userId,
        nom: summaryData.onboardingStep1?.nom || '',
        prenom: summaryData.onboardingStep1?.prenom || '',
        dateNaissance: summaryData.onboardingStep1?.dateNaissance || '',
        genre: (summaryData.onboardingStep1?.genre as Genre) || 'autre',
        role: (summaryData.onboardingStep1?.role as UserRole) || 'parent',
        preferencesAlimentaires: summaryData.onboardingStep2?.preferencesAlimentaires
          ? (summaryData.onboardingStep2.preferencesAlimentaires as string).split(',').map((s) => s.trim())
          : [],
        allergies: summaryData.onboardingStep2?.allergies
          ? (summaryData.onboardingStep2.allergies as string).split(',').map((s) => s.trim())
          : [],
        restrictionsMedicales: summaryData.onboardingStep2?.restrictionsMedicales
          ? (summaryData.onboardingStep2.restrictionsMedicales as string).split(',').map((s) => s.trim())
          : [],
        photoProfil: summaryData.onboardingStep4?.photoProfil || '',
        repasFavoris: summaryData.onboardingStep3?.repasFavoris
          ? (summaryData.onboardingStep3.repasFavoris as string).split(',').map((s) => s.trim())
          : [],
        historiqueRepas: [],
        contactUrgence: {
          nom: summaryData.onboardingStep3?.contactUrgenceNom || '',
          telephone: summaryData.onboardingStep3?.contactUrgenceTelephone || '',
        },
        aiPreferences: {
          niveauEpices: Number(summaryData.onboardingStep5?.niveauEpices) || 1,
          apportCaloriqueCible: Number(summaryData.onboardingStep5?.apportCaloriqueCible) || 2000,
          cuisinesPreferees: summaryData.onboardingStep5?.cuisinesPreferees
            ? (summaryData.onboardingStep5.cuisinesPreferees as string).split(',').map((s) => s.trim())
            : [],
        },
        historiqueSante: [],
        niveauAcces: 'admin',
        familyId: 'family1',
        createurId: userId,
      };

      // Ajouter le membre à la famille
      const memberId = await addFamilyMember(memberData);
      if (!memberId) {
        throw new Error('Échec de l’enregistrement du membre de la famille.');
      }

      // Authentification et finalisation
      const email = await AsyncStorage.getItem('signupEmail');
      const password = await AsyncStorage.getItem('signupPassword');
      if (email && password) {
        const loggedInUserId = await login(email, password);
        if (loggedInUserId) {
          await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          setSuccessModalVisible(true); // Afficher la modale de succès
          setTimeout(() => {
            navigation.replace('Home');
          }, 2000); // Rediriger après 2 secondes
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la connexion ou de la création de la famille.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    // Utiliser l'image de l'étape 4 si disponible, sinon la par défaut
    const profileImage = summaryData.onboardingStep4?.photoProfil;
    try {
      return profileImage ? { uri: profileImage } : require('../../assets/images/ai.jpg');
    } catch {
      return require('../../assets/images/ai.jpg');
    }
  };

  const handleFocusButton = () => {
    Animated.timing(buttonAnim, {
      toValue: 1.05,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlurButton = () => {
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const navigateToEdit = (step: string) => {
    switch (step) {
      case 'onboardingStep1':
        navigation.navigate('UserOnboardingStep1', { userId, familyId: 'family1' });
        break;
      case 'onboardingStep2':
        navigation.navigate('UserOnboardingStep2', { userId, familyId: 'family1' });
        break;
      case 'onboardingStep3':
        navigation.navigate('UserOnboardingStep3', { userId, familyId: 'family1' });
        break;
      case 'onboardingStep4':
        navigation.navigate('UserOnboardingStep4', { userId, familyId: 'family1' });
        break;
      case 'onboardingStep5':
        navigation.navigate('UserOnboardingStep5', { userId, familyId: 'family1' });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0d0d0d', '#000']} style={styles.backgroundGradient} />
      {/* Image en haut de l'écran */}
      <Image
        source={getImageSource()}
        style={styles.headerImage}
        resizeMode="cover"
        onError={() => console.log('Échec du chargement de l’image, utilisation de l’image par défaut')}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            Synthèse des données utilisateur
          </Animated.Text>
          <View style={styles.summaryContainer}>
            {/* Profil personnel */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <AntDesign name="user" size={24} color="#f7b733" />
                <Text style={styles.categoryTitle}>Profil personnel</Text>
              </View>
              {summaryData.onboardingStep1 && (
                <View style={styles.categoryContent}>
                  <Text style={styles.summaryDetail}>
                    {summaryData.onboardingStep1.nom} {summaryData.onboardingStep1.prenom},{' '}
                    {summaryData.onboardingStep1.dateNaissance}, {summaryData.onboardingStep1.genre},{' '}
                    {summaryData.onboardingStep1.role}
                  </Text>
                  <TouchableOpacity onPress={() => navigateToEdit('onboardingStep1')}>
                    <FontAwesome name="edit" size={18} color="#fc4a1a" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Préférences nutritionnelles */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <AntDesign name="like1" size={24} color="#f7b733" />
                <Text style={styles.categoryTitle}>Préférences nutritionnelles</Text>
              </View>
              {summaryData.onboardingStep2 && (
                <View style={styles.categoryContent}>
                  <Text style={styles.summaryDetail}>
                    {summaryData.onboardingStep2.preferencesAlimentaires}, Allergies :{' '}
                    {summaryData.onboardingStep2.allergies}, Restrictions :{' '}
                    {summaryData.onboardingStep2.restrictionsMedicales}
                  </Text>
                  <TouchableOpacity onPress={() => navigateToEdit('onboardingStep2')}>
                    <FontAwesome name="edit" size={18} color="#fc4a1a" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Détails des repas et contacts */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <AntDesign name="heart" size={24} color="#f7b733" />
                <Text style={styles.categoryTitle}>Détails des repas et contacts</Text>
              </View>
              {summaryData.onboardingStep3 && (
                <View style={styles.categoryContent}>
                  <Text style={styles.summaryDetail}>
                    Repas favoris : {summaryData.onboardingStep3.repasFavoris}, Contact :{' '}
                    {summaryData.onboardingStep3.contactUrgenceNom} (
                    {summaryData.onboardingStep3.contactUrgenceTelephone})
                  </Text>
                  <TouchableOpacity onPress={() => navigateToEdit('onboardingStep3')}>
                    <FontAwesome name="edit" size={18} color="#fc4a1a" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Image de profil */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <AntDesign name="camera" size={24} color="#f7b733" />
                <Text style={styles.categoryTitle}>Image de profil</Text>
              </View>
              {summaryData.onboardingStep4 && (
                <View style={styles.categoryContent}>
                  <Text style={styles.summaryDetail}>Image sélectionnée</Text>
                  <TouchableOpacity onPress={() => navigateToEdit('onboardingStep4')}>
                    <FontAwesome name="edit" size={18} color="#fc4a1a" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Paramètres d’intelligence artificielle */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <AntDesign name="setting" size={24} color="#f7b733" />
                <Text style={styles.categoryTitle}>Paramètres d’intelligence artificielle</Text>
              </View>
              {summaryData.onboardingStep5 && (
                <View style={styles.categoryContent}>
                  <Text style={styles.summaryDetail}>
                    Niveau épices : {summaryData.onboardingStep5.niveauEpices}, Calories :{' '}
                    {summaryData.onboardingStep5.apportCaloriqueCible}, Cuisines :{' '}
                    {summaryData.onboardingStep5.cuisinesPreferees}
                  </Text>
                  <TouchableOpacity onPress={() => navigateToEdit('onboardingStep5')}>
                    <FontAwesome name="edit" size={18} color="#fc4a1a" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [
                  {
                    scale: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity
              onPress={completeOnboarding}
              style={styles.buttonInner}
              disabled={isLoading || familyLoading}
              onPressIn={handleFocusButton}
              onPressOut={handleBlurButton}>
              <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.gradientButton}>
                {isLoading || familyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AntDesign name="checkcircle" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Finaliser l’inscription</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
      <ModalComponent
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Erreur système">
        <Text style={styles.modalMessageText}>{errorMessage || familyError}</Text>
      </ModalComponent>
      <ModalComponent
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="Confirmation">
        <Text style={styles.modalMessageText}>Inscription validée avec succès ! Redirection en cours...</Text>
      </ModalComponent>
    </View>
  );
};

export default UserOnboardingSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  headerImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 220,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    color: '#f7b733',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDetail: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 15,
  },
  buttonInner: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
  modalMessageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});
