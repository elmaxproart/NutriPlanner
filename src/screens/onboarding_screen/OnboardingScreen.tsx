import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Planification familiale',
    description: 'Créez un compte, ajoutez votre famille, et commencez à planifier les repas.',
    image: require('../../assets/images/hamburgeur.jpg'),
  },
  {
    title: 'Liste intelligente de plats',
    description: 'Sélectionnez vos plats préférés avec des recettes adaptées à toute la famille.',
    image: require('../../assets/images/Le-met-de-pistache1.jpg'),
  },
  {
    title: 'Budget automatique',
    description: 'Calculez automatiquement les coûts des repas et suivez vos dépenses.',
    image: require('../../assets/images/eru.jpg'),
  },
  {
    title: 'Planification hebdomadaire',
    description: 'Organisez facilement vos repas sur toute la semaine.',
    image: require('../../assets/images/pile-haricot.jpg'),
  },
    {
    title: 'Ai intelligent',
    description: 'Utilisez l\'intelligence artificielle pour des suggestions de repas personnalisées.',
    image: require('../../assets/images/ia.jpg'),
  },
  {
    title: 'Personnalisation des menus',
    description: 'Cree et Personaliser vos menus .',
    image: require('../../assets/images/taro-sauce-jaune.jpg'),
  },
];

const Onboarding: React.FC<{ navigation: any }> = ({ navigation }) => {

  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < onboardingData.length - 1) {
      setIndex(index + 1);
    } else {
      navigation.replace('Welcome');
    }
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleSkip = () => navigation.replace('Welcome');

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

  <Text style={styles.title}>{title}</Text>
  <Text style={styles.description}>{description}</Text>

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
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 1,
    },
    skipButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
});

export default Onboarding;
