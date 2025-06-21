import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  AccessibilityInfo,
  Vibration,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { tw } from '../../styles/tailwind';
import { globalStyles } from '../../styles/globalStyles';
import { conversationStyles } from '../../styles/conversationStyles';
import { theme } from '../../styles/theme';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useImagePreview } from '../../hooks/useImagePreview';
import { useContextMenu } from '../../hooks/useContextMenu';
import { Recette, Ingredient } from '../../constants/entities';
import { NutritionData, TemplateProps } from '../../types/messageTypes';
import { formatRecipeToText } from '../../utils/textFormatter';
import { copyTextToClipboard } from '../../utils/clipboard';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import CollapsibleCard from '../common/CollapsibleCard';
import Checklist from '../common/Checklist';
import NutritionChart from '../common/NutritionChart';
import ToastNotification from '../common/ToastNotification';
import MarkdownRenderer from '../common/MarkdownRenderer';

interface ExtendedRecette extends Recette {
  isFavorite?: boolean;
}



interface RecipeTemplateProps extends TemplateProps {
  onAddToList?: (ingredients: Ingredient[]) => void;
  onSaveFavorite?: (recetteId: string) => void;
  onPlanMeal?: (recetteId: string) => void;
}

const RecipeTemplate: React.FC<RecipeTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToList,
  onSaveFavorite,
  onPlanMeal,
}) => {
  const { t, i18n } = useTranslation();

  // Local states
  const [isIngredientsCollapsed, setIsIngredientsCollapsed] = useState(true);
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(true);
  const [isNutritionCollapsed, setIsNutritionCollapsed] = useState(true);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Entry animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Swipe actions for deletion
  const [{ translateX }, { handleSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Image preview
  const [
    { visible: imageVisible, imageUri, animatedStyle: imageStyle },
    { showImagePreview, hideImagePreview },
  ] = useImagePreview();

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu((messageId: string) => onAction?.('delete', { id: messageId }));

  // Recipe validation
  const content = message.content as unknown;
  const recette: ExtendedRecette | null =
    (content as { recette: ExtendedRecette }).recette ||
    ((content as { type: string; recette: ExtendedRecette }).type === 'recipe'
      ? (content as { type: string; recette: ExtendedRecette }).recette
      : null);

  // Move useEffect to top level
  useEffect(() => {
    if (!recette) {return;} // Skip animation if recette is invalid
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('recipe.loaded', { name: recette.nom }));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, recette, t]);

  // Action handlers
  const handleAddToList = useCallback(() => {
    try {
      if (onAddToList && recette) {
        onAddToList(recette.ingredients);
        setToastMessage(t('actions.addedToList'));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.addedToList'));
      }
    } catch (err) {
      logger.error('Error adding to list', { error: getErrorMessage(err) });
      setToastMessage(t('actions.addToListError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onAddToList, recette, t]);

  const handleSaveFavorite = useCallback(() => {
    try {
      if (onSaveFavorite && recette) {
        onSaveFavorite(recette.id);
        setToastMessage(t('actions.savedFavorite'));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.savedFavorite'));
      }
    } catch (err) {
      logger.error('Error saving favorite', { error: getErrorMessage(err) });
      setToastMessage(t('actions.saveFavoriteError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onSaveFavorite, recette, t]);

  const handlePlanMeal = useCallback(() => {
    try {
      if (onPlanMeal && recette) {
        onPlanMeal(recette.id);
        setToastMessage(t('actions.plannedMeal'));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t('actions.plannedMeal'));
      }
    } catch (err) {
      logger.error('Error planning meal', { error: getErrorMessage(err) });
      setToastMessage(t('actions.planMealError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onPlanMeal, recette, t]);

  const handleAction = useCallback(
    (action: string, data: any) => {
      try {
        onAction?.(action, data);
        setToastMessage(t(`actions.${action}Success`));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t(`actions.${action}`));
      } catch (err) {
        logger.error(`Error handling action ${action}`, { error: getErrorMessage(err) });
        setToastMessage(t(`actions.${action}Error`));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAction, t],
  );

  const handleLongPress = useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      showContextMenu(message, { x: pageX, y: pageY });
      Vibration.vibrate(50);
      AccessibilityInfo.announceForAccessibility(t('contextMenu.opened'));
    },
    [showContextMenu, message, t],
  );

  const handleCopyRecipe = useCallback(async () => {
    try {
      if (recette) {
        const formattedRecipe = formatRecipeToText(recette);
        await copyTextToClipboard(formattedRecipe.text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Error copying recipe', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [handleCopy, recette, t]);

  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // Render functions
  const renderIngredient = useCallback(
    ({ item }: { item: Ingredient }) => (
      <Checklist
        items={[item]}
        onToggle={() => handleAction('toggleIngredient', item)}
        style={tw`mb-sm`}
        itemStyle={tw`p-sm`}
      />
    ),
    [handleAction],
  );

  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const renderInstruction = useCallback(
    ({ item, index }: { item: { texte: string; ordre: number }; index: number }) => (
      <View style={[tw`flex-${flexDirection} mb-md`]} key={index}>
        <Text style={[globalStyles.textBold, tw`mr-sm`]}>{index + 1}.</Text>
        <MarkdownRenderer content={item.texte} style={tw`flex-1`} textStyle={globalStyles.text} />
      </View>
    ),
    [flexDirection],
  );

  const renderComment = useCallback(
    ({ item }: { item: { userId: string; texte: string; date: string } }) => (
      <View style={tw`mb-md`} key={item.date}>
        <Text style={[globalStyles.textBold, tw`mb-xs`]}>{item.userId}</Text>
        <MarkdownRenderer content={item.texte} style={tw`mb-xs`} textStyle={globalStyles.text} />
        <Text style={[globalStyles.textSmall, tw`text-right`]}>
          {new Date(item.date).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}
        </Text>
      </View>
    ),
    [i18n.language],
  );

  // Early return for invalid recipe
  if (!recette) {
    logger.error('Invalid recipe content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidRecipe')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }


  const images = [
    recette.imageUrl,
    ...(recette.tutorielVideo ? [recette.tutorielVideo] : []),
  ].filter(Boolean) as string[];

  // Nutrition data
  const nutritionTotals = recette.ingredients.reduce(
    (acc, ingredient) => {
      const quantity = ingredient.quantite || 1; // Use ingredient quantity
      const nutrition = ingredient.valeurNutritionnelle;
      if (nutrition) {
        acc.proteines += (nutrition.proteines || 0) * quantity / 100; // Normalize to per 100g
        acc.lipides += (nutrition.lipides || 0) * quantity / 100;
        acc.glucides += (nutrition.glucides || 0) * quantity / 100;
      }
      return acc;
    },
    { proteines: 0, lipides: 0, glucides: 0 },
  );

  const nutritionData: NutritionData[] =
     [
        { id: 'calories', name: t('nutrition.calories'), value: recette.aiAnalysis?.caloriesTotales ?? 0,unit: 'Kcal' },
        { id: 'spices', name: t('nutrition.spices'), value: recette.aiAnalysis?.niveauEpices ??  0, unit: 'pincée' },
        { id: 'protein', name: t('nutrition.protein'), value: nutritionTotals.proteines, unit: 'g' },
        { id: 'fat', name: t('nutrition.fat'), value: nutritionTotals.lipides, unit: 'g' },
        { id: 'carbs', name: t('nutrition.carbs'), value: nutritionTotals.glucides, unit: 'g' },
      ];

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle]}
      onTouchStart={handleLongPress}
      accessibilityLabel={t('recipe.container', { name: recette.nom })}
      accessibilityHint={t('recipe.hint')}
      accessibilityRole="summary"
      {...handleSwipe(() => handleAction('delete', { id })).panHandlers}
    >
      {/* Header */}
      <View style={[styles.header, tw`flex-${flexDirection}`]}>
        <MaterialIcons
          name="restaurant"
          size={theme.fonts.sizes.large}
          color={theme.colors.textPrimary}
          accessibilityLabel={t('icons.restaurant')}
        />
        <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
          {recette.nom}
        </Text>
        <TouchableOpacity
          onPress={handleSaveFavorite}
          accessibilityLabel={t('actions.saveFavorite')}
          accessibilityHint={t('actions.saveFavoriteHint')}
        >
          <MaterialIcons
            name={recette.isFavorite ? 'favorite' : 'favorite-border'}
            size={theme.fonts.sizes.medium}
            color={recette.isFavorite ? theme.colors.error : theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Image carousel */}
      {images.length > 0 && (
        <FlatList
          data={images}
          horizontal
          renderItem={({ item }: { item: string }) => (
            <TouchableOpacity
              onPress={() => showImagePreview(item)}
              accessibilityLabel={t('recipe.image')}
            >
              <Image
                source={item as ImageSourcePropType}
                style={styles.carouselImage}
                resizeMode="cover"
                accessibilityLabel={t('recipe.image')}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsHorizontalScrollIndicator={false}
          style={tw`mb-md`}
          accessibilityLabel={t('recipe.carousel')}
          accessibilityHint={t('recipe.carouselHint')}
        />
      )}

      {/* Metadata */}
      <View style={[styles.metadata, tw`flex-${flexDirection} mb-md`]}>
        <View style={tw`flex-1`}>
          <Text style={globalStyles.textSmall}>
            {t('recipe.portions', { count: recette.portions })}
          </Text>
          <Text style={globalStyles.textSmall}>
            {t('recipe.time', {
              prep: recette.tempsPreparation,
              cook: recette.tempsCuisson || 0,
            })}
          </Text>
        </View>
        <View style={tw`flex-1`}>
          <Text style={globalStyles.textSmall}>
            {t('recipe.difficulty', { level: recette.difficulte })}
          </Text>
          <Text style={globalStyles.textSmall}>
            {t('recipe.category', { category: recette.categorie })}
          </Text>
        </View>
      </View>

      {/* Ingredients */}
      <CollapsibleCard
        title={t('recipe.ingredients')}
        initiallyExpanded={!isIngredientsCollapsed}
        onToggle={() => setIsIngredientsCollapsed(!isIngredientsCollapsed)}
        style={tw`mb-md`}
      >
        <FlatList
          data={recette.ingredients}
          renderItem={renderIngredient}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          accessibilityLabel={t('recipe.ingredientsList')}
          contentContainerStyle={tw`p-sm`}
        />
        <TouchableOpacity
          style={[globalStyles.button, tw`mt-sm`]}
          onPress={handleAddToList}
          accessibilityLabel={t('actions.addToList')}
          accessibilityHint={t('actions.addToListHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.addToList')}</Text>
        </TouchableOpacity>
      </CollapsibleCard>

      {/* Instructions */}
      <CollapsibleCard
        title={t('recipe.instructions')}
        initiallyExpanded={!isInstructionsCollapsed}
        onToggle={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
        style={tw`mb-md`}
      >
        <FlatList
          data={recette.etapesPreparation}
          renderItem={renderInstruction}
          keyExtractor={(item) => item.ordre.toString()}
          scrollEnabled={false}
          accessibilityLabel={t('recipe.instructionsList')}
          contentContainerStyle={tw`p-sm`}
        />
      </CollapsibleCard>

      {/* Nutrition analysis */}
      {recette.aiAnalysis && nutritionData.length > 0 && (
        <CollapsibleCard
          title={t('recipe.nutrition')}
          initiallyExpanded={!isNutritionCollapsed}
          onToggle={() => setIsNutritionCollapsed(!isNutritionCollapsed)}
          style={tw`mb-md`}
        >
          <NutritionChart
            data={nutritionData}
            style={tw`mb-md`}
            barColors={{
    low: ['#00FF00', '#66FF66'],
    medium: ['#FFFF00', '#FFFF66'],
    high: ['#FF0000', '#FF6666'],
  }}


          />
          <MarkdownRenderer
            content={t('recipe.compatibility', {
              status: Object.values(recette.aiAnalysis.adequationMembres || {}).join(', '),
            })}
            style={tw`p-sm`}
            textStyle={globalStyles.text}
          />
        </CollapsibleCard>
      )}

      {/* Comments */}
      {recette.commentaires && recette.commentaires.length > 0 && (
        <CollapsibleCard
          title={t('recipe.comments', { count: recette.commentaires.length })}
          initiallyExpanded={!isCommentsCollapsed}
          onToggle={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
          style={tw`mb-md`}
        >
          <FlatList
            data={recette.commentaires}
            renderItem={renderComment}
            keyExtractor={(item) => item.date}
            scrollEnabled={false}
            accessibilityLabel={t('recipe.commentsList')}
            contentContainerStyle={tw`p-sm`}
          />
        </CollapsibleCard>
      )}

      {/* Main actions */}
      <View style={[styles.actions, tw`flex-${flexDirection} mt-lg`]}>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() => handleAction('share', recette)}
          accessibilityLabel={t('actions.share')}
          accessibilityHint={t('actions.shareHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={handlePlanMeal}
          accessibilityLabel={t('actions.plan')}
          accessibilityHint={t('actions.planHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.plan')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1`]}
          onPress={handleCopyRecipe}
          accessibilityLabel={t('contextMenu.copy')}
          accessibilityHint={t('contextMenu.copyHint')}
        >
          <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
        </TouchableOpacity>
      </View>

      {/* Context menu */}
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={handleCopyRecipe}
            accessibilityLabel={t('contextMenu.copy')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="content-copy"
              size={theme.fonts.sizes.medium}
              color={theme.colors.textPrimary}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.copy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={async () => {
              await handleShare();
              setToastMessage(t('contextMenu.shareSuccess'));
              setToastType('success');
              setToastVisible(true);
            }}
            accessibilityLabel={t('contextMenu.share')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="share"
              size={theme.fonts.sizes.medium}
              color={theme.colors.textPrimary}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={() => {
              handleDelete();
              setToastMessage(t('contextMenu.deleteSuccess'));
              setToastType('success');
              setToastVisible(true);
            }}
            accessibilityLabel={t('contextMenu.delete')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons
              name="delete"
              size={theme.fonts.sizes.medium}
              color={theme.colors.error}
            />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.delete')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Image preview */}
      {imageVisible && imageUri && (
        <Animated.View style={[globalStyles.modalOverlay, imageStyle]}>
          <View style={globalStyles.modalContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
              accessibilityLabel={t('imagePreview.image')}
            />
            <TouchableOpacity
              style={[globalStyles.button, tw`mt-md`]}
              onPress={hideImagePreview}
              accessibilityLabel={t('imagePreview.close')}
              accessibilityHint={t('imagePreview.closeHint')}
            >
              <Text style={globalStyles.buttonText}>{t('imagePreview.close')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Toast notification */}
      {toastVisible && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onDismiss={handleDismissToast}
          duration={3000}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  metadata: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  carouselImage: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.medium,
    marginRight: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.medium,
  },
});

export default memo(RecipeTemplate);
