import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../hooks/SignUpFnAuth';
import { ModalComponent } from '../components/common/Modal';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true); // New state for video loading
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, [titleOpacity]);

  const handleFocus = (field: 'email' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field: 'email' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
    Animated.timing(inputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs.');
      setIsErrorModalVisible(true);
      return;
    }
    setIsLoading(true);
    Animated.timing(loadingOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    try {
      const userId = await login(email, password);
      if (userId) {
        const hasAccessedAI = await AsyncStorage.getItem('hasAccessedAI');
        const hasSkippedOnboarding = await AsyncStorage.getItem('hasSkippedOnboarding');
        if (!hasAccessedAI || !hasSkippedOnboarding) {
          navigation.replace('WelcomeAI', { userId });
        } else {
          navigation.replace('Home',{ userId });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la connexion. Veuillez réessayer.');
      setIsErrorModalVisible(true);
    } finally {
      setIsLoading(false);
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };


  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.videoContainer}>
        {isVideoLoading && (
          <Image
            source={require('../assets/images/menu.jpg')}
            style={styles.video}
            resizeMode="cover"
            accessibilityLabel="Image de chargement"
          />
        )}
        <Video
          source={require('../assets/videos/hamburgeur.mp4')}
          style={[styles.video, isVideoLoading && styles.hiddenVideo]}
          repeat
          resizeMode="cover"
          muted
          controls={false}
          paused={false}
          ignoreSilentSwitch="obey"
          onLoad={handleVideoLoad}
        />
        <LinearGradient colors={['transparent', '#0d0d0d']} style={styles.gradientOverlay} />
      </View>
      <View style={styles.content}>
        <LinearGradient colors={['transparent', '#0d0d0d']} style={styles.smokeOverlay} />
        <LinearGradient
          colors={['#fc4a1a', '#f7b733']}
          style={styles.gradientTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>Bienvenue</Animated.Text>
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
              placeholder="Email"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              autoCapitalize="none"
              keyboardType="email-address"
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
              placeholder="Mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#f7b733"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Animated.Text style={[styles.loadingText, { opacity: loadingOpacity }]}>
              Connexion en cours...
            </Animated.Text>
          </View>
        )}
        <TouchableOpacity onPress={handleLogin} style={styles.buttonContainer}>
          <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.loginButton}>
            <Text style={styles.loginText}>
              <AntDesign name="login" size={18} color="#fff" /> Connexion
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Pas de compte ? Inscrivez-vous</Text>
        </TouchableOpacity>
      </View>
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        showCloseButton={false}
        title="Erreur">
        <View style={styles.modalContent}>
          <Image
            source={require('../assets/icons/error.png')}
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
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: '#FF6B00',
    fontSize: 18,
    marginTop: 10,
  },
  videoContainer: {
    flex: 1.3,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  hiddenVideo: {
    opacity: 0, // Hide video while loading
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    position: 'relative',
  },
  smokeOverlay: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  gradientTitle: {
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
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
  buttonContainer: {
    width: '100%',
    marginBottom: 15,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: '#f7b733',
    fontSize: 14,
    textDecorationLine: 'underline',
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
});
