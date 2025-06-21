import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import FamilySection from '../components/ai/FamilySection';
import LearnMoreCarousel from '../components/ai/LearnMoreCarousel';
import MainActionButton from '../components/ai/MainActionButton';
import SideMenu from '../components/ai/SideMenu';
import AITemplateCarousel from '../components/ai/AITemplateCarousel';
import { SuggestionCard } from '../components/ai/SuggestionCard';
import TemplatePreviewSection from '../components/ai/TemplatePreviewSection';
import { ModalComponent } from '../components/common/ModalComponent';
import ToastNotification from '../components/common/ToastNotification';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../App';
import { logger } from '../utils/logger';
import { generateUniqueId } from '../utils/helpers';
import { AiInteraction } from '../constants/entities';
import { PromptType } from '../services/prompts';
import { AudioContent, TextContent } from '../types/messageTypes';
import { useAIConversation } from '../hooks/useAIConversation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GeminiScreen: React.FC = () => {
  const { t } = useTranslation();
  const { use } = useAuth();
  const { familyMembers, loading: familyLoading } = useFamilyData();
  const navigation = useNavigation<NavigationProp>();
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const {
    generatePersonalizedRecipe,
    generateWeeklyMenu,
    generateQuickRecipe,
  } = useAIConversation();

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const loadingRotate = useSharedValue(0);
  const recordingAnimationRef = useRef<LottieView>(null);

  // Move all Hooks to top level
  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setToast({
          visible: true,
          message: t('errors.audioPermission'),
          type: 'error',
        });
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      Vibration.vibrate(100);
      recordingAnimationRef.current?.play();
    } catch (err: unknown) {
      logger.error('Start recording error', { error: (err as Error).message });
      setToast({
        visible: true,
        message: t('errors.recordingStart'),
        type: 'error',
      });
    }
  }, [t]);

  const stopRecording = useCallback(async () => {
    if (!recording) {return;}
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      setToast({
        visible: true,
        message: t('recording.saved'),
        type: 'success',
      });
      recordingAnimationRef.current?.pause();

      if (uri) {
        const audioContent: AudioContent = { type: 'audio', uri, mimeType: 'audio/m4a' };
        const interaction: AiInteraction = {
          id: generateUniqueId(),
          content: audioContent,
          isUser: true,
          timestamp: new Date().toISOString(),
          type: 'audio' as const,
          dateCreation: new Date().toISOString(),
          dateMiseAJour: new Date().toISOString(),
          conversationId: generateUniqueId(),
        };
        navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType: undefined });
      }
    } catch (err: unknown) {
      logger.error('Stop recording error', { error: (err as Error).message });
      setToast({
        visible: true,
        message: t('errors.recordingStop'),
        type: 'error',
      });
    }
  }, [recording, navigation, t]);

  const handleMainActionPress = useCallback(() => {
    try {
      const textContent: TextContent = { type: 'text', message: 'Démarrer une nouvelle conversation' };
      const interaction: AiInteraction = {
        id: generateUniqueId(),
        content: textContent,
        isUser: true,
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        dateCreation: new Date().toISOString(),
        dateMiseAJour: new Date().toISOString(),
        conversationId: generateUniqueId(),
      };
      navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType: undefined });
    } catch (err: unknown) {
      logger.error('Main action press error', { error: (err as Error).message });
      setToast({
        visible: true,
        message: t('errors.navigation'),
        type: 'error',
      });
    }
  }, [navigation, t]);

  const handleMainActionLongPress = useCallback(() => {
    Vibration.vibrate([0, 100, 50, 100]);
    setIsVoiceModalVisible(true);
    startRecording();
  }, [startRecording]);

  const handleOpenMenu = useCallback(() => {
    setIsSideMenuVisible(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsSideMenuVisible(false);
  }, []);

  const handleDismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const suggestionBubbles = useMemo(() => {
    const family = familyMembers.length > 0 ? familyMembers : [];
    const member = family[0] || { prenom: 'Utilisateur' };
    return [
      {
        id: PromptType.WEEKLY_MENU,
        text: t('suggestions.menu'),
        icon: 'calendar-week',
        iconType: 'MaterialCommunityIcons',
        onPress: () => {
          generateWeeklyMenu(family, new Date().toISOString().split('T')[0]).then(result =>
            navigation.navigate('GeminiChat', { messageId: result.id })
          );
        },
      },
      {
        id: PromptType.RECIPE_PERSONALIZED,
        text: t('suggestions.recipeFor', { name: member.prenom }),
        icon: 'account-heart',
        iconType: 'MaterialCommunityIcons',
        onPress: () => {
          generatePersonalizedRecipe(member).then(result =>
            navigation.navigate('GeminiChat', { messageId: result.id })
          );
        },
      },
      {
        id: PromptType.QUICK_RECIPE,
        text: t('suggestions.quickRecipe'),
        icon: 'clock-fast',
        iconType: 'MaterialCommunityIcons',
        onPress: () => {
          generateQuickRecipe(member).then(result =>
            navigation.navigate('GeminiChat', { messageId: result.id })
          );
        },
      },
      {
        id: PromptType.SHOPPING_LIST,
        text: t('suggestions.shoppingList'),
        icon: 'cart-outline',
        iconType: 'MaterialCommunityIcons',
        onPress: () => navigation.navigate('GeminiChat', { messageId: 'Créer une liste de courses' , promptType: PromptType.SHOPPING_LIST }),
      },
    ];
  }, [t, navigation, familyMembers, generateWeeklyMenu, generatePersonalizedRecipe, generateQuickRecipe]);

  const suggestionItems = useMemo(
    () => [
      {
        title: t('suggestions.recipe'),
        description: t('suggestions.recipeDesc'),
        imageUri: 'jollof.jpg',
        onPress: () =>
          navigation.navigate('GeminiChat', {
            initialInteraction: {
              id: generateUniqueId(),
              content: { type: 'text', message: 'Suggère une recette africaine' } as TextContent,
              isUser: true,
              timestamp: new Date().toISOString(),
              type: 'text' as const,
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId: generateUniqueId(),
            },
            promptType: PromptType.RECIPE_PERSONALIZED,
          }),
        onSendToAI: (message: string) =>
          navigation.navigate('GeminiChat', {
            initialInteraction: {
              id: generateUniqueId(),
              content: { type: 'text', message } as TextContent,
              isUser: true,
              timestamp: new Date().toISOString(),
              type: 'text' as const,
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId: generateUniqueId(),
            },
            promptType: undefined,
          }),
      },
      {
        title: t('suggestions.menu'),
        description: t('suggestions.menuDesc'),
        imageUri: 'thieb.jpg',
        onPress: () =>
          navigation.navigate('GeminiChat', {
            initialInteraction: {
              id: generateUniqueId(),
              content: { type: 'text', message: 'Propose un menu hebdomadaire' } as TextContent,
              isUser: true,
              timestamp: new Date().toISOString(),
              type: 'text' as const,
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId: generateUniqueId(),
            },
            promptType: PromptType.WEEKLY_MENU,
          }),
        onSendToAI: (message: string) =>
          navigation.navigate('GeminiChat', {
            initialInteraction: {
              id: generateUniqueId(),
              content: { type: 'text', message } as TextContent,
              isUser: true,
              timestamp: new Date().toISOString(),
              type: 'text' as const,
              dateCreation: new Date().toISOString(),
              dateMiseAJour: new Date().toISOString(),
              conversationId: generateUniqueId(),
            },
            promptType: undefined,
          }),
      },
    ],
    [t, navigation]
  );

  useEffect(() => {
    if (!familyLoading) {
      opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    }
  }, [opacity, translateY, familyLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (familyLoading) {
      loadingRotate.value = withTiming(360, { duration: 1000, easing: Easing.linear });
      interval = setInterval(() => {
        loadingRotate.value = 0;
        loadingRotate.value = withTiming(360, { duration: 1000, easing: Easing.linear });
      }, 1000);
    }
    return () => {
      clearInterval(interval!);
      if (recording) {
        recording.stopAndUnloadAsync().catch((err: unknown) => logger.error('Recording cleanup error', { error: (err as Error).message }));
      }
    };
  }, [loadingRotate, familyLoading, recording]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const animatedLoadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotate.value}deg` }],
  }));

  if (familyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={require('../assets/images/resete.jpg')} style={styles.loadingBackground} />
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingIcon, animatedLoadingStyle]}>
            <Image
              source={require('../assets/images/gemini-star.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.loadingText}>{t('loading.message')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isSearchBarVisible && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setIsSearchBarVisible(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#E0E0E0" />
          </TouchableOpacity>
        </View>
      )}
      <LinearGradient colors={['#121212', '#1E1E1E']} style={styles.header}>
        <View style={styles.leftHeaderIcons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('NetworkStatus')}
          >
            <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.headerButtonGradient}>
              <MaterialCommunityIcons name="bell-outline" size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsSearchBarVisible(true)}
          >
            <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.headerButtonGradient}>
              <MaterialCommunityIcons name="magnify" size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleOpenMenu}
        >
          <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.headerButtonGradient}>
            <MaterialCommunityIcons name="menu" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
          <Text style={styles.headerTitle}>
            {t('welcome', { name: use?.displayName || use?.email?.split('@')[0] || 'Utilisateur' })}
          </Text>
          <LearnMoreCarousel />
          <FamilySection />
          <AITemplateCarousel />
          <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.carouselContainer}
>
  {suggestionBubbles.map((bubble, index) => (
    <SuggestionCard
      key={index}
      title={bubble.text}
      description={t(`suggestions.${bubble.id.toLowerCase()}Desc`)}
      imageUri={bubble.id === PromptType.RECIPE_PERSONALIZED ? 'jollof.jpg' : 'thieb.jpg'}
      onPress={bubble.onPress}
      onSendToAI={(message) =>
        navigation.navigate('GeminiChat', {
          initialInteraction: {
            id: generateUniqueId(),
            content: { type: 'text', message } as TextContent,
            isUser: true,
            timestamp: new Date().toISOString(),
            type: 'text' as const,
            dateCreation: new Date().toISOString(),
            dateMiseAJour: new Date().toISOString(),
            conversationId: generateUniqueId(),
          },
          promptType: undefined,
        })
      }
    />
  ))}
</ScrollView>


          <TemplatePreviewSection />
          <View style={styles.suggestionSection}>
            <Text style={styles.sectionTitle}>{t('suggestions.title')}</Text>
            {suggestionItems.map((item, index) => (
              <SuggestionCard
                key={index}
                title={item.title}
                description={item.description}
                imageUri={item.imageUri}
                onPress={item.onPress}
                onSendToAI={item.onSendToAI}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      <LinearGradient colors={['#121212', '#1E1E1E']} style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.navButtonGradient}>
            <MaterialCommunityIcons name="home-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.navText}>{t('nav.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Menu')}
        >
          <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.navButtonGradient}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.navText}>{t('nav.menus')}</Text>
        </TouchableOpacity>
        <MainActionButton
          onPressAction={handleMainActionPress}
          onLongPressAction={handleMainActionLongPress}
        />
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('RecipeList')}
        >
          <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.navButtonGradient}>
            <MaterialCommunityIcons name="cart-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.navText}>{t('nav.shopping')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <LinearGradient colors={['#26A69A', '#4DB6AC']} style={styles.navButtonGradient}>
            <MaterialCommunityIcons name="account-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.navText}>{t('nav.profile')}</Text>
        </TouchableOpacity>
      </LinearGradient>
      <SideMenu isVisible={isSideMenuVisible} onClose={handleCloseMenu} />
      <ModalComponent
        visible={isVoiceModalVisible}
        showCloseButton={false}
        onClose={() => {
          setIsVoiceModalVisible(false);
          if (isRecording) {
            stopRecording();
          }
        }}
        title={isRecording ? t('recording.active') : t('recording.ready')}
        animationType="fade"
      >
        <View style={styles.modalContent}>
          <LottieView
            ref={recordingAnimationRef}
            source={require('../assets/animations/gemini.json')}
            style={styles.recordingAnimation}
            loop
            autoPlay={true}
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={isRecording ? stopRecording : startRecording}
            accessibilityLabel={isRecording ? t('recording.stop') : t('recording.start')}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalButtonGradient}
            >
              <MaterialCommunityIcons
                name={isRecording ? 'stop' : 'microphone'}
                size={24}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.modalButtonText}>
                {isRecording ? t('recording.stop') : t('recording.start')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalChatButton}
            onPress={() => {
              setIsVoiceModalVisible(false);
              if (isRecording) {
                stopRecording();
              }
              handleMainActionPress();
            }}
            accessibilityLabel={t('recording.goToChat')}
          >
            <Text style={styles.modalChatButtonText}>{t('recording.goToChat')}</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>
      {toast.visible && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={handleDismissToast}
          duration={3000}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  carouselContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },

  loadingBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 60,
    height: 60,
  },
  loadingText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
  },
  searchInput: {
    flex: 1,
    color: '#E0E0E0',
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    paddingVertical: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  leftHeaderIcons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl + 80,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  suggestionSection: {
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    elevation: 8,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navButtonGradient: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
  },
  navText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  modalContent: {
    alignItems: 'center',
  },
  recordingAnimation: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.md,
  },
  modalButton: {
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  modalButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  modalChatButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.primary,
  },
  modalChatButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

export default GeminiScreen;
