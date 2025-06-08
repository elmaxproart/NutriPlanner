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
import { Picker } from '@react-native-picker/picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ModalComponent } from '../../components/common/Modal';
import { useNavigation } from '@react-navigation/native';
import { Genre, UserRole } from '../../constants/categories';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingStep1'>;

const UserOnboardingStep1: React.FC<{ route: { params: { userId: string; familyId: string } } }> = ({ route }) => {
  const { userId, familyId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    genre: 'homme' as Genre,
    role: 'parent' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState({
    nom: false,
    prenom: false,
    dateNaissance: false,
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
    loadFormData();
  }, [titleOpacity]);

  const loadFormData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('onboardingStep1');
      if (storedData) {
        setFormData(JSON.parse(storedData));
      }
    } catch (e: any) {
      setErrorMessage('Erreur lors du chargement des données.');
      setErrorModalVisible(true);
    }
  };

  const validateForm = () => {
    if (!formData.nom || !formData.prenom || !formData.dateNaissance) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      setErrorModalVisible(true);
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateNaissance)) {
      setErrorMessage('La date de naissance doit être au format AAAA-MM-JJ.');
      setErrorModalVisible(true);
      return false;
    }
    return true;
  };

  const saveAndProceed = async () => {
    if (!validateForm()) {return;}
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('onboardingStep1', JSON.stringify(formData));
      navigation.navigate('UserOnboardingStep2', { userId, familyId });
    } catch (e: any) {
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    try {
      return require('../../assets/images/personal-info.jpg');
    } catch {
      return require('../../assets/images/ai.jpg');
    }
  };

  const handleFocus = (field: 'nom' | 'prenom' | 'dateNaissance') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field: 'nom' | 'prenom' | 'dateNaissance') => {
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
            Étape 1 : Informations personnelles
          </Animated.Text>
          <View style={styles.inputContainer}>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.nom && styles.inputFocused,
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
              <AntDesign name="user" size={20} color={isFocused.nom ? '#f7b733' : '#aaa'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#aaa"
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
                onFocus={() => handleFocus('nom')}
                onBlur={() => handleBlur('nom')}
                editable={!isLoading}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.prenom && styles.inputFocused,
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
              <AntDesign name="user" size={20} color={isFocused.prenom ? '#f7b733' : '#aaa'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#aaa"
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
                onFocus={() => handleFocus('prenom')}
                onBlur={() => handleBlur('prenom')}
                editable={!isLoading}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.dateNaissance && styles.inputFocused,
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
              <AntDesign name="calendar" size={20} color={isFocused.dateNaissance ? '#f7b733' : '#aaa'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Date de Naissance (AAAA-MM-JJ)"
                placeholderTextColor="#aaa"
                value={formData.dateNaissance}
                onChangeText={(text) => setFormData({ ...formData, dateNaissance: text })}
                keyboardType="numeric"
                onFocus={() => handleFocus('dateNaissance')}
                onBlur={() => handleBlur('dateNaissance')}
                editable={!isLoading}
              />
            </Animated.View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.genre}
                onValueChange={(itemValue) => setFormData({ ...formData, genre: itemValue })}
                style={styles.picker}
                enabled={!isLoading}>
                <Picker.Item label="Homme" value="homme" />
                <Picker.Item label="Femme" value="femme" />
                <Picker.Item label="Autre" value="autre" />
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(itemValue) => setFormData({ ...formData, role: itemValue })}
                style={styles.picker}
                enabled={!isLoading}>
                <Picker.Item label="Parent" value="parent" />
                <Picker.Item label="Enfant" value="enfant" />
                <Picker.Item label="Conjoint" value="conjoint" />
                <Picker.Item label="Autre" value="autre" />
              </Picker>
            </View>
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

export default UserOnboardingStep1;

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
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  picker: {
    color: '#fff',
    height: 50,
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
