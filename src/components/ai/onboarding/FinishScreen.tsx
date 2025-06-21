import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';

type FinishScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GeminiAI'>;

const COLORS = {
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  secondary: '#F2A03D',
};

const FONTS = {
  title: 20,
  description: 14,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
};

interface FinishScreenContentProps {
  navigation: FinishScreenNavigationProp;
}

const FinishScreenContent: React.FC<FinishScreenContentProps> = ({ navigation }) => {
  const fadeAnimIcon = useRef(new Animated.Value(0)).current;
  const fadeAnimTitle = useRef(new Animated.Value(0)).current;
  const fadeAnimDesc = useRef(new Animated.Value(0)).current;
  const scaleAnimButton = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnimIcon, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimTitle, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimDesc, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnimIcon, fadeAnimTitle, fadeAnimDesc]);

  const handlePressIn = () => {
    Animated.timing(scaleAnimButton, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnimButton, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { opacity: fadeAnimIcon }]}>
        <FontAwesome name="users" size={30} color={COLORS.secondary} />
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnimTitle }}>
        <Text style={styles.title}>
          Rejoignez Famil<Text style={styles.iaText}>IA</Text>
        </Text>
      </Animated.View>
      <Animated.Text style={[styles.description, { opacity: fadeAnimDesc }]}>
        Commencez à créer des moments savoureux avec votre famille.
      </Animated.Text>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.replace('GeminiAI')}
      >
        <Animated.View style={[styles.button, { transform: [{ scale: scaleAnimButton }] }]}>
          <LinearGradient
            colors={['#E95221', '#F2A03D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <FontAwesome name="play" size={16} color={COLORS.text} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Démarrer</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.s,
  },
  title: {
    fontSize: FONTS.title,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  iaText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  description: {
    fontSize: FONTS.description,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.s,
    lineHeight: 20,
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: SPACING.m,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: FONTS.description,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
});

export default FinishScreenContent;
