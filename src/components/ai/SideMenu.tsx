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
import { commonStyles } from '../../styles/commonStyles';
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
];

const MenuItemComponent: React.FC<{
  item: MenuItem;
  onPress: () => void;
  isDarkMode: boolean;
}> = ({ item, onPress, isDarkMode }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  return (
    <TouchableOpacity
      style={[commonStyles.sideMenuItem, styles.menuItem]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={t(`menu.${item.title.toLowerCase().replace(' ', '_')}`)}
      accessibilityRole="button"
    >
      <Animated.View style={animatedItemStyle}>
        <LinearGradient
          colors={isDarkMode ? ['#3A3A3C', '#2C2C2E'] : ['#F9FAFB', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.itemGradient}
        >
          <Icon
            name={item.icon}
            size={24}
            color={theme.colors.textPrimary}
            style={styles.itemIcon}
          />
          <Text style={[commonStyles.sideMenuText, styles.itemText]}>
            {t(`menu.${item.title.toLowerCase().replace(' ', '_')}`)}
          </Text>
        </LinearGradient>
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

  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  return (
    <TouchableOpacity
      style={[commonStyles.sideMenuItem, styles.queryItem]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={t('recent_query.repeat', { query: item.query })}
      accessibilityRole="button"
    >
      <Animated.View style={animatedItemStyle}>
        <LinearGradient
          colors={isDarkMode ? ['#2C2C2E', '#1F1F21'] : ['#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.queryGradient}
        >
          <Icon
            name="history"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.queryIcon}
          />
          <Text style={[commonStyles.cardDescription, styles.queryText]}>
            {item.query}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SideMenu: React.FC<SideMenuProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation();
  const { userId } = useAuth();
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

  // Load user profile from Firestore using modular API
  useEffect(() => {
    if (userId) {
      setLoadingProfile(true);
      const usernameFromEmail = userId.split('@')[0];
      setUserName(usernameFromEmail.replace(/[^a-zA-Z0-9]/g, ''));
      setUserEmail(userId);

      const db = getFirestore();
      const userDocRef = doc(collection(db, 'users'), userId);

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
  }, [userId, t]);

  // Animation for menu
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
            switch (item.route) {
              case 'Home':
              case 'RecipeList':
              case 'MealHistory':
              case 'ShoppingList':
              case 'Profile':
              case 'Settings':
                navigation.navigate(item.route);
                break;
              default:
                logger.warn(`Route ${item.route} not handled explicitly`);
                navigation.navigate(item.route as any);
            }
          }
        } else if (item.action) {
          item.action();
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
    [navigation, navigateToChat, onClose, t],
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
        style={[commonStyles.sideMenuContainer, animatedStyle, styles.menuContainer]}
      >
        <LinearGradient
          colors={isDarkMode ? ['#1F1F21', '#2C2C2E'] : ['#E5E7EB', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.menuGradient}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel={t('menu.close')}
            accessibilityRole="button"
          >
            <Icon name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.profileSection}>
            {loadingProfile ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <TouchableOpacity onPress={() => handleMenuItemPress(menuItems.find((item) => item.route === 'Profile')!)}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profilePhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#FF4F00', '#FF7F3F']}
                    style={styles.profilePhotoPlaceholder}
                  >
                    <Icon name="account" size={40} color={theme.colors.textPrimary} />
                  </LinearGradient>
                )}
                <Text style={[commonStyles.sectionHeaderTitle, styles.profileName]}>
                  {userName || t('menu.user')}
                </Text>
                <Text style={[commonStyles.cardDescription, styles.profileEmail]}>
                  {userEmail || 'email@example.com'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.section}>
            <Text style={[commonStyles.sectionHeaderTitle, styles.sectionTitle]}>
              {t('menu.recent_queries')}
            </Text>
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
          <View style={styles.section}>
            <Text style={[commonStyles.sectionHeaderTitle, styles.sectionTitle]}>
              {t('menu.navigation')}
            </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: 280,
    height: '100%',
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  menuGradient: {
    flex: 1,
    paddingTop: theme.spacing.xl,
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  menuItem: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  itemGradient: {
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
  queryItem: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  queryGradient: {
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
  listContent: {
    paddingBottom: theme.spacing.md,
  },
});

export default SideMenu;
