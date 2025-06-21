/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { useAIConversation } from '../hooks/useAIConversation';
import { useFirestore } from '../hooks/useFirestore';
import { Ingredient, Menu, Store, Budget } from '../constants/entities';
import { logger } from '../utils/logger';
import { mockMenus, mockFamilyMembers, mockStores, mockIngredients } from '../constants/mockData';
import SideMenu from '../components/ai/SideMenu';
import SearchModal from '../components/common/SearchModal';
import LearnMoreCarousel from '../components/ai/LearnMoreCarousel';
import FamilySection from '../components/ai/FamilySection';
import NutritionChart from '../components/common/NutritionChart';
import MainActionButton from '../components/ai/MainActionButton';
import { SuggestionCard } from '../components/ai/SuggestionCard';
import { theme } from '../styles/theme';
import { generateUniqueId } from '../utils/helpers';
import { AiInteraction } from '../constants/entities';
import { AudioContent, NutritionData, TextContent } from '../types/messageTypes';
import { Vibration } from 'react-native';
import { Audio } from 'expo-av';
import AITemplateCarousel from '../components/ai/AITemplateCarousel';
import RecordingModal from '../components/common/RecordingModal';
import { commonStyles } from '../styles/commonStyles';
import { globalStyles } from '../styles/globalStyles';
import LottieView from 'lottie-react-native';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Reminder {
  id: string;
  title: string;
  icon: string;
  action: () => void;
}

interface Preference {
  id: string;
  label: string;
  value: boolean | number | string;
  type: 'switch' | 'slider' | 'textPrimary';
}

const Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId, loading: authLoading } = useAuth();
  const { familyMembers, loading: familyLoading } = useFamilyData();
  const { loading: aiLoading, isReady: aiReady, getMenuSuggestions } = useAIConversation();
  const { getCollection } = useFirestore();
  const [menus, setMenus] = useState<Menu[]>(mockMenus);
  const [aiSuggestions, setAiSuggestions] = useState<Menu[]>([]);
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [budget, setBudget] = useState<number>(500);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [___, setDarkTheme] = useState(true);
  const [__, setNotifications] = useState(true);
  const [_, setPreferences] = useState<Preference[]>([
    { id: 'vegan', label: 'Végan', value: false, type: 'switch' },
    { id: 'spiceLevel', label: 'Niveau d\'épices', value: 1, type: 'slider' },
    { id: 'cuisine', label: 'Cuisine préférée', value: 'Non spécifié', type: 'textPrimary' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'loading';
    message: string;
    onClose?: () => void;
  }>({ visible: false, type: 'success', message: '' });
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false); // Nouvel état pour le modal
  const scrollViewRef = useRef<ScrollView>(null);
const [recordingError, setRecordingError] = useState<string | null>(null);


  const nutritionData: NutritionData[] = [
    { id: '1', name: 'Calories', value: 2000, unit: 'Kcal' },
    { id: '2', name: 'Protéines', value: 80, unit: 'g' },
    { id: '3', name: 'Glucides', value: 250, unit: 'g' },
    { id: '4', name: 'Lipides', value: 70, unit: 'g' },
  ];

  const reminders: Reminder[] = [
    { id: '1', title: 'Liste de courses', icon: 'cart', action: () => navigation.navigate('ShoppingList') },
    { id: '2', title: 'Budget', icon: 'cash', action: () => navigation.navigate('BudgetOverview') },
    { id: '3', title: 'Historique des repas', icon: 'history', action: () => navigation.navigate('MealHistory') },
    { id: '4', title: 'Magasins', icon: 'store', action: () => navigation.navigate('Stores') },
    { id: '5', title: 'Ajouter un menu', icon: 'food', action: () => navigation.navigate('AddMenu') },
    { id: '6', title: 'Ajouter une recette', icon: 'book-open-page-variant', action: () => navigation.navigate('AddRecipe') },
    { id: '7', title: 'Paramètres', icon: 'cog', action: () => navigation.navigate('Settings') },
    { id: '8', title: 'Profil', icon: 'account', action: () => navigation.navigate('Profile') },
  ];

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: withTiming(contentOpacity.value * 30 - 30, { duration: 400, easing: Easing.out(Easing.ease) }) }],
  }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    contentOpacity.value = withTiming(1, { duration: 500 });
  }, [headerOpacity, contentOpacity]);

  useEffect(() => {
    if (!userId || authLoading) { return; }

    const fetchProfile = async () => {
      try {
        const usernameFromEmail = userId.split('@')[0];
        setUserName(usernameFromEmail.replace(/[^a-zA-Z0-9]/g, ''));

        const firestore = (await import('@react-native-firebase/firestore')).default;
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists()) {
          const data = doc.data();
          if (data?.userImageProfile) { setProfileImage(data.userImageProfile); }
          if (data?.name) { setUserName(data.name); }
          if (data?.theme) { setDarkTheme(data.theme === 'dark'); }
          if (data?.notifications !== undefined) { setNotifications(data.notifications); }
          if (data?.preferences) { setPreferences(data.preferences); }
        }
      } catch (error: any) {
        logger.error('Erreur lors de la récupération du profil', { error: error.message });
        setModalState({ visible: true, type: 'error', message: 'Erreur lors de la récupération du profil' });
      }
    };

    fetchProfile();
  }, [userId, authLoading]);

  useEffect(() => {
    const initialize = async () => {
      if (!userId || authLoading) {
        logger.info('Initialisation ignorée : pas d\'userId, authLoading ou networkLoading');
        return;
      }

      try {
        logger.info('Récupération des données du tableau de bord...');
        const [menuList, storeList, budgetList] = await Promise.all([
          getCollection<Menu>('Menus'),
          getCollection<Store>('Stores'),
          getCollection<Budget>('Budgets'),
        ]);
        logger.info('Données récupérées:', { menus: menuList.length, stores: storeList.length, budgets: budgetList.length });
        setMenus(menuList.length > 0 ? menuList : mockMenus);
        setStores(storeList.length > 0 ? storeList : mockStores);
        setBudget(
          budgetList.length > 0
            ? (budgetList[0].depenses?.reduce((sum, d) => sum + (d.montant || 0), 0) ?? 0)
            : 0
        );
      } catch (error: any) {
        logger.error('Erreur lors de la récupération des données', { error: error.message });
        setModalState({ visible: true, type: 'error', message: 'Échec de la récupération des données' });
      }
    };
    initialize();
  }, [userId, authLoading, familyMembers, getCollection, navigation]);

  const fetchAiSuggestions = useCallback(async () => {
    if (!aiReady || !userId || aiLoading || familyMembers.length === 0) {
      logger.info('Suggestions IA ignorées : conditions non remplies');
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      let allSuggestions: Menu[] = [];
      let ingredients = await getCollection<Ingredient>('Ingredients');
      if (!ingredients || ingredients.length === 0) {
        ingredients = mockIngredients;
      }
      for (let i = 0; i < 5; i++) {
        const suggestions = await getMenuSuggestions(ingredients, familyMembers, 2, 2);
        if (Array.isArray(suggestions)) {
          allSuggestions = allSuggestions.concat(suggestions);
        }
      }
      if(allSuggestions.length > 0){
      setAiSuggestions(allSuggestions);
      }else{
        setAiSuggestions(mockMenus);
      }
    } catch (error: any) {
      logger.error('Échec de la récupération des suggestions IA', { error: error.message });
      setModalState({ visible: true, type: 'error', message: 'Échec de la récupération des suggestions' });
    } finally {
      setIsFetchingSuggestions(false);
      setAiSuggestions(mockMenus);
    }
  }, [aiReady, userId, aiLoading, familyMembers, getCollection, getMenuSuggestions]);

  useEffect(() => {
    fetchAiSuggestions();
  }, [fetchAiSuggestions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % 3;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    const backAction = () => {
      setModalState({
        visible: true,
        type: 'loading',
        message: 'Voulez-vous quitter ?',
        onClose: () => setModalState({ ...modalState, visible: false }),
      });
      setTimeout(() => {
        setModalState({
          visible: true,
          type: 'error',
          message: 'Voulez-vous quitter ?',
          onClose: () => {
            setModalState({ ...modalState, visible: false });
            BackHandler.exitApp();
          },
        });
      }, 1000);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [modalState]);

const startRecording = useCallback(async () => {
  try {
    setRecordingError(null); // Clear previous errors
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      setRecordingError('Permission audio refusée');
      logger.error('Permission audio refusée');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1,
    });
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(newRecording);
    setIsRecording(true);
    Vibration.vibrate(100);
  } catch (err: any) {
    const errorMessage = 'Erreur au démarrage de l\'enregistrement';
    setRecordingError(errorMessage);
    logger.error('Erreur lors du démarrage de l\'enregistrement', { error: err.message });
    // Don't show modalState here to avoid duplicate error messages
  }
}, []);

// Update stopRecording
const stopRecording = useCallback(async () => {
  if (!recording) { return; }
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setIsRecording(false);
    setRecording(null);
    setRecordingModalVisible(false);
    setRecordingError(null); // Clear error on success
    setModalState({
      visible: true,
      type: 'success',
      message: 'Enregistrement sauvegardé',
    });

    if (uri) {
      const audioContent: AudioContent = { type: 'audio', uri, mimeType: 'audio/m4a' };
      const interaction: AiInteraction = {
        id: generateUniqueId(),
        content: audioContent,
        isUser: true,
        timestamp: new Date().toISOString(),
        type: 'audio',
        dateCreation: new Date().toISOString(),
        dateMiseAJour: new Date().toISOString(),
        conversationId: generateUniqueId(),
      };
      navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType: undefined });
    }
  } catch (err: any) {
    const errorMessage = 'Erreur à l\'arrêt de l\'enregistrement';
    setRecordingError(errorMessage);
    logger.error('Erreur lors de l\'arrêt de l\'enregistrement', { error: err.message });
  }
}, [recording, navigation]);

  const handleMainActionPress = useCallback(() => {
    navigation.navigate('GeminiAI');
  }, [navigation]);

  const handleMainActionLongPress = useCallback(() => {
    Vibration.vibrate([0, 100, 50, 100]);
    setRecordingModalVisible(true); // Ouvre le modal au lieu de démarrer l'enregistrement
  }, []);

  const renderMenuCard = useCallback(
    ({ item }: { item: Menu }) => (
      <TouchableOpacity
        style={[styles.card , globalStyles.card]}
        onPress={() => navigation.navigate('MenuDetail', { menuId: item.id })}
        accessibilityLabel={`Menu: ${item.recettes?.[0]?.nom || 'Menu'}`}
      >
        <Image
          source={item.image || require('../assets/images/okok.jpg')}
          style={styles.cardImage}
        />
        <LinearGradient colors={[theme.colors.primary, theme.colors.primary]} style={styles.cardGradient}>
          <Text style={styles.cardTitle}>{item.recettes?.[0]?.nom || 'Menu sans nom'} -<Text style={styles.cardSubtitle} numberOfLines={2}> {item.typeRepas}</Text> </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.recettes?.[0]?.instructions?.[0] || 'Aucune description'}
          </Text>
          <Text style={[styles.cardPrice,commonStyles.text , styles.cardSubtitle ]} selectionColor={theme.colors.accent} >{item.coutTotalEstime?.toFixed(2) || '0.0'} Fcfa - <Text style={[styles.cardPrice , commonStyles.text , styles.cardSubtitle]}>{item.coutReel?.toFixed(2) || '0.0'}Fcfa</Text></Text>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [navigation]
  );

  const renderStoreCard = useCallback(
    ({ item }: { item: Store }) => (
      <TouchableOpacity
        style={[styles.storeCard, globalStyles.card]}
        activeOpacity={1}
        onPress={() => navigation.navigate('Store', { storeId: item.id })}
        accessibilityLabel={`Magasin: ${item.nom}`}
      >

         <Image
          source={item.articles[0].imageUrl || require('../assets/images/okok.jpg')}
          style={styles.cardImage}
        />
        <Text style={styles.storeName}>{item.nom}</Text>
        <Text style={styles.storeAddress} numberOfLines={2}>
          {item.localisation?.adresse || 'Aucune adresse'}
        </Text>
      </TouchableOpacity>
    ),
    [navigation]
  );

  const renderReminderCard = useCallback(
    ({ item }: { item: Reminder }) => (
      <TouchableOpacity
      activeOpacity={1}
        style={styles.reminderCard}
        onPress={item.action}
        accessibilityLabel={item.title}
      >
        <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.reminderGradient}>
          <MaterialCommunityIcons name={item.icon} size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.reminderText} numberOfLines={2}>{item.title}</Text>
      </TouchableOpacity>
    ),
    []
  );

  const renderSuggestionCard = useCallback(
    ({ item }: { item: Menu }) => (
      <SuggestionCard
        title={item.recettes?.[0]?.nom || 'Menu sans nom'}
        description={item.recettes?.[0]?.instructions?.[0] || 'Aucune description disponible'}
        imageUri={item.image}
        onPress={() => navigation.navigate('MenuDetail', { menuId: item.id })}
        onSendToAI={(message) => {
          const textContent: TextContent = { type: 'text', message };
          const interaction: AiInteraction = {
            id: generateUniqueId(),
            content: textContent,
            isUser: true,
            timestamp: new Date().toISOString(),
            type: 'text',
            dateCreation: new Date().toISOString(),
            dateMiseAJour: new Date().toISOString(),
            conversationId: generateUniqueId(),
          };
          navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType: undefined });
        }}
        onShare={(content) => logger.info(`Partager: ${content}`)}
      />
    ),
    [navigation]
  );

  if (authLoading || familyLoading || aiLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={require('../assets/images/koki.jpg')} style={styles.loadingBackground} />
        <View style={styles.loadingContainer}>
          <Animated.View style={styles.loadingIcon}>
            <LottieView
            source={require('../assets/animations/gemini.json')}
            loop={true}
            autoPlay={false}
            style={styles.recordingAnimation}
          />
          </Animated.View>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSideMenuVisible(true)}
          accessibilityLabel="Menu"
        >
          <View style={styles.headerButton}>
            <MaterialCommunityIcons name="menu" size={24} color={theme.colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            accessibilityLabel="Rechercher"
          >
            <View style={styles.headerButton}>
              <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.textPrimary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GeminiAI')}
            accessibilityLabel="Gemini AI"
          >
            <Image source={require('../assets/images/gemini-star.png')} style={styles.geminiIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profil"
          >
            <View style={styles.headerButton}>
              <MaterialCommunityIcons name="account" size={24} color={theme.colors.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.contentContainer, contentStyle]}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menus en vedette</Text>
            <LearnMoreCarousel />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aperçu de la famille</Text>
            <FamilySection />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Menus populaires</Text>
              <TouchableOpacity style={globalStyles.card} onPress={() => navigation.navigate('Menu')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={menus.slice(0, 10)}
              renderItem={renderMenuCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggestions AI</Text>
              <TouchableOpacity style={globalStyles.card} onPress={() => navigation.navigate('MenuSuggestions')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {isFetchingSuggestions ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : mockMenus.length > 0 ? (
              <FlatList
                data={mockMenus}
                renderItem={renderSuggestionCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
              />
            ) : (
              <Text style={styles.noSuggestionsText}>Aucune suggestion disponible</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Familia</Text>
              <TouchableOpacity activeOpacity={1}  style={globalStyles.card} onPress={() => navigation.navigate('MenuSuggestions')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {isFetchingSuggestions ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <AITemplateCarousel />
            )}
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyse nutritionnelle</Text>
            <NutritionChart data={nutritionData} style={styles.nutritionChart} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Liste des magasins</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Stores')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={stores.slice(0, 10)}
              renderItem={renderStoreCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rappels</Text>
            <FlatList
              data={reminders}
              renderItem={renderReminderCard}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.reminderList}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={styles.navButton}>
            <MaterialCommunityIcons name="home-outline" size={28} color={theme.colors.textPrimary} />
          </View>
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Menu')}
        >
          <View style={styles.navButton}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={theme.colors.textPrimary} />
          </View>
          <Text style={styles.navText}>Menus</Text>
        </TouchableOpacity>
        <MainActionButton
          onPressAction={handleMainActionPress}
          onLongPressAction={handleMainActionLongPress}
        />
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('RecipeList')}
        >
          <View style={styles.navButton}>
           <MaterialCommunityIcons name="cart-outline" size={28} color={theme.colors.textPrimary} />
          </View>
          <Text style={styles.navText}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.navButton}>
            <MaterialCommunityIcons name="account-outline" size={28} color={theme.colors.textPrimary} />
          </View>
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>

      <SideMenu isVisible={sideMenuVisible} onClose={() => setSideMenuVisible(false)} />
      <SearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} />
      <RecordingModal
  visible={recordingModalVisible}
  isRecording={isRecording}
  error={recordingError}
  onStartRecording={startRecording}
  onStopRecording={stopRecording}
  onClose={() => {
    if (isRecording) {
      stopRecording();
    }
    setRecordingModalVisible(false);
    setRecordingError(null);
  }}
/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
      recordingAnimation: {
    width: 90,
    height: 90,
    marginBottom: theme.spacing.md,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  geminiIcon: {
    width: 24,
    height: 24,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  seeAll: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
  },
  card: {
    width: screenWidth * 0.45,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardGradient: {
    padding: 10,
    borderRadius: theme.borderRadius.medium,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  cardSubtitle: {
    color: '#E0E0E0',
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
  },
  cardPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  flatListContent: {
    paddingHorizontal: 4,
  },
  nutritionChart: {
    height: 240,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    padding: 12,
  },
  reminderList: {
    paddingHorizontal: 4,
  },
  reminderCard: {
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderGradient: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reminderText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
    textAlign: 'center',
  },
  storeCard: {
    width: screenWidth * 0.4,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeName: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  storeAddress: {
    color: theme.colors.white,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  navText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
  },
  loadingBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  noSuggestionsText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    textAlign: 'center',
    padding: 16,
  },
});

export default Dashboard;
