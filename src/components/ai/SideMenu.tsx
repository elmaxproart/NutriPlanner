import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColorScheme } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { generateUniqueId } from '../../utils/helpers';
import { theme } from '../../styles/theme';
import { PromptType } from '../../services/prompts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { logger } from '../../utils/logger';
import {
  AiInteraction,
  AiInteractionContent,
  AiInteractionType,
} from '../../constants/entities';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ToastNotification from '../common/ToastNotification';
import { getFirestore, collection, doc, getDoc } from '@react-native-firebase/firestore';
import { ScrollView } from 'react-native-gesture-handler';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: keyof RootStackParamList;
  action?: () => void;
  promptType?: PromptType;
  interactionContent?: AiInteractionContent;
  params?: any;
}

interface RecentQuery {
  id: string;
  query: string;
  promptType: PromptType;
  interactionContent: AiInteractionContent;
}

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatAiInteraction = (
  content: AiInteractionContent,
  type: AiInteractionType,
  conversationId: string = generateUniqueId(),
): AiInteraction => {
  const timestamp = new Date().toISOString();
  return {
    id: generateUniqueId(),
    content,
    isUser: true,
    timestamp,
    type,
    dateCreation: timestamp,
    dateMiseAJour: timestamp,
    conversationId,
  };
};

const mockRecentQueries: RecentQuery[] = [
  {
    id: 'query1',
    query: 'Recette de thiéboudienne',
    promptType: PromptType.RECIPE_PERSONALIZED,
    interactionContent: { type: 'text', message: 'Suggère une recette de thiéboudienne.' },
  },
  {
    id: 'query2',
    query: 'Menu hebdomadaire sénégalais',
    promptType: PromptType.BALANCED_DAILY_MENU,
    interactionContent: { type: 'text', message: 'Propose un menu hebdomadaire sénégalais.' },
  },
  {
    id: 'query3',
    query: 'Liste de courses pour jollof rice',
    promptType: PromptType.SHOPPING_LIST,
    interactionContent: { type: 'text', message: 'Crée une liste de courses pour du jollof rice.' },
  },
];

const menuItems: MenuItem[] = [
  { id: '1', title: 'Accueil', icon: 'home', route: 'Home' },
  { id: '2', title: 'Recettes', icon: 'food', route: 'RecipeList' },
  { id: '3', title: 'Planificateur de Menus', icon: 'calendar', route: 'MealHistory' },
  { id: '4', title: 'Liste de Courses', icon: 'cart', route: 'ShoppingList' },
  { id: '5', title: 'Profil', icon: 'account', route: 'Profile' },
  { id: '6', title: 'Paramètres', icon: 'cog', route: 'Settings' },
  { id: '7', title: 'Déconnexion', icon: 'logout', action: () => {} },
];

const MenuItemComponent: React.FC<{
  item: MenuItem;
  onPress: () => void;
  isDarkMode: boolean;
}> = ({ item, onPress, isDarkMode }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(0.8, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  // Correction ici : si item.title est null/undefined, fallback à une chaîne vide
  const labelKey = `menu.${(item.title || '').toLowerCase().replace(/ /g, '_')}`;

  return (
    <TouchableOpacity
      style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={t(labelKey)}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.itemContainer, animatedItemStyle]}>
        <Icon
          name={item.icon}
          size={22}
          color={isDarkMode ? theme.colors.textSecondary : theme.colors.textPrimary}
          style={styles.itemIcon}
        />
        <Text style={[styles.itemText, isDarkMode && styles.itemTextDark]}>
          {t(labelKey)}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const RecentQueryComponent: React.FC<{
  item: RecentQuery;
  onPress: () => void;
  isDarkMode: boolean;
}> = ({ item, onPress, isDarkMode }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(0.8, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  return (
    <TouchableOpacity
      style={[styles.queryItem, isDarkMode && styles.queryItemDark]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={t('recent_query.repeat', { query: item.query })}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.queryContainer, animatedItemStyle]}>
        <Icon
          name="history"
          size={20}
          color={isDarkMode ? theme.colors.textSecondary : theme.colors.textPrimary}
          style={styles.queryIcon}
        />
        <Text style={[styles.queryText, isDarkMode && styles.queryTextDark]}>
          {item.query}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SideMenu: React.FC<SideMenuProps> = ({ isVisible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { use, signOut } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });
  const translateX = useSharedValue(-300);
  const overlayOpacity = useSharedValue(0);
  const isDarkMode = useColorScheme() === 'dark';
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    if (use) {
      setLoadingProfile(true);

      setUserName(
        typeof use.displayName === 'string'
          ? use.displayName.replace(/[^a-zA-Z0-9]/g, '')
          : null
      );
      setUserEmail(use.email);

      const db = getFirestore();
      const userDocRef = doc(collection(db, 'users'), use.uid);

      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.userImageProfile) {
              setProfileImage(data.userImageProfile);
            }
            if (data?.name) {
              setUserName(data.name);
            }
          }
        })
        .catch((err) => {
          logger.error('Error fetching profile data', { error: err.message });
          setToast({
            visible: true,
            message: t('errors.profileLoad'),
            type: 'error',
          });
        })
        .finally(() => setLoadingProfile(false));
    } else {
      setLoadingProfile(false);
    }
  }, [use, t]);

  useEffect(() => {
    if (isVisible) {
      translateX.value = withTiming(0, { duration: 300 });
      overlayOpacity.value = withTiming(0.8, { duration: 300 });
    } else {
      translateX.value = withTiming(-300, { duration: 300 });
      overlayOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, translateX, overlayOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const navigateToChat = useCallback(
    (interaction: AiInteraction, promptType: PromptType) => {
      try {
        navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('Navigation error', { error: errorMessage });
        setToast({
          visible: true,
          message: t('errors.navigation'),
          type: 'error',
        });
      }
    },
    [navigation, t],
  );

  const handleMenuItemPress = useCallback(
    (item: MenuItem) => {
      try {
        if (item.route) {
          if (item.promptType && item.interactionContent) {
            const interaction = formatAiInteraction(item.interactionContent, 'text');
            navigateToChat(interaction, item.promptType);
          } else if (item.params) {
            navigation.navigate(item.route as any, item.params);
          } else {
            navigation.navigate(item.route as any, item.params);
          }
        } else if (item.action) {
          item.action();
        } else if (item.title === 'Déconnexion') {
          signOut();
          setToast({
            visible: true,
            message: t('menu.logout_success'),
            type: 'success',
          });
        }
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('Menu item press error', { error: errorMessage });
        setToast({
          visible: true,
          message: t('errors.menuNavigation'),
          type: 'error',
        });
      }
    },
    [navigation, navigateToChat, onClose, signOut, t],
  );

  const handleQueryPress = useCallback(
    (query: RecentQuery) => {
      try {
        const interaction = formatAiInteraction(query.interactionContent, 'text');
        navigateToChat(interaction, query.promptType);
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error('Recent query press error', { error: errorMessage });
        setToast({
          visible: true,
          message: t('errors.queryNavigation'),
          type: 'error',
        });
      }
    },
    [navigateToChat, onClose, t],
  );

  const handleLanguageSwitch = useCallback(() => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    setToast({
      visible: true,
      message: t('menu.language_switched', { lang: newLang.toUpperCase() }),
      type: 'success',
    });
  }, [i18n, t]);

  const handleDismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]} onTouchEnd={onClose} />
      <Animated.View
        style={[styles.menuContainer, animatedStyle]}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? [theme.colors.dark, theme.colors.dark]
              : [theme.colors.textPrimary, theme.colors.textSecondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.menuGradient}
        >
          {/* Header with Logo and Close Button */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/gemini-star.png')}
              style={styles.logo}
              resizeMode="contain"
            /><Text style={styles.logoTitle}> Nutriplanner</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('menu.close')}
              accessibilityRole="button"
            >
              <Icon name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {loadingProfile ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <TouchableOpacity
              activeOpacity={1}
                style={styles.profileContainer}
                onPress={() => handleMenuItemPress(menuItems.find((item) => item.route === 'Profile')!)}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profilePhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.profilePhotoPlaceholder}
                  >
                    <Icon name="account" size={40} color="#FFFFFF" />
                  </LinearGradient>
                )}
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileName}>
                    {userName || 'Hello'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {userEmail || 'email@example.com'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Language Switch Button */}
          <View style={styles.languageSection}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={handleLanguageSwitch}
              accessibilityLabel={t('menu.switch_language')}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.languageButtonGradient}
              >
                <Icon
                  name="translate"
                  size={20}
                  color="#FFFFFF"
                  style={styles.languageIcon}
                />
                <Text style={styles.languageButtonText}>
                  {i18n.language === 'en' ? 'FR' : 'EN'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
<ScrollView style={styles.listContent}>
          {/* Recent Queries Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requêtes Récentes</Text>
            <FlatList
              data={mockRecentQueries}
              renderItem={({ item }) => (
                <RecentQueryComponent
                  item={item}
                  onPress={() => handleQueryPress(item)}
                  isDarkMode={isDarkMode}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Navigation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('menu.navigation')}</Text>
            <FlatList
              data={menuItems}
              renderItem={({ item }) => (
                <MenuItemComponent
                  item={item}
                  onPress={() => handleMenuItemPress(item)}
                  isDarkMode={isDarkMode}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
</ScrollView>
          {toast.visible && (
            <ToastNotification
              message={toast.message}
              type={toast.type}
              onDismiss={handleDismissToast}
              duration={3000}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuContainer: {
    width: 300,
    height: '100%',
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  menuGradient: {
    flex: 1,
    paddingTop: theme.spacing.xl,
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  logo: {
    width: 100,
    height: 40,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  profileSection: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
    marginBottom: theme.spacing.md,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.sm,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  profilePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    color: theme.colors.white,
  },
  profileEmail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  languageSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  languageButton: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  languageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  languageIcon: {
    marginRight: theme.spacing.xs,
  },
  languageButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.medium,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
    logoTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.white,
    marginLeft: -10,
    marginBottom: theme.spacing.sm,
  },
  menuItem: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.background,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemDark: {
    backgroundColor: theme.colors.background,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
  },
  itemIcon: {
    marginRight: theme.spacing.sm,
  },
  itemText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
  },
  itemTextDark: {
    color: theme.colors.textSecondary,
  },
  queryItem: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  queryItemDark: {
    backgroundColor: theme.colors.background,
  },
  queryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  queryIcon: {
    marginRight: theme.spacing.sm,
  },
  queryText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  queryTextDark: {
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingBottom: theme.spacing.md,
  },
});

export default SideMenu;
