import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';


import FeaturesScreenContent from './FeaturesScreen';
import FinishScreenContent from './FinishScreen';
import SetupScreenContent from './SetupScreen';
import WelcomeScreenContent from './WelcomeScreen';
import { RootStackParamList } from '../../../App';



type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeAI'>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

const OnboardingScreenIA: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);


  const onboardingData = [
    {
      title: <WelcomeScreenContent />,
      description: 'Découvrez une IA qui révolutionne la planification de vos repas.',
      image: require('../../../assets/images/ai.jpg'),
    },
    {
      title: <FeaturesScreenContent />,
      description: 'Explorez des suggestions de menus et de listes de courses personnalisées.',
      image: require('../../../assets/images/taro-sauce-jaune.jpg'),
    },
    {
      title: <SetupScreenContent />,
      description: 'Adaptez NutriBuddy à vos besoins sans effort.',
      image: require('../../../assets/images/resete.jpg'),
    },
    {

      title: <FinishScreenContent navigation={navigation as any} />,

      description: 'Commencez votre voyage culinaire avec NutriBuddy AI dès maintenant.',
      image: require('../../../assets/images/pizza.jpg'),
    },
  ];

  React.useEffect(() => {

    opacity.value = 0;
    translateY.value = 20;

    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleNext = () => {
    if (index < onboardingData.length - 1) {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(20, { duration: 300 }, () => {
        setIndex(oldIndex => oldIndex + 1); // Update index after animation completes
      });
    } else {
      navigation.replace('GeminiAI');
    }
  };

  const handleBack = () => {
    if (index > 0) {
      // Trigger fade-out animation before changing index
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(20, { duration: 300 }, () => {
        setIndex(oldIndex => oldIndex - 1); // Update index after animation completes
      });
    }
  };

  const handleSkip = () => navigation.replace('GeminiAI');

  const { title, description, image } = onboardingData[index];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.gradientOverlay}
        />
      </View>
      <View style={styles.content}>
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.smokeOverlay}
        />
        <Animated.View style={[styles.textContainer, animatedStyle]}>
          {title}
          <Text style={styles.description}>{description}</Text>
        </Animated.View>
        <View style={styles.navButtons}>
          {index > 0 && (
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.buttonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.buttonText}>
              {index === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.buttonText}>Passer</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {onboardingData.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                index === i && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1.5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
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
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#f7b733',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555',
  },
  activeDot: {
    backgroundColor: '#f7b733',
    width: 12,
    height: 12,
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default OnboardingScreenIA;
