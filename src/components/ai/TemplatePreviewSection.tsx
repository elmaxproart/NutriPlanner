// src/components/common/TemplatePreviewSection.tsx
import React, { useCallback, useState, useEffect, memo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  findNodeHandle,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColorScheme } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { templateConfig } from '../../constants/templateConfig';
import { PromptType } from '../../services/prompts';
import { AiInteractionType } from '../../constants/entities';
import { mockTemplatePreviews, TemplatePreview } from '../../constants/mockTemplatePreviews';
import TemplateFactory from '../template/TemplateFactory';
import ToastNotification from '../common/ToastNotification';
import { theme } from '../../styles/theme';
import analytics, { getErrorMessage } from '../../utils/helpers';
import { RootStackParamList } from '../../App';
import { logger } from '../../utils/logger';

type TemplateCategory =
  | 'all'
  | 'recipes'
  | 'menus'
  | 'shopping'
  | 'budget'
  | 'nutrition'
  | 'troubleshooting'
  | 'creative'
  | 'stores'
  | 'other';

interface CategoryOption {
  id: TemplateCategory;
  labelKey: string;
}

const CATEGORIES: Record<TemplateCategory, (PromptType | AiInteractionType)[]> = {
  all: [],
  recipes: [
    PromptType.RECIPE_PERSONALIZED,
    PromptType.QUICK_RECIPE,
    PromptType.KIDS_RECIPE,
    PromptType.INGREDIENT_BASED_RECIPE,
    PromptType.SPECIFIC_DIET_RECIPE,
    PromptType.LEFTOVER_RECIPE,
    PromptType.GUEST_RECIPE,
    PromptType.RECIPE_FROM_IMAGE,
    'recipe',
    'recipe_suggestion',
    'recipe_compatibility',
  ],
  menus: [
    PromptType.WEEKLY_MENU,
    PromptType.SPECIAL_OCCASION_MENU,
    PromptType.BUDGET_MENU,
    PromptType.BALANCED_DAILY_MENU,
    'menu_suggestion',
    'menu',
  ],
  shopping: [PromptType.SHOPPING_LIST, 'shopping_list_suggestion', 'shopping'],
  budget: [PromptType.BUDGET_PLANNING, 'budget'],
  nutrition: [PromptType.MEAL_ANALYSIS, PromptType.NUTRITIONAL_INFO, 'recipe_analysis', 'nutritional_info'],
  troubleshooting: [PromptType.TROUBLESHOOT_PROBLEM, 'troubleshoot_problem'],
  creative: [PromptType.CREATIVE_IDEAS, 'creative_ideas'],
  stores: [PromptType.STORE_SUGGESTION, PromptType.INGREDIENT_AVAILABILITY, 'stores', 'ingredient_availability'],
  other: ['text', 'json', 'image', 'tool_use', 'tool_response', 'error'],
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'all', labelKey: 'categories.all' },
  { id: 'recipes', labelKey: 'categories.recipes' },
  { id: 'menus', labelKey: 'categories.menus' },
  { id: 'shopping', labelKey: 'categories.shopping' },
  { id: 'budget', labelKey: 'categories.budget' },
  { id: 'nutrition', labelKey: 'categories.nutrition' },
  { id: 'troubleshooting', labelKey: 'categories.troubleshooting' },
  { id: 'creative', labelKey: 'categories.creative' },
  { id: 'stores', labelKey: 'categories.stores' },
  { id: 'other', labelKey: 'categories.other' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const TEMPLATE_CARD_WIDTH = width * 0.9; // 90% de la largeur de l'écran
const TEMPLATE_CARD_MARGIN = theme.spacing.sm;

const SkeletonCard: React.FC = () => {
  const opacity = useSharedValue(0.3);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 1000 }),
  }));

  useEffect(() => {
    opacity.value = opacity.value === 0.3 ? 0.7 : 0.3;
    const interval = setInterval(() => {
      opacity.value = opacity.value === 0.3 ? 0.7 : 0.3;
    }, 1000);
    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <View style={[styles.templateCard, { width: TEMPLATE_CARD_WIDTH }]}>
      <Animated.View style={[styles.templateCardContainer, animatedStyle]}>
        <LinearGradient
          colors={['#E0E0E0', '#D1D1D1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.templateGradient}
        >
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonContent} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const CategoryFilter: React.FC<{
  selectedCategory: TemplateCategory;
  onSelectCategory: (category: TemplateCategory) => void;
}> = ({ selectedCategory, onSelectCategory }) => {
  const { t } = useTranslation();
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <FlatList
      horizontal
      data={CATEGORY_OPTIONS}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === item.id && styles.categoryButtonSelected,
            selectedCategory === item.id && (isDarkMode ? styles.categoryButtonDarkSelected : styles.categoryButtonLightSelected),
          ]}
          onPress={() => onSelectCategory(item.id)}
          accessibilityLabel={t(item.labelKey)}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === item.id && styles.categoryButtonTextSelected,
            ]}
          >
            {t(item.labelKey)}
          </Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.categoryList}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const TemplatePreviewComponent: React.FC<{
  item: TemplatePreview;
  onPress: () => void;
  isDarkMode: boolean;
  index: number;
}> = memo(({ item, onPress, isDarkMode, index }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const ref = useRef<View>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
  }, [opacity, index]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  const config = templateConfig[item.promptType || item.interactionType] || {
    iconName: 'help-circle',
    backgroundColor: theme.colors.primary,
    animationType: 'fade',
  };
  const titleKey = item.promptType
    ? `templates.${item.promptType}.title`
    : `templates.${item.interactionType}.title`;

  const handleFocus = () => {
    if (ref.current) {
      const reactTag = findNodeHandle(ref.current);
      if (reactTag) {
        AccessibilityInfo.announceForAccessibility(t(titleKey));
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.templateCard, { width: TEMPLATE_CARD_WIDTH }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={t(titleKey)}
      accessibilityRole="button"
      accessible={true}
      onAccessibilityTap={onPress}
      ref={ref}
      onFocus={handleFocus}
    >
      <Animated.View style={[styles.templateCardContainer, animatedStyle]}>
        <LinearGradient
          colors={
            isDarkMode
              ? [config.backgroundColor + 'CC', config.backgroundColor + '99']
              : [config.backgroundColor + 'FF', config.backgroundColor + 'CC']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.templateGradient}
        >
          <Icon
            name={config.iconName}
            size={28}
            color={theme.colors.textPrimary}
            style={styles.templateIcon}
          />
          <Text style={styles.templateTitle} numberOfLines={2}>
            {t(titleKey)}
          </Text>
          <ScrollView
            style={styles.templatePreviewContent}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            <TemplateFactory
              message={item.interaction}
              promptType={item.promptType}
              interactionType={item.interactionType}
              id={item.id}
            />
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

const TemplatePreviewSection: React.FC = () => {
  const { t } = useTranslation();
  const isDarkMode = useColorScheme() === 'dark';
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ visible: false, message: '', type: 'info' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [filteredTemplates, setFilteredTemplates] = useState<TemplatePreview[]>(mockTemplatePreviews);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const filtered = selectedCategory === 'all'
      ? mockTemplatePreviews
      : mockTemplatePreviews.filter(
          (template) =>
            (template.promptType && CATEGORIES[selectedCategory].includes(template.promptType)) ||
            CATEGORIES[selectedCategory].includes(template.interactionType),
        );
    setFilteredTemplates(filtered);
  }, [selectedCategory]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      logger.info('Screen dimensions changed', { width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isFocused) {
      analytics.track('TemplatePreviewSection_Viewed', { timestamp: new Date().toISOString() });
    }
  }, [isFocused]);

  const handleTemplatePress = useCallback(
    (template: TemplatePreview) => {
      try {
        analytics.track('Template_Pressed', {
          templateId: template.id,
          promptType: template.promptType,
          interactionType: template.interactionType,
        });

        if (template.promptType) {
          navigation.navigate('GeminiChat', {
            initialInteraction: template.interaction,
            promptType: template.promptType,
            messageId: template.interaction.id,
          });
        } else {
          setToast({
            visible: true,
            message: t('templates.previewOnly'),
            type: 'info',
          });
        }
      } catch (err) {
        logger.error('Template navigation error', { error: getErrorMessage(err) });
        setToast({
          visible: true,
          message: t('errors.templateNavigation'),
          type: 'error',
        });
      }
    },
    [navigation, t],
  );

  const handleDismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSelectCategory = useCallback((category: TemplateCategory) => {
    setSelectedCategory(category);
    analytics.track('Category_Filter_Selected', { category });
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: TemplatePreview; index: number }) => (
      <TemplatePreviewComponent
        item={item}
        onPress={() => handleTemplatePress(item)}
        isDarkMode={isDarkMode}
        index={index}
      />
    ),
    [handleTemplatePress, isDarkMode],
  );

  const renderSkeletonItem = useCallback(() => <SkeletonCard />, []);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <Text style={styles.sectionTitle}>{t('templates.title')}</Text>
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />
    </View>
  ), [t, selectedCategory, handleSelectCategory]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('templates.noTemplates')}</Text>
    </View>
  ), [t]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FlatList
            horizontal
            data={Array(5).fill({})}
            renderItem={renderSkeletonItem}
            keyExtractor={(_, index) => `skeleton-${index}`}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      ) : (
        <>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            horizontal
            data={filteredTemplates}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsHorizontalScrollIndicator={false}
            snapToInterval={TEMPLATE_CARD_WIDTH + TEMPLATE_CARD_MARGIN * 2}
            decelerationRate="fast"
            ListEmptyComponent={renderEmptyComponent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </>
      )}
      {toast.visible && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={handleDismissToast}
          duration={3000}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    flexGrow: 0,
  },
  headerContainer: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  categoryList: {
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
  },
  categoryButtonSelected: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  categoryButtonLightSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonDarkSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  categoryButtonTextSelected: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.semiBold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  templateCard: {
    marginHorizontal: TEMPLATE_CARD_MARGIN,
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    minHeight: 300, // Hauteur minimale augmentée
  },
  templateCardContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  templateGradient: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  templateIcon: {
    marginBottom: theme.spacing.xs,
    alignSelf: 'center',
  },
  templateTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  templatePreviewContent: {
    flex: 1,
    minHeight: 200, // Hauteur minimale pour le contenu
    maxHeight: 400, // Hauteur maximale pour limiter le défilement
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  skeletonIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#C0C0C0',
    borderRadius: 14,
    marginBottom: theme.spacing.xs,
    alignSelf: 'center',
  },
  skeletonTitle: {
    width: '80%',
    height: 20,
    backgroundColor: '#C0C0C0',
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    alignSelf: 'center',
  },
  skeletonContent: {
    flex: 1,
    backgroundColor: '#D1D1D1',
    borderRadius: 8,
    minHeight: 200,
  },
});

export default memo(TemplatePreviewSection);
