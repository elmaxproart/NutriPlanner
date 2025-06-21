import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useColorScheme } from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { theme } from '../../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { mockLearnMoreItems } from '../../constants/mockData';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LearnMoreCarousel: React.FC = () => {
  const [bannerIndex, setBannerIndex] = useState(0);
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const imageOpacity = useSharedValue(1);
  const navigation = useNavigation<NavigationProp>();

  const changeBannerIndex = useCallback(() => {
    setBannerIndex((prev) => (prev + 1) % mockLearnMoreItems.length);
  }, []);


  const handleImageTransition = useCallback(() => {
    imageOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        // Utiliser runOnJS pour exécuter le changement d'état sur le JS thread
        runOnJS(changeBannerIndex)();
        imageOpacity.value = withTiming(1, { duration: 300 });
      }
    });
  }, [imageOpacity, changeBannerIndex]);

  useEffect(() => {
    // Animations d'entrée
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });

    // Rotation automatique des banners
    const interval = setInterval(() => {
      handleImageTransition();
    }, 5000);

    return () => clearInterval(interval);
  }, [opacity, scale, handleImageTransition]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleExplorePress = useCallback(() => {
    navigation.navigate('RecipeList');
  }, [navigation]);

  const currentItem = mockLearnMoreItems[bannerIndex];

  return (
    <Animated.View style={[commonStyles.sectionContainer, animatedStyle, styles.container]}>
      <View style={styles.banner}>
        <Animated.Image
          source={currentItem.image}
          style={[styles.bannerImage, imageAnimatedStyle]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={styles.bannerGradient}
        >
          <Text style={[commonStyles.sectionHeaderTitle, styles.bannerTitle]}>
            {currentItem.title}
          </Text>
          <Text style={[commonStyles.cardDescription, styles.bannerDescription]}>
            {currentItem.description}
          </Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={handleExplorePress}
            accessibilityLabel={`Explorer ${currentItem.title}`}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={isDarkMode ? ['#26A69A', '#4DB6AC'] : ['#2ECC71', '#27AE60']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerButtonGradient}
            >
              <Text style={[commonStyles.buttonText, styles.bannerButtonText]}>Explorer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Indicateurs de pagination */}
        <View style={styles.paginationContainer}>
          {mockLearnMoreItems.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === bannerIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  bannerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.xs,
    color: 'rgba(255, 255, 224, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  bannerDescription: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.md,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  bannerButtonGradient: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default LearnMoreCarousel;
