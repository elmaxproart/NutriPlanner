import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { ModalComponent } from '../../components/common/Modal';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingStep5'>;

const UserOnboardingStep5: React.FC<{ route: { params: { userId: string; familyId: string } } }> = ({ route }) => {
  const { userId, familyId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    niveauEpices: 1,
    apportCaloriqueCible: '',
    cuisinesPreferees: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState({
    apportCaloriqueCible: false,
    cuisinesPreferees: false,
  });
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
    loadData();
  }, [titleOpacity]);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('onboardingStep5');
      if (storedData) {
        setFormData(JSON.parse(storedData));
      }
    } catch (e: any) {
      setErrorMessage('Erreur lors du chargement des données.');
      setErrorModalVisible(true);
    }
  };

  const validateForm = () => {
    if (!formData.apportCaloriqueCible || !formData.cuisinesPreferees) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      setErrorModalVisible(true);
      return false;
    }
    if (isNaN(Number(formData.apportCaloriqueCible)) || Number(formData.apportCaloriqueCible) < 0) {
      setErrorMessage('L’apport calorique doit être un nombre positif.');
      setErrorModalVisible(true);
      return false;
    }
    return true;
  };

  const saveAndProceed = async () => {
    if (!validateForm()) {return;}
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('onboardingStep5', JSON.stringify(formData));
      navigation.navigate('UserOnboardingSummary', { userId, familyId });
    } catch (e: any) {
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    try {
      return require('../../assets/images/ai-preferences.jpg');
    } catch {
      return require('../../assets/images/ai.jpg');
    }
  };

  const handleFocus = (field: 'apportCaloriqueCible' | 'cuisinesPreferees') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field: 'apportCaloriqueCible' | 'cuisinesPreferees') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
    Animated.timing(inputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0d0d0d', '#000']} style={styles.backgroundGradient} />
      <Image source={getImageSource()} style={styles.backgroundImage} resizeMode="cover" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <AntDesign name="arrowleft" size={24} color="#f7b733" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            Étape 5 : Préférences IA
          </Animated.Text>
          <View style={styles.inputContainer}>
            <View style={styles.sliderContainer}>
              <Text style={styles.label}>Niveau d'épices (1-5)</Text>
              <Slider
                value={formData.niveauEpices}
                onValueChange={(value) => setFormData({ ...formData, niveauEpices: Math.round(value[0]) })}
                minimumValue={1}
                maximumValue={5}
                step={1}
                thumbTintColor="#f7b733"
                minimumTrackTintColor="#fc4a1a"
                maximumTrackTintColor="#1a1a1a"
                disabled={isLoading}
              />
              <Text style={styles.sliderValue}>{formData.niveauEpices}</Text>
            </View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.apportCaloriqueCible && styles.inputFocused,
                {
                  transform: [
                    {
                      scale: inputAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}>
              <AntDesign name="fire" size={20} color={isFocused.apportCaloriqueCible ? '#f7b733' : '#aaa'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apport calorique cible (kcal)"
                placeholderTextColor="#aaa"
                value={formData.apportCaloriqueCible}
                onChangeText={(text) => setFormData({ ...formData, apportCaloriqueCible: text })}
                keyboardType="numeric"
                onFocus={() => handleFocus('apportCaloriqueCible')}
                onBlur={() => handleBlur('apportCaloriqueCible')}
                editable={!isLoading}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.cuisinesPreferees && styles.inputFocused,
                {
                  transform: [
                    {
                      scale: inputAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}>
              <AntDesign name="rest" size={20} color={isFocused.cuisinesPreferees ? '#f7b733' : '#aaa'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cuisines préférées (séparées par des virgules)"
                placeholderTextColor="#aaa"
                value={formData.cuisinesPreferees}
                onChangeText={(text) => setFormData({ ...formData, cuisinesPreferees: text })}
                multiline
                numberOfLines={2}
                onFocus={() => handleFocus('cuisinesPreferees')}
                onBlur={() => handleBlur('cuisinesPreferees')}
                editable={!isLoading}
              />
                        </Animated.View>
          </View>
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [
                  {
                    scale: inputAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity onPress={saveAndProceed} style={styles.buttonInner} disabled={isLoading}>
              <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.gradientButton}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AntDesign name="arrowright" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Suivant</Text>
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
        title="Erreur">
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </View>
  );
};

export default UserOnboardingStep5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    color: '#f7b733',
    fontSize: 16,
    marginLeft: 10,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    paddingLeft: 40,
  },
  inputFocused: {
    borderColor: '#f7b733',
    backgroundColor: '#252525',
    shadowColor: '#f7b733',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  sliderContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  sliderValue: {
    color: '#f7b733',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
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
