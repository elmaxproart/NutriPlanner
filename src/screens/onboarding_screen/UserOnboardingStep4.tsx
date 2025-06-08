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
import { ModalComponent } from '../../components/common/Modal';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboardingStep4'>;

const UserOnboardingStep4: React.FC<{ route: { params: { userId: string; familyId: string } } }> = ({ route }) => {
  const { userId, familyId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

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
      const storedData = await AsyncStorage.getItem('onboardingStep4');
      if (storedData) {
        setPhotoProfil(JSON.parse(storedData).photoProfil);
      }
    } catch (e: any) {
      setErrorMessage('Erreur lors du chargement des données.');
      setErrorModalVisible(true);
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 300,
        maxHeight: 300,
      });
      if (!result.didCancel && result.assets && result.assets[0].uri) {
        setPhotoProfil(result.assets[0].uri);
      }
    } catch (e: any) {
      setErrorMessage('Erreur lors de la sélection de l’image.');
      setErrorModalVisible(true);
    }
  };

  const saveAndProceed = async () => {
    if (!photoProfil) {
      setErrorMessage('Veuillez sélectionner une image de profil.');
      setErrorModalVisible(true);
      return;
    }
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('onboardingStep4', JSON.stringify({ photoProfil }));
      navigation.navigate('UserOnboardingStep5', { userId, familyId });
    } catch (e: any) {
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = () => {
    try {
      return require('../../assets/images/profile.jpg');
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
            Étape 4 : Image de profil
          </Animated.Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker} disabled={isLoading}>
            <Image
              source={photoProfil ? { uri: photoProfil } : getImageSource()}
              style={styles.profileImage}
            />
            <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.imagePickerOverlay}>
              <AntDesign name="camera" size={30} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
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
              onPress={saveAndProceed}
              style={styles.buttonInner}
              disabled={isLoading}
              onPressIn={handleFocusButton}
              onPressOut={handleBlurButton}>
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

export default UserOnboardingStep4;

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
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 30,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#f7b733',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
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
