import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  ScaledSize,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import DateTimePicker from '@react-native-community/datetimepicker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ModalComponent from '../../components/common/ModalComponent';
import { useNavigation } from '@react-navigation/native';

// Configuration
const COLORS = {
  placeholder: 'rgba(207, 191, 191, 0.62)',
  primary: '#E95221',
  secondary: '#F2A03D',
  backgroundDark: '#0D0D0D',
  backgroundLight: '#1A1A1A',
  inputBg: '#282828',
  inputBorder: '#444',
  inputFocus: '#E95221',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  error: '#FF6B6B',
  buttonText: '#FFFFFF',
};

const FONTS = {
  title: 22,
  inputLabel: 18,
  input: 16,
  button: 16,
  small: 12,
};

const SPACING = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingStep2'>;

type FormData = {
  preferencesAlimentaires: string;
  allergies: string;
  restrictionsMedicales: string;
};

type Step = {
  key: keyof FormData;
  label: string;
  placeholder: string;
  icon: string;
  type: 'text' | 'date' | 'select';
  options?: { label: string; value: string; icon?: string }[];
};

const { height } = Dimensions.get('window');

const UserOnboardingStep2: React.FC<{ route: { params: { userId: string; familyId: string } } }> = ({ route }) => {
  const { userId, familyId } = route.params;
  const navigation = useNavigation<NavigationProp>();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    preferencesAlimentaires: 'Aucune',
    allergies: '',
    restrictionsMedicales: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dish data for global scrolling
  const dishes = [
    { name: 'Poulet Rôti', info: 'Poulet cuit au four avec herbes, 300 kcal', image: require('../../assets/images/pizza.jpg') },
    { name: 'Salade Verte', info: 'Laitue, tomates, concombres, 100 kcal', image: require('../../assets/images/okok.jpg') },
    { name: 'Pâtes Carbonara', info: 'Pâtes avec sauce crémeuse, 500 kcal', image: require('../../assets/images/menu.jpg') },
  ];
  const [currentDishIndex, setCurrentDishIndex] = useState(0);

  // Form steps configuration
  const steps: Step[] = [
    { key: 'preferencesAlimentaires', label: 'Préférences alimentaires', placeholder: 'Koki , Poulet , Taro , etc...', icon: 'like1', type: 'text' },
    { key: 'allergies', label: 'Allergies', placeholder: 'Beurre , Miel, etc.. ', icon: 'warning', type: 'text' },
    { key: 'restrictionsMedicales', label: 'Restrictions médicales', placeholder: 'Sel, Cube , Sucre , etc..', icon: 'medicinebox', type: 'text' },
  ];

  // Handle orientation changes
  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setWindowDimensions(window);
    };
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription.remove();
  }, []);

  // Save and clear form data
  const saveFormData = useCallback(async () => {
    try {
      // Set "Aucune" as default for preferencesAlimentaires if empty
      const updatedFormData = {
        ...formData,
        preferencesAlimentaires: formData.preferencesAlimentaires.trim() || 'Aucune',
      };
      await AsyncStorage.setItem('onboardingStep2', JSON.stringify(updatedFormData));
    } catch (error) {
      console.error('Error saving data:', error);
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    }
  }, [formData]);

  const clearFormData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('onboardingStep2');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }, []);

  // Load saved data and trigger initial animation
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('onboardingStep2');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData({
            ...parsedData,
            preferencesAlimentaires: parsedData.preferencesAlimentaires || 'Aucune',
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Erreur lors du chargement des données.');
        setErrorModalVisible(true);
      }
    };
    loadData();

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  // Animation on step change and dish cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDishIndex((prev) => (prev + 1) % dishes.length);
    }, 5000); // Change dish every 5 seconds
    return () => clearInterval(interval);
  }, [dishes.length]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      saveFormData();
    });
  }, [currentStep, slideAnim, fadeAnim, saveFormData]);

  const handleNext = async () => {
    const step = steps[currentStep];

    // Input validation
    if (step.type === 'text' && step.key === 'preferencesAlimentaires' && !formData.preferencesAlimentaires.trim()) {
      setErrorMessage(`Veuillez entrer vos ${step.label.toLowerCase().replace('votre ', '')}.`);
      setErrorModalVisible(true);
      return;
    }

    if (currentStep < steps.length - 1) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(0);
      });
    } else {
      // Set "Aucune" for preferencesAlimentaires if empty before final save
      const updatedFormData = {
        ...formData,
        preferencesAlimentaires: formData.preferencesAlimentaires.trim() || 'Aucune',
      };
      setFormData(updatedFormData);

      setIsLoading(true);
      try {
        await AsyncStorage.setItem('onboardingStep2', JSON.stringify(updatedFormData));
        navigation.navigate('UserOnboardingStep3', { userId, familyId });
      } catch (error) {
        console.error('Final save error:', error);
        setErrorMessage('Erreur lors de la sauvegarde finale des données.');
        setErrorModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 2, // Slide from right to left (reverse of Next)
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(0);
      });
    } else {
      clearFormData();
      navigation.navigate('UserOnboardingStep1', { userId, familyId });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, [steps[currentStep].key]: formattedDate } as FormData);
    }
  };

  const renderInput = () => {
    const step = steps[currentStep];
    const citations = [
      "« Manger sainement est un acte d'amour envers soi-même. »",
      "« La cuisine est un art, chaque plat une œuvre d'art. »",
      "« Un repas équilibré nourrit le corps et l'esprit. »",
    ];

    return (
      <Animated.View
        key={step.key}
        style={[
          styles.inputContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [windowDimensions.width, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.inputLabel}>{step.label}</Text>

        {step.type === 'text' && (
          <View style={styles.textInputWrapper}>
            <AntDesign name={step.icon} size={20} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder={step.placeholder}
              placeholderTextColor={COLORS.placeholder}
              value={formData[step.key]}
              onChangeText={(text) => setFormData({ ...formData, [step.key]: text })}
              numberOfLines={2}
              autoFocus={false}
              onBlur={() => saveFormData()}
            />
          </View>
        )}

        {step.type === 'date' && (
          <TouchableOpacity
            style={styles.textInputWrapper}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <AntDesign name={step.icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.dateText, !formData[step.key] && { color: COLORS.textSecondary }]}>
              {formData[step.key] || step.placeholder}
            </Text>
            {showDatePicker && (
              <DateTimePicker
                value={formData[step.key] ? new Date(formData[step.key]) : new Date()}
                mode="date"
                display={'spinner'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor={COLORS.secondary}
                style={{ backgroundColor: COLORS.inputBg }}
              />
            )}
          </TouchableOpacity>
        )}

        {step.type === 'select' && (
          <View style={styles.selectContainer}>
            {step.options!.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  formData[step.key] === option.value && styles.selectedOption,
                ]}
                onPress={() => setFormData({ ...formData, [step.key]: option.value })}
                activeOpacity={0.7}
              >
                {option.icon && (
                  <AntDesign name={option.icon} size={18} color={formData[step.key] === option.value ? COLORS.buttonText : COLORS.text} style={styles.optionIcon} />
                )}
                <Text style={[styles.selectOptionText, formData[step.key] === option.value && { color: COLORS.buttonText }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView
          horizontal
          style={styles.citationContainer}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: SPACING.s }}
        >
          {citations.map((citation, index) => (
            <Text key={index} style={styles.citationText}>
              {citation}
            </Text>
          ))}
        </ScrollView>

        <Animated.View style={styles.dishContainer}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [1, 1],
                    outputRange: [0, windowDimensions.width],
                  }),
                },
              ],
            }}
          >
            <Image source={dishes[currentDishIndex].image} style={styles.dishImage} resizeMode="cover" />
            <Text style={styles.dishName}>{dishes[currentDishIndex].name}</Text>
            <Text style={styles.dishInfo}>{dishes[currentDishIndex].info}</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  };

  const adminInfo = [
    { title: 'Administrateur (Parent)', icon: 'team', description: 'Gestion complète de la famille, ajout/suppression de membres, accès à toutes les fonctionnalités.' },
    { title: 'Membre (Enfant/Conjoint)', icon: 'user', description: 'Accès limité aux données personnelles et aux fonctionnalités partagées.' },
    { title: 'Autres Rôles', icon: 'info', description: 'Rôle personnalisé avec accès restreint, défini par l’administrateur.' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? SPACING.xl : 0}
    >
      <LinearGradient
        colors={[COLORS.backgroundDark, '#282828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingHorizontal: isLandscape ? windowDimensions.width * 0.1 : SPACING.l,
            minHeight: windowDimensions.height,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.titleWrapper}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.titleText}>Préférences et Restrictions</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={[styles.formContainer, { minHeight: isLandscape ? windowDimensions.height * 0.6 : windowDimensions.height * 0.4 }]}>
          {renderInput()}
        </View>

        <View style={[styles.navigationButtons, { marginBottom: SPACING.xl }]}>
          <TouchableOpacity onPress={handlePrev} style={styles.prevButton}>
            <AntDesign name="arrowleft" size={24} color={COLORS.text} />
            <Text style={styles.prevButtonText}>Retour</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextButtonOuter} disabled={isLoading}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.buttonText} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                  </Text>
                  <MaterialIcons
                    name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'}
                    size={24}
                    color={COLORS.buttonText}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ModalComponent style={styles.center} visible={errorModalVisible} onClose={() => setErrorModalVisible(false)} title="Erreur">
        <Image
          source={require('../../assets/icons/info.png')}
          style={styles.modalImage}
          accessibilityLabel="Icône d’erreur"
        />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </ModalComponent>

      <ModalComponent visible={adminModalVisible} onClose={() => setAdminModalVisible(false)} title="Informations sur les Rôles">
        <ScrollView style={styles.adminModalContent}>
          {adminInfo.map((item, index) => (
            <View key={index} style={styles.adminItem}>
              <AntDesign name={item.icon} size={24} color={COLORS.primary} style={styles.adminIcon} />
              <View style={styles.adminTextContainer}>
                <Text style={styles.adminTitle}>{item.title}</Text>
                <Text style={styles.adminDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ModalComponent>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  modalImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: SPACING.m,
    alignItems: 'center',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGradient: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: 25,
    overflow: 'hidden',
  },
  titleText: {
    fontSize: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  inputLabel: {
    color: COLORS.secondary,
    fontSize: FONTS.inputLabel,
    fontWeight: '600',
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
    paddingHorizontal: SPACING.m,
    paddingVertical: Platform.OS === 'ios' ? SPACING.m : SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    elevation: 5,
    width: '100%',
    maxWidth: 500,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.input,
    marginLeft: SPACING.s,
    paddingVertical: Platform.OS === 'android' ? SPACING.s / 2 : 0,
  },
  dateText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.input,
    marginLeft: SPACING.s,
    paddingVertical: Platform.OS === 'android' ? SPACING.s / 2 : 0,
  },
  inputIcon: {
    marginRight: SPACING.s,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
  },
  selectOption: {
    width: '48%', // Adjusted for 2 columns with spacing
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.inputFocus,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center text and icon
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary, // Solid color for selected
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  optionIcon: {
    marginRight: SPACING.s,
  },
  selectOptionText: {
    color: COLORS.text,
    fontSize: FONTS.input,
  },
  roleNote: {
    width: '100%',
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'center',
    marginTop: SPACING.m,
    lineHeight: FONTS.small * 1.5,
  },
  roleLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  citationContainer: {
    height: 40,
    marginVertical: SPACING.m,
  },
  citationText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontStyle: 'italic',
    marginHorizontal: SPACING.s,
  },
  dishContainer: {
    height: 100,
    marginTop: SPACING.m,
    alignItems: 'center',
  },
  dishImage: {
    width: 80,
    height: 60,
    marginBottom: SPACING.s,
    borderRadius: 5,
  },
  dishName: {
    color: COLORS.secondary,
    fontSize: FONTS.input,
    fontWeight: '600',
  },
  dishInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    paddingBottom: SPACING.m,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
    elevation: 5,
  },
  prevButtonText: {
    color: COLORS.text,
    fontSize: FONTS.button,
    marginLeft: SPACING.s,
  },
  nextButtonOuter: {
    flex: 1,
    marginLeft: SPACING.l,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  nextButtonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: 'bold',
    marginRight: SPACING.s,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: SPACING.m,
  },
  adminModalContent: {
    maxHeight: height * 0.5,
    padding: SPACING.s,
  },
  adminItem: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
    alignItems: 'flex-start',
  },
  adminIcon: {
    marginRight: SPACING.s,
    marginTop: 4,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    color: COLORS.text,
    fontSize: FONTS.input,
    fontWeight: '600',
    marginBottom: SPACING.s / 2,
  },
  adminDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    lineHeight: FONTS.small * 1.4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  modalButton: {
    padding: SPACING.m,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: SPACING.s / 2,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: '600',
  },
});

export default UserOnboardingStep2;
