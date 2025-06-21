import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ImageSourcePropType,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ModalComponent from '../../components/common/ModalComponent';
import { useNavigation } from '@react-navigation/native';
import { ScaledSize } from 'react-native';

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
  inputFocus: '#E95221',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  error: '#FF6B6B',
  buttonText: '#FFFFFF',
  cardBg: '#2C2C2C',
  shadow: '#000',
};

const FONTS = {
  title: 22,
  sectionTitle: 18,
  inputLabel: 16,
  input: 16,
  button: 16,
  small: 12,
  dishName: 14,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingStep5'>;

type FormData = {
  niveauEpices: number;
  apportCaloriqueCible: string;
  cuisinesPreferees: string;
};

type Step = {
  key: keyof FormData;
  label: string;
  placeholder?: string;
  icon: string;
  iconLib: 'AntDesign' | 'FontAwesome';
  type: 'buttons' | 'text' | 'select';
};

type Dish = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  info: string;
};

// Static image mapping
const imageMap: { [key: string]: ImageSourcePropType } = {
  'ai.jpg': require('../../assets/images/ai.jpg'),
  'eru.jpg': require('../../assets/images/eru.jpg'),
  'hamburgeur.jpg': require('../../assets/images/hamburgeur.jpg'),
  'ia.jpg': require('../../assets/images/ia.jpg'),
  'koki.jpg': require('../../assets/images/koki.jpg'),
  'Le-met-de-pistache1.jpg': require('../../assets/images/Le-met-de-pistache1.jpg'),
  'mbongo.jpg': require('../../assets/images/mbongo.jpg'),
  'menu.jpg': require('../../assets/images/menu.jpg'),
  'noodle.jpg': require('../../assets/images/noodle.jpg'),
  'okok.jpg': require('../../assets/images/okok.jpg'),
  'pile-haricot.jpg': require('../../assets/images/pile-haricot.jpg'),
  'pizza.jpg': require('../../assets/images/pizza.jpg'),
  'puree.jpg': require('../../assets/images/puree.jpg'),
  'R.jpg': require('../../assets/images/R.jpg'),
  'resete.jpg': require('../../assets/images/resete.jpg'),
  'shopping.jpg': require('../../assets/images/shopping.jpg'),
  'taro-sauce-jaune.jpg': require('../../assets/images/taro-sauce-jaune.jpg'),
  'wrap.jpg': require('../../assets/images/wrap.jpg'),
};

const UserOnboardingStep5: React.FC<{ route: { params: { userId: string; familyId: string } } }> = ({ route }) => {
  const { userId, familyId } = route.params;
  const navigation = useNavigation<NavigationProp>();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    niveauEpices: 3,
    apportCaloriqueCible: '',
    cuisinesPreferees: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isLandscape = windowDimensions.width > windowDimensions.height;

  // Dish data
  const generateDishes = useCallback((): Dish[] => {
    const dishes: Dish[] = [];
    const baseDishNames = [
      'Poulet Yassa', 'Ndole', 'Spaghetti Carbonara', 'Sushi Rolls', 'Jollof Rice',
      'Pistache Pudding', 'Mbongo Tchobi', 'Mixed Grill', 'Ramen Noodle', 'Okok',
      'Haricots Piles', 'Margherita Pizza', 'Pomme Puree', 'Ravioli', 'Risotto',
      'Salade Composee', 'Taro Sauce Jaune', 'Chicken Wrap',
    ];

    const imageKeys = Object.keys(imageMap);

    baseDishNames.forEach((baseName, index) => {
      const imageKey = imageKeys[index % imageKeys.length];
      dishes.push({
        id: index.toString(),
        name: baseName,
        image: imageMap[imageKey],
        info: `Prép: ${Math.floor(Math.random() * 60) + 15} min`,
      });
    });

    return dishes;
  }, []);

  const dishes = generateDishes();

  const steps: Step[] = [
    { key: 'niveauEpices', label: 'Niveau d\'épices', icon: 'star-o', iconLib: 'FontAwesome', type: 'buttons' },
    { key: 'apportCaloriqueCible', label: 'Apport calorique cible', placeholder: 'Ex: 2000', icon: 'dashboard', iconLib: 'AntDesign', type: 'text' },
    { key: 'cuisinesPreferees', label: 'Plats préférés', icon: 'heart-o', iconLib: 'FontAwesome', type: 'select' },
  ];

  // Handle orientation changes
  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setWindowDimensions(window);
    };
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription.remove();
  }, []);

  // Load saved data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('onboardingStep5');
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Erreur lors du chargement des données.');
        setErrorModalVisible(true);
      }
    };
    loadData();
  }, []);

  // Save form data
  const saveFormData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('onboardingStep5', JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving data:', error);
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    }
  }, [formData]);

  useEffect(() => {
    saveFormData();
  }, [formData, saveFormData]);

  // Navigation handlers
  const handleNext = async () => {
    const step = steps[currentStep];

    if (step.type === 'text') {
      const value = String(formData[step.key]).trim();
      if (!value) {
        setErrorMessage(`Veuillez entrer votre ${step.label.toLowerCase().replace('votre ', '')}.`);
        setErrorModalVisible(true);
        return;
      }
    }

    if (step.key === 'apportCaloriqueCible' && (isNaN(Number(formData.apportCaloriqueCible)) || Number(formData.apportCaloriqueCible) <= 0)) {
      setErrorMessage('L\'apport calorique doit être un nombre positif.');
      setErrorModalVisible(true);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      try {
        await AsyncStorage.setItem('onboardingStep5', JSON.stringify(formData));
        navigation.navigate('UserOnboardingSummary', { userId, familyId });
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Form handlers
  const incrementSpiceLevel = () => {
    if (formData.niveauEpices < 5) {
      setFormData({ ...formData, niveauEpices: formData.niveauEpices + 1 });
    }
  };

  const decrementSpiceLevel = () => {
    if (formData.niveauEpices > 1) {
      setFormData({ ...formData, niveauEpices: formData.niveauEpices - 1 });
    }
  };

  const toggleDishSelection = (dishName: string) => {
    const selectedDishes = formData.cuisinesPreferees.split(',').map(d => d.trim()).filter(d => d);
    if (selectedDishes.includes(dishName)) {
      setFormData({ ...formData, cuisinesPreferees: selectedDishes.filter(d => d !== dishName).join(',') });
    } else {
      setFormData({ ...formData, cuisinesPreferees: [...selectedDishes, dishName].join(',') });
    }
  };

  // Render section content
  const renderStepContent = (step: Step) => {
    switch (step.type) {
      case 'buttons':
        return (
          <View style={styles.spiceButtonContainer}>
            <TouchableOpacity
              onPress={decrementSpiceLevel}
              style={[styles.spiceButton, formData.niveauEpices === 1 && styles.disabledButton]}
              disabled={formData.niveauEpices === 1}
            >
              <AntDesign name="minus" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.spiceLevel}>{formData.niveauEpices}</Text>
            <TouchableOpacity
              onPress={incrementSpiceLevel}
              style={[styles.spiceButton, formData.niveauEpices === 5 && styles.disabledButton]}
              disabled={formData.niveauEpices === 5}
            >
              <AntDesign name="plus" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        );
      case 'text':
        return (
          <View style={styles.textInputWrapper}>
            <FontAwesome name={step.icon} size={20} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder={step.placeholder}
              placeholderTextColor={COLORS.placeholder}
              value={String(formData[step.key])}
              onChangeText={(text) => setFormData({ ...formData, [step.key]: text })}
              keyboardType={step.key === 'apportCaloriqueCible' ? 'numeric' : 'default'}
              onBlur={saveFormData}
              editable={!isLoading}
            />
            {step.key === 'apportCaloriqueCible' && (
              <Text style={styles.unitText}>kcal</Text>
            )}
          </View>
        );
      case 'select':
        return (
          <ScrollView contentContainerStyle={styles.dishGridContainer}>
            {dishes.map((dish) => {
              const isSelected = formData.cuisinesPreferees.split(',').map(d => d.trim()).includes(dish.name);
              return (
                <TouchableOpacity
                  key={dish.id}
                  style={[styles.dishCard, isSelected && styles.selectedDishCard]}
                  onPress={() => toggleDishSelection(dish.name)}
                  activeOpacity={0.8}
                >
                  <Image source={dish.image} style={styles.dishImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.8)']}
                    style={styles.dishInfoOverlay}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishInfo}>{dish.info}</Text>
                  </LinearGradient>
                  <View style={styles.checkboxContainer}>
                    <FontAwesome
                      name={isSelected ? 'check-square' : 'square-o'}
                      size={20}
                      color={isSelected ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  // Render step
  const renderStep = (step: Step) => {
    const IconComponent = step.iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <IconComponent name={step.icon} size={20} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>{step.label}</Text>
        </View>
        <View style={styles.sectionContent}>
          {renderStepContent(step)}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? SPACING.xl : 0}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[COLORS.backgroundDark, COLORS.backgroundLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.titleText}>Étape 5 : Préférences IA</Text>
            </LinearGradient>
          </View>
          <View style={styles.sectionsWrapper}>
            {renderStep(steps[currentStep])}
          </View>
        </ScrollView>
        <View style={styles.navigationButtons}>
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
                  <AntDesign
                    name={currentStep === steps.length - 1 ? 'check' : 'arrowright'}
                    size={24}
                    color={COLORS.buttonText}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      <ModalComponent
        style={styles.modalContainer}
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Erreur"
      >
        <Image
          source={require('../../assets/icons/error.png')}
          style={styles.modalImage}
          accessibilityLabel="Icône d'erreur"
        />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </ModalComponent>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  titleGradient: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: 25,
  },
  titleText: {
    fontSize: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  sectionsWrapper: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: FONTS.sectionTitle,
    fontWeight: '600',
    marginLeft: SPACING.s,
  },
  sectionContent: {
    padding: SPACING.m,
  },
  spiceButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  spiceButton: {
    padding: SPACING.s,
    backgroundColor: COLORS.inputBorder,
    borderRadius: 25,
    marginHorizontal: SPACING.m,
  },
  disabledButton: {
    opacity: 0.5,
  },
  spiceLevel: {
    color: COLORS.text,
    fontSize: FONTS.input * 1.5,
    fontWeight: 'bold',
    width: 40,
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
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.input,
    marginLeft: SPACING.s,
    paddingVertical: Platform.OS === 'android' ? SPACING.s / 2 : 0,
  },
  inputIcon: {
    marginRight: SPACING.s,
  },
  unitText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.input,
    marginLeft: SPACING.s,
  },
  dishGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dishCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: SPACING.m,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
    position: 'relative',
  },
  selectedDishCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.s,
    justifyContent: 'flex-end',
    height: '40%',
  },
  dishName: {
    color: COLORS.text,
    fontSize: FONTS.dishName,
    fontWeight: '600',
  },
  dishInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  checkboxContainer: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    padding: SPACING.xs,
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
  modalContainer: {
    alignItems: 'center',
  },
  modalImage: {
    width: 80,
    height: 80,
    marginBottom: SPACING.m,
    borderRadius: 10,
  },
  errorText: {
    color: COLORS.text,
    fontSize: FONTS.input,
    textAlign: 'center',
    marginVertical: SPACING.m,
  },
});

export default UserOnboardingStep5;
