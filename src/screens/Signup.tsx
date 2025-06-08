import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUp } from '../hooks/SignUpFnAuth';
import { isValidEmail } from '../utils/helpers';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  style?: any;
  showCloseButton?: boolean;
  animationType?: 'fade' | 'slide' | 'none';
}

const ModalComponent = ({
  visible,
  onClose,
  title,
  children,
  style,
  showCloseButton = true,
  animationType = 'fade',
}: ModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) {return null;}

  return (
    <Modal transparent visible={visible} animationType={animationType} onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={[styles.contentModal, style]}>
          <Text style={styles.title}>{title}</Text>
          {children}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Fermer</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const Signup: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [isFocused, setIsFocused] = useState({ email: false, password: false, confirmPassword: false });
  const [imageSources, setImageSources] = useState({
    background: require('../assets/images/ai.jpg'),
    error: require('../assets/icons/error.png'),
    success: require('../assets/icons/success.png'),
  });
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadImages = async () => {
      try {
        const signupImage = require('../assets/images/taro-sauce-jaune.jpg');
        setImageSources(prev => ({ ...prev, background: signupImage }));
      } catch (e) {
        console.log('signup.jpg non trouvé, utilisation de ai.jpg comme fallback.');
      }
      try {
        const errorImage = require('../assets/icons/error.png');
        const successImage = require('../assets/icons/success.png');
        setImageSources(prev => ({ ...prev, error: errorImage, success: successImage }));
      } catch (e) {
        console.log('Erreur de chargement des icônes, vérifiez les chemins.');
        setImageSources(prev => ({
          ...prev,
          error: require('../assets/icons/success.png'),
          success: require('../assets/icons/error.png'),
        }));
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [titleOpacity]);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setErrorMessage('Tous les champs sont obligatoires.');
      setIsErrorModalVisible(true);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse email valide.');
      setIsErrorModalVisible(true);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
      setIsErrorModalVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      setIsErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      const  id  = 'moi'; //await signUp(email, password);
      await AsyncStorage.setItem('signupEmail', email);
      await AsyncStorage.setItem('signupPassword', password);
      setInfoMessage('Compte créé avec succès ! Complétez votre profil.');
      setIsInfoModalVisible(true);
      if(!isInfoModalVisible){
      setTimeout(() => {
        setIsInfoModalVisible(false);
        navigation.replace('UserOnboarding', { userId: id });
      }, 1500);
    }
    } catch (error: any) {
      setErrorMessage(error.message || 'Échec de l’inscription. Veuillez réessayer.');
      setIsErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

  const handleFocus = (field: 'email' | 'password' | 'confirmPassword') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field: 'email' | 'password' | 'confirmPassword') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
    Animated.timing(inputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image source={imageSources.background} style={styles.backgroundImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', '#0d0d0d']} style={styles.gradientOverlay} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <LinearGradient
            colors={['#fc4a1a', '#f7b733']}
            style={styles.gradientTitle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>Créer un compte</Animated.Text>
          </LinearGradient>
          <View style={styles.inputContainer}>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.email && styles.inputFocused,
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
              <AntDesign
                name="mail"
                size={20}
                color={isFocused.email ? '#f7b733' : '#aaa'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                editable={!isLoading}
                accessibilityLabel="Champ de saisie de l’email"
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.password && styles.inputFocused,
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
              <AntDesign
                name="lock"
                size={20}
                color={isFocused.password ? '#f7b733' : '#aaa'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                editable={!isLoading}
                accessibilityLabel="Champ de saisie du mot de passe"
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}
                accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                accessibilityRole="button">
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#aaa" />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={[
                styles.inputWrapper,
                isFocused.confirmPassword && styles.inputFocused,
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
              <AntDesign
                name="lock"
                size={20}
                color={isFocused.confirmPassword ? '#f7b733' : '#aaa'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#aaa"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
                editable={!isLoading}
                accessibilityLabel="Champ de confirmation du mot de passe"
              />
              <TouchableOpacity
                onPress={toggleConfirmPasswordVisibility}
                style={styles.eyeIcon}
                accessibilityLabel={
                  showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'
                }
                accessibilityRole="button">
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#aaa" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.buttonContainer, styles.signUpButton]}
              onPress={handleSignup}
              disabled={isLoading}
              accessibilityLabel="Bouton d’inscription"
              accessibilityRole="button">
              <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.loginButton}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>
                    <AntDesign name="adduser" size={18} color="#fff" style={styles.buttonIcon} /> S’inscrire
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonContainer, styles.googleButton]}
              onPress={() => {
                setInfoMessage('Connexion via Google en cours de développement.');
                setIsInfoModalVisible(true);
              }}
              accessibilityLabel="Connexion avec Google"
              accessibilityRole="button">
              <LinearGradient colors={['#4285F4', '#34A853']} style={styles.googleButtonGradient}>
                <AntDesign name="google" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => navigation.replace('Login', { errorMessage: '' })}
            accessibilityLabel="Lien vers la connexion"
            accessibilityRole="link">
            <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        showCloseButton={false}
        title="Erreur">
        <View style={styles.modalContent}>
          <Image
            source={imageSources.error}
            style={styles.modalImage}
            accessibilityLabel="Icône d’erreur"
          />
          <Text style={styles.modalMessageText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => setIsErrorModalVisible(false)}
            style={styles.modalButton}
            accessibilityLabel="Fermer la modale d’erreur"
            accessibilityRole="button">
            <Text style={styles.modalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>
      <ModalComponent
        visible={isInfoModalVisible}
        showCloseButton={false}
        onClose={() => setIsInfoModalVisible(false)}
        title="Information">
        <View style={styles.modalContent}>
          <Image
            source={imageSources.success}
            style={styles.modalImage}
            accessibilityLabel="Icône de succès"
          />
          <Text style={styles.modalMessageText}>{infoMessage}</Text>
          <TouchableOpacity
            onPress={() => setIsInfoModalVisible(false)}
            style={styles.modalButton}
            accessibilityLabel="Fermer la modale d’info"
            accessibilityRole="button">
            <Text style={styles.modalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    height: '40%',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height * 0.6 + 30,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 25,
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    alignItems: 'center',
    paddingTop: 30,
  },
  gradientTitle: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
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
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  signUpButton: {
    flex: 1,
    marginRight: 10,
  },
  googleButton: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 5,
  },
  linkText: {
    color: '#f7b733',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  modalContent: {
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 10,
  },
  modalMessageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#f7b733',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentModal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButton: {
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
