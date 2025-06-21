import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';

import WelcomeScreenContent from './WelcomeScreen';
import FeaturesScreenContent from './FeaturesScreen';
import SetupScreenContent from './SetupScreen';
import FinishScreenContent from './FinishScreen';
import { ScaledSize } from 'react-native';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeAI'>;
type FinishScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GeminiAI'>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

// Configuration
const COLORS = {
  primary: '#E95221',
  secondary: '#F2A03D',
  backgroundDark: '#0D0D0D',
  backgroundLight: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  cardBg: '#2C2C2C',
  shadow: '#000',
  buttonText: '#FFFFFF',
  iconBarBg: 'rgba(40, 40, 40, 0.8)',
};

const FONTS = {
  title: 20,
  description: 14,
  button: 14,
  modalTitle: 18,
  modalText: 13,
  iconLabel: 12,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

const { width, height } = Dimensions.get('window');

const OnboardingScreenIA: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState({ privacy: false, info: false, contact: false });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  const onboardingData = [
    {
      title: <WelcomeScreenContent />,
      description: 'Une IA intuitive pour des repas familiaux mémorables.',
      video: require('../../../assets/videos/hamburgeur.mp4'),
      fallbackImage: require('../../../assets/images/ai.jpg'),
    },
    {
      title: <FeaturesScreenContent />,
      description: 'Suggestions intelligentes pour ravir toute la famille.',
      video: require('../../../assets/videos/hamburgeur.mp4'),
      fallbackImage: require('../../../assets/images/taro-sauce-jaune.jpg'),
    },
    {
      title: <SetupScreenContent />,
      description: 'Personnalisez FamilIA en quelques clics simples.',
      video: require('../../../assets/videos/hamburgeur.mp4'),
      fallbackImage: require('../../../assets/images/resete.jpg'),
    },
    {
      title: <FinishScreenContent navigation={navigation as unknown as FinishScreenNavigationProp} />,
      description: 'Rejoignez la famille FamilIA et savourez chaque moment.',
      video: require('../../../assets/videos/hamburgeur.mp4'),
      fallbackImage: require('../../../assets/images/pizza.jpg'),
    },
  ];

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setWindowDimensions(window);
    };
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription.remove();
  }, []);

  // Animation on index change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const handleNext = () => {
    if (index < onboardingData.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex(index + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
      });
    } else {
      navigation.replace('GeminiAI');
    }
  };

  const handleBack = () => {
    if (index > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex(index - 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
      });
    }
  };

  const handleSkip = () => {
    navigation.replace('GeminiAI');
  };

  const openModal = (type: 'privacy' | 'info' | 'contact') => {
    setModalVisible({ ...modalVisible, [type]: true });
  };

  const closeModal = (type: 'privacy' | 'info' | 'contact') => {
    setModalVisible({ ...modalVisible, [type]: false });
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const { title, description, video, fallbackImage } = onboardingData[index];

  const renderFamilIA = () => (
    <Text style={styles.title}>
      Famil<Text style={styles.iaText}>IA</Text>
    </Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.backgroundDark} barStyle="light-content" />
      <View style={styles.mediaContainer}>
        <Video
          source={video}
          style={styles.video}
          resizeMode="cover"
          repeat={true}
          muted={true}
          onError={() => console.log('Video failed to load, using fallback image')}
          poster={fallbackImage}
          posterResizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', COLORS.backgroundDark]}
          style={styles.gradientOverlay}
        />
        <TouchableOpacity style={styles.videoSkipButton} onPress={handleSkip}>
          <Text style={styles.videoSkipText}>Passer</Text>
          <FontAwesome name="angle-double-right" size={16} color={COLORS.buttonText} style={styles.videoSkipIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.iconBar}>
        <TouchableOpacity style={styles.iconItem} onPress={() => openModal('privacy')}>
          <FontAwesome name="lock" size={18} color={COLORS.secondary} />
          <Text style={styles.iconLabel}>Confidentialité</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconItem} onPress={() => openModal('info')}>
          <FontAwesome name="info-circle" size={18} color={COLORS.secondary} />
          <Text style={styles.iconLabel}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconItem} onPress={() => openModal('contact')}>
          <FontAwesome name="envelope" size={18} color={COLORS.secondary} />
          <Text style={styles.iconLabel}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconItem} onPress={handleSkip}>
          <FontAwesome name="forward" size={18} color={COLORS.secondary} />
          <Text style={styles.iconLabel}>Passer</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={isLandscape}
        >
          <Animated.View style={[styles.card, animatedStyle, isLandscape && styles.cardLandscape]}>
            {title}
            <Text style={styles.description}>{description}</Text>
          </Animated.View>
          <View style={styles.progressContainer}>
            {onboardingData.map((_, i) => (
              <View
                key={i}
                style={[styles.progressDot, index === i && styles.activeDot]}
              />
            ))}
          </View>
        </ScrollView>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.navButton, index === 0 && styles.disabledButton]}
            disabled={index === 0}
          >
            <FontAwesome name="arrow-left" size={16} color={COLORS.text} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Précédent</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.nextButtonOuter}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.buttonText}>
                {index === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
              </Text>
              <FontAwesome
                name={index === onboardingData.length - 1 ? 'check' : 'arrow-right'}
                size={16}
                color={COLORS.buttonText}
                style={styles.buttonIcon}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <Modal
        visible={modalVisible.privacy}
        animationType="fade"
        transparent={true}
        onRequestClose={() => closeModal('privacy')}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrapper}>
                <FontAwesome name="lock" size={20} color={COLORS.secondary} style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Votre Confidentialité</Text>
              </View>
              <TouchableOpacity onPress={() => closeModal('privacy')}>
                <FontAwesome name="times" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalText}>
                <FontAwesome name="check-circle" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Protection des données :</Text> Vos informations sont sécurisées et conformes au RGPD.{'\n\n'}
                <FontAwesome name="check-circle" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Usage responsable :</Text> Nous utilisons vos données pour personnaliser votre expérience avec {renderFamilIA()}.{' '}
                <FontAwesome name="check-circle" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Pas de partage :</Text> Aucune donnée n’est transmise à des tiers sans votre accord.{'\n\n'}
                Visitez : <Text style={styles.modalLink}>www.familia.ai/privacy</Text>.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible.info}
        animationType="fade"
        transparent={true}
        onRequestClose={() => closeModal('info')}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrapper}>
                <FontAwesome name="info-circle" size={20} color={COLORS.secondary} style={styles.modalIcon} />
                <Text style={styles.modalTitle}>À Propos</Text>
              </View>
              <TouchableOpacity onPress={() => closeModal('info')}>
                <FontAwesome name="times" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalText}>
                <FontAwesome name="rocket" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>{renderFamilIA()} :</Text> Créé par xAI pour des repas familiaux simplifiés.{'\n\n'}
                <FontAwesome name="rocket" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Version :</Text> 1.0.0, iOS et Android.{'\n\n'}
                <FontAwesome name="rocket" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Mission :</Text> Rassembler les familles autour de repas savoureux.{'\n\n'}
                Plus sur <Text style={styles.modalLink}>www.familia.ai</Text>.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible.contact}
        animationType="fade"
        transparent={true}
        onRequestClose={() => closeModal('contact')}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrapper}>
                <FontAwesome name="envelope" size={20} color={COLORS.secondary} style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Contactez-Nous</Text>
              </View>
              <TouchableOpacity onPress={() => closeModal('contact')}>
                <FontAwesome name="times" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalText}>
                <FontAwesome name="phone" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Téléphone :</Text> +1-800-FAMILIA (Lun-Ven, 9h-17h UTC){'\n\n'}
                <FontAwesome name="envelope-o" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Email :</Text> <Text style={styles.modalLink}>support@familia.ai</Text>{'\n\n'}
                <FontAwesome name="globe" size={14} color={COLORS.secondary} />{' '}
                <Text style={styles.modalBold}>Site :</Text> <Text style={styles.modalLink}>www.familia.ai/contact</Text>{'\n\n'}
                Nous sommes là pour votre famille !
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  mediaContainer: {
    flex: 0.8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  videoSkipButton: {
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
    borderRadius: 15,
  },
  videoSkipText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button - 2,
    fontWeight: '600',
  },
  videoSkipIcon: {
    marginLeft: SPACING.xs,
  },
  iconBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.iconBarBg,
    paddingVertical: SPACING.s,
    marginTop: -20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.s,
  },
  iconLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.iconLabel,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.xl * 2,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.m,
    marginVertical: SPACING.m,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  cardLandscape: {
    marginHorizontal: width * 0.1,
  },
  description: {
    fontSize: FONTS.description,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.m,
    gap: SPACING.s,
    zIndex: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#777',
  },
  activeDot: {
    backgroundColor: COLORS.secondary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonOuter: {
    flex: 1,
    marginLeft: SPACING.m,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
  buttonIcon: {
    marginHorizontal: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    width: '85%',
    maxHeight: height * 0.75,
    padding: SPACING.m,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FONTS.modalTitle,
    color: COLORS.text,
    fontWeight: '700',
    marginLeft: SPACING.s,
  },
  modalIcon: {
    marginRight: SPACING.xs,
  },
  modalScroll: {
    paddingBottom: SPACING.m,
  },
  modalText: {
    fontSize: FONTS.modalText,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  modalBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  modalLink: {
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
  title: {
    fontSize: FONTS.title,
    color: COLORS.text,
    fontWeight: '700',
  },
  iaText: {
    color: COLORS.secondary,
  },
});

export default OnboardingScreenIA;
