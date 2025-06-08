import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScaledSize,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ModalComponent from '../../components/common/ModalComponent';
import { useNavigation } from '@react-navigation/native';
import { login } from '../../hooks/SignUpFnAuth';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserOnboarding'>;

const UserOnboardingScreen: React.FC<{ route: { params: { userId: string } } }> = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation<NavigationProp>();

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isLandscape = dimensions.width > dimensions.height;
  const isSmallScreen = dimensions.width < 380;

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselImages = [
    require('../../assets/images/ai.jpg'),
    require('../../assets/images/eru.jpg'),
    require('../../assets/images/hamburgeur.jpg'),
    require('../../assets/images/koki.jpg'),
    require('../../assets/images/pizza.jpg'),
  ];

  // Animation refs
  const contentSlideAnim = useRef(new Animated.Value(50)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  // Carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Responsive dimensions
  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => setDimensions(window);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  // Slide animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentFadeAnim, contentSlideAnim]);

  const handleCreateFamily = () =>
    navigation.navigate('UserOnboardingStep1', { userId, familyId: 'family1' });

  const handleSkipFamily = async () => {
    const email = await AsyncStorage.getItem('signupEmail');
    const password = await AsyncStorage.getItem('signupPassword');
    if (email && password) {
      try {
        const loggedInUserId = await login(email, password);
        if (loggedInUserId) {
          await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          navigation.replace('Home');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Échec de la connexion automatique. Veuillez vous connecter manuellement.');
        setErrorModalVisible(true);
      }
    } else {
      navigation.replace('Login', { errorMessage: '' });
    }
  };

  const getButtonSize = () => {
    if (isLandscape) {return { width: Dimensions.get('window').width * 0.4, height: 50 };}
    if (isSmallScreen) {return { width: Dimensions.get('window').width * 0.4, height: 45 };}
    return { width: Dimensions.get('window').width * 0.48, height: 55 };
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        <Image
          source={carouselImages[currentImageIndex]}
          style={styles.carouselImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(13, 13, 13, 0.9)']}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Content Section */}
      <Animated.View style={[
        styles.contentSection,
        { transform: [{ translateY: contentSlideAnim }], opacity: contentFadeAnim },
      ]}>
        <LinearGradient
  colors={['#fc4a1a', '#f7b733']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.welcomeTitleGradient}>
  <View style={styles.titleContainer}>
    <AntDesign name="smileo" size={22} color="#FFF" style={styles.titleIcon} />
    <Text style={styles.welcomeTitle}>Bienvenue</Text>
  </View>
</LinearGradient>

        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          <Text style={styles.boldText}>Créer une famille pour gérer vos repas ensemble ?</Text>
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleCreateFamily}
            style={[styles.button, styles.primaryButton, getButtonSize()]}>
            <AntDesign name="team" size={24} color="#fff" />
            <Text style={styles.buttonText}>Oui</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkipFamily}
            style={[styles.button, styles.secondaryButton, getButtonSize()]}>
            <AntDesign name="clockcircleo" size={22} color="#FFf" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ModalComponent
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="Erreur">
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </View>
  );
};

export default UserOnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  contentSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  welcomeTitleGradient: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginBottom: 20,
    alignSelf: 'center',
  },
  titleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
titleIcon: {
  marginRight: 10,
},
welcomeTitle: {
  color: '#fff',
  fontSize: 28,
  fontWeight: 'bold',
  fontFamily: 'Roboto',
  fontStyle: 'italic',
  textShadowColor: 'rgba(0, 0, 0, 0.6)',
  textShadowOffset: { width: -1, height: 1 },
  textShadowRadius: 8,
},

  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 15,
    lineHeight: 24,
  },
  subtitleSmall: {
    fontSize: 14,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#Fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#fc4a1a',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fc4a1a',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FFf',
  },
  modalMessageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
  },
});
