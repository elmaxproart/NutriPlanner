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
import ModalComponent from '../../components/common/ModalComponent';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

// Configuration
const COLORS = {
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
        const parsedData = JSON.parse(storedData);
        setPhotoProfil(parsedData.photoProfil || null);
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
        const imageUri = result.assets[0].uri;
        setPhotoProfil(imageUri);
      } else if (result.didCancel) {
        setErrorMessage('Sélection d’image annulée.');
        setErrorModalVisible(true);
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
      const imageData = {
        photoProfil,
        width: 300,
        height: 300,
        fileName: photoProfil.split('/').pop() || 'profile_image.jpg',
        fileSize: 0,
        mimeType: 'image/jpeg',
      };
      await AsyncStorage.setItem('onboardingStep4', JSON.stringify(imageData));
      navigation.navigate('UserOnboardingStep5', { userId, familyId });
    } catch (e: any) {
      setErrorMessage('Erreur lors de la sauvegarde des données.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultImageSource = () => {
    try {
      return require('../../assets/images/ai.jpg');
    } catch {
      return null;
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
      <LinearGradient
        colors={[COLORS.backgroundDark, '#282828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: SPACING.l, paddingTop: SPACING.xl, paddingBottom: SPACING.m },
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
              <Text style={styles.titleText}>Image de profil</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.formContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker} disabled={isLoading}>
            <Image
              source={photoProfil ? { uri: photoProfil } : getDefaultImageSource()}
              style={styles.profileImage}
              resizeMode="cover"
            />
            {!photoProfil && (
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.imagePickerOverlay}>
                <AntDesign name="camera" size={30} color={COLORS.buttonText} />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.navigationButtons, { marginBottom: SPACING.xl }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.prevButton}>
            <AntDesign name="arrowleft" size={24} color={COLORS.text} />
            <Text style={styles.prevButtonText}>Retour</Text>
          </TouchableOpacity>

            <TouchableOpacity
              onPress={saveAndProceed}
              style={styles.nextButtonOuter}
              disabled={isLoading}
              onPressIn={handleFocusButton}
              onPressOut={handleBlurButton}
            >
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
                    <Text style={styles.nextButtonText}>Suivant</Text>
                    <AntDesign name="arrowright" size={20} color={COLORS.buttonText} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

        </View>
      </ScrollView>

      <ModalComponent style={styles.center} visible={errorModalVisible} onClose={() => setErrorModalVisible(false)} title="Information">
        <Image
          source={require('../../assets/icons/info.png')}
          style={styles.modalImage}
          accessibilityLabel="Icône d’erreur"
        />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </ModalComponent>
    </View>
  );
};

export default UserOnboardingStep4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContainer: {
    flexGrow: 1,
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
    alignItems: 'center',
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: SPACING.l,
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.inputFocus,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
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
  buttonIcon: {
    marginRight: 0,
  },
  center: {
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
    fontSize: 16,
    textAlign: 'center',
    marginVertical: SPACING.m,
  },
});
