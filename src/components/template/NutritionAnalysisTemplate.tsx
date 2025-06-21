// NutritionAnalysisTemplate.tsx
// Composant pour afficher les analyses nutritionnelles des recettes ou aliments dans un format interactif.

import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, FlatList, TextInput } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage, formatDate } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TemplateProps, RecipeAnalysisContent, NutritionalInfoContent } from '../../types/messageTypes';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useMenus } from '../../hooks/useMenus';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useRecipes } from '../../hooks/useRecipes';
import { useAuth } from '../../hooks/useAuth';
import { Menu, HistoriqueRepas } from '../../constants/entities';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import ModalComponent from '../common/ModalComponent';
import ToastNotification from '../common/ToastNotification';
import NutritionChart from '../common/NutritionChart';
import { Picker } from '@react-native-picker/picker';

interface NutritionAnalysisTemplateProps extends TemplateProps {
  onAddToRecipe?: (recipeId: string, analysis: RecipeAnalysisContent['analysis']) => void;
}

// Composant principal pour afficher les analyses nutritionnelles
const NutritionAnalysisTemplate: React.FC<NutritionAnalysisTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToRecipe,
}) => {
  const { t, i18n } = useTranslation();
  const { menus, addMenu, fetchMenus, loading: menusLoading, error: menusError } = useMenus();
  const { addMealHistory, loading: historyLoading, error: historyError } = useMealHistory();
  const { getRecipeById, loading: recipesLoading, error: recipesError } = useRecipes();
  const { userId } = useAuth();

  // États locaux
  const [isNutrientsCollapsed, setIsNutrientsCollapsed] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDate, setNewMenuDate] = useState(formatDate(new Date()));
  const [newMenuType, setNewMenuType] = useState<'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation'>('déjeuner');

  // Animations
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Gestion des gestes de balayage
  const [{ translateX }, { handleSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Menu contextuel
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu((messageId: string) => onAction?.('delete', { id: messageId }));

  // Validation du contenu
  const content = message.content as unknown;
  const analysisContent: RecipeAnalysisContent | NutritionalInfoContent | null =
    (content as { type: string }).type === 'recipe_analysis' || (content as { type: string }).type === 'nutritional_info'
      ? (content as RecipeAnalysisContent | NutritionalInfoContent)
      : null;

  // Effet d'animation à l'entrée
  useEffect(() => {
    if (!analysisContent) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('nutritionAnalysis.loaded'));
    } catch (err) {
      logger.error('Erreur lors de l’animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, analysisContent, t]);

  // Gestion des erreurs des hooks
  useEffect(() => {
    if (menusError || historyError || recipesError) {
      setToastMessage(menusError || historyError || recipesError || t('errors.generic'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [menusError, historyError, recipesError, t]);

  // Gestionnaire pour ajouter à une recette
  const handleAddToRecipe = useCallback(async () => {
    try {
      if (
        onAddToRecipe &&
        analysisContent &&
        'recipeId' in analysisContent &&
        analysisContent.recipeId &&
        analysisContent.type === 'recipe_analysis'
      ) {
        const recipe = await getRecipeById(analysisContent.recipeId);
        if (recipe) {
          onAddToRecipe(analysisContent.recipeId, analysisContent.analysis);
          setToastMessage(t('nutritionAnalysis.addedToRecipe', { recipeName: recipe.nom }));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(t('nutritionAnalysis.addedToRecipe', { recipeName: recipe.nom }));
        } else {
          throw new Error('Recette non trouvée');
        }
      }
    } catch (err) {
      logger.error('Erreur lors de l’ajout à la recette', { error: getErrorMessage(err) });
      setToastMessage(t('nutritionAnalysis.addToRecipeError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [onAddToRecipe, analysisContent, getRecipeById, t]);

  // Gestionnaire pour ouvrir le modal de sélection de menu
  const handleOpenMenuModal = useCallback(() => {
    setModalVisible(true);
    AccessibilityInfo.announceForAccessibility(t('nutritionAnalysis.menuModalOpened'));
  }, [t]);

  // Gestionnaire pour ajouter à un menu existant
  const handleAddToMenu = useCallback(async () => {
    if (!analysisContent || !selectedMenu) {return;}
    setModalVisible(false);

    try {
      const menuId = selectedMenu.id;
      const historyEntry: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        menuId,
        date: newMenuDate,
        typeRepas: selectedMenu.typeRepas,
        notes: `Analyse nutritionnelle ajoutée: ${analysisContent.analysis.calories} kcal`,
      };

      const historyId = await addMealHistory(historyEntry);
      if (historyId) {
        setToastMessage(t('nutritionAnalysis.addedToMenu', { menuName: selectedMenu.foodName || selectedMenu.typeRepas }));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(
          t('nutritionAnalysis.addedToMenu', { menuName: selectedMenu.foodName || selectedMenu.typeRepas }),
        );
      }
    } catch (err) {
      logger.error('Erreur lors de l’ajout au menu', { error: getErrorMessage(err) });
      setToastMessage(t('nutritionAnalysis.addToMenuError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [analysisContent, selectedMenu, newMenuDate, addMealHistory, t]);

  // Gestionnaire pour créer un nouveau menu
  const handleCreateNewMenu = useCallback(async () => {
    if (!analysisContent || !newMenuName || !userId) {return;}
    setModalVisible(false);

    try {
      const newMenu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        createurId: userId,
        date: newMenuDate,
        typeRepas: newMenuType,
        recettes: [],
        foodName: newMenuName,
        description: `Menu créé avec analyse nutritionnelle: ${analysisContent.analysis.calories} kcal`,
        coutTotalEstime: 0,
        statut: 'planifié',
      };

      const menuId = await addMenu(newMenu);
      if (menuId) {
        const historyEntry: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
          menuId,
          date: newMenuDate,
          typeRepas: newMenuType,
          notes: `Analyse nutritionnelle ajoutée: ${analysisContent.analysis.calories} kcal`,
        };

        const historyId = await addMealHistory(historyEntry);
        if (historyId) {
          await fetchMenus();
          setToastMessage(t('nutritionAnalysis.addedToNewMenu', { menuName: newMenuName }));
          setToastType('success');
          setToastVisible(true);
          AccessibilityInfo.announceForAccessibility(t('nutritionAnalysis.addedToNewMenu', { menuName: newMenuName }));
        }
      }
    } catch (err) {
      logger.error('Erreur lors de la création du menu', { error: getErrorMessage(err) });
      setToastMessage(t('nutritionAnalysis.addToMenuError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [analysisContent, newMenuName, newMenuDate, newMenuType, addMenu, addMealHistory, fetchMenus, userId, t]);

  // Gestionnaire pour copier l’analyse
  const handleCopyAnalysis = useCallback(async () => {
    try {
      if (analysisContent) {
        const dietaryFit =
          analysisContent.type === 'recipe_analysis' ? analysisContent.analysis.description : t('nutritionAnalysis.unknownDietaryFit');
        const text =
          `${t('nutritionAnalysis.title', { recipeId: 'recipeId' in analysisContent ? analysisContent.recipeId : '' })}\n` +
          `${t('nutritionAnalysis.calories', { calories: analysisContent.analysis.calories })}\n` +
          `${t('nutritionAnalysis.nutrients')}\n${analysisContent.analysis.nutrients
            .map((nutrient) => `- ${nutrient.name}: ${nutrient.value} ${nutrient.unit}`)
            .join('\n')}\n` +
          `${t('nutritionAnalysis.dietaryFit', { fit: dietaryFit })}`;
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
      }
    } catch (err) {
      logger.error('Erreur lors de la copie de l’analyse', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [analysisContent, handleCopy, t]);

  // Gestionnaire pour le long press
  const handleLongPress = useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      showContextMenu(message, { x: pageX, y: pageY });
      Vibration.vibrate(50);
      AccessibilityInfo.announceForAccessibility(t('contextMenu.opened'));
    },
    [showContextMenu, message, t],
  );

  // Fermeture du toast
  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // Retour anticipé si le contenu est invalide
  if (!analysisContent) {
    logger.error('Contenu d’analyse nutritionnelle invalide', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidNutritionAnalysis')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  const { analysis } = analysisContent;

  // Préparation des données pour NutritionChart
  const chartData = analysis.nutrients.map((nutrient) => ({
    nutrient: nutrient.name,
    value: nutrient.value,
    unit: nutrient.unit,
  }));

  // Rendu d’un item de menu pour FlatList
  const renderMenuItem = ({ item }: { item: Menu }) => (
    <TouchableOpacity
      style={[globalStyles.button, tw`p-sm mb-sm`]}
      onPress={() => {
        setSelectedMenu(item);
        setModalVisible(false);
        handleAddToMenu();
      }}
      accessibilityLabel={t('nutritionAnalysis.selectMenu', { menuName: item.foodName || item.typeRepas })}
    >
      <Text style={globalStyles.buttonText}>{item.foodName || item.typeRepas} ({item.date})</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle, tw`mb-md bg-[#9C27B0]`]}
      accessibilityLabel={t('nutritionAnalysis.container')}
      accessibilityHint={t('nutritionAnalysis.hint')}
      {...handleSwipe(() => onAction?.('delete', { id })).panHandlers}
    >
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        style={styles.touchableContainer}
        accessibilityLabel={t('nutritionAnalysis.touchable')}
        accessibilityHint={t('nutritionAnalysis.longPressHint')}
      >
        {/* En-tête */}
        <View style={[styles.header, tw`flex-${flexDirection}`]}>
          <MaterialIcons
            name="analytics"
            size={theme.fonts.sizes.large}
            color={theme.colors.textPrimary}
            accessibilityLabel={t('icons.nutritionAnalysis')}
          />
          <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
            {t('nutritionAnalysis.title', {
              recipeId: 'recipeId' in analysisContent ? analysisContent.recipeId : '',
            })}
          </Text>
        </View>

        {/* Résumé */}
        <View style={[styles.summary, tw`flex-${flexDirection} mb-md`]}>
          <View style={tw`flex-1`}>
            <Text style={globalStyles.textSmall}>
              {t('nutritionAnalysis.calories', { calories: analysis.calories })}
            </Text>
            <Text style={globalStyles.textSmall}>
              {t('nutritionAnalysis.dietaryFit', {
                fit: analysisContent.type === 'recipe_analysis' ? analysis.description : t('nutritionAnalysis.unknownDietaryFit'),
              })}
            </Text>
          </View>
        </View>

        {/* Graphique nutritionnel */}
        <CollapsibleCard
          title={t('nutritionAnalysis.chartTitle')}
          initiallyExpanded={false}
          style={tw`mb-md`}
        >
          <View style={tw`p-sm`}>
            <NutritionChart
              data={chartData}
              barColor={theme.colors.primary}
              backgroundColor={theme.colors.surface}
              labelColor={theme.colors.textPrimary}
            />
          </View>
        </CollapsibleCard>

        {/* Liste des nutriments */}
        <CollapsibleCard
          title={t('nutritionAnalysis.nutrients', { count: analysis.nutrients.length })}
          initiallyExpanded={!isNutrientsCollapsed}
          onToggle={() => setIsNutrientsCollapsed(!isNutrientsCollapsed)}
          style={tw`mb-md`}
        >
          <View style={tw`p-sm`}>
            {analysis.nutrients.map((nutrient) => (
              <View
                key={nutrient.id}
                style={[tw`flex-${flexDirection} mb-sm`, styles.item]}
                accessibilityLabel={t('nutritionAnalysis.nutrient', { name: nutrient.name })}
              >
                <Text style={globalStyles.textSmall}>
                  {`- ${nutrient.name}: ${nutrient.value} ${nutrient.unit}`}
                </Text>
              </View>
            ))}
          </View>
        </CollapsibleCard>

        {/* Actions */}
        <View style={[styles.actions, tw`flex-${flexDirection}`]}>
          {'recipeId' in analysisContent && analysisContent.recipeId && analysisContent.type === 'recipe_analysis' && (
            <TouchableOpacity
              style={[globalStyles.button, tw`flex-1 mr-sm`]}
              onPress={handleAddToRecipe}
              disabled={recipesLoading}
              accessibilityLabel={t('nutritionAnalysis.addToRecipe')}
              accessibilityHint={t('nutritionAnalysis.addToRecipeHint')}
            >
              <Text style={globalStyles.buttonText}>{t('nutritionAnalysis.addToRecipe')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={handleOpenMenuModal}
            disabled={menusLoading || historyLoading}
            accessibilityLabel={t('nutritionAnalysis.addToMenu')}
            accessibilityHint={t('nutritionAnalysis.addToMenuHint')}
          >
            <Text style={globalStyles.buttonText}>{t('nutritionAnalysis.addToMenu')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1 mr-sm`]}
            onPress={() => onAction?.('share', analysisContent)}
            accessibilityLabel={t('actions.share')}
            accessibilityHint={t('actions.shareHint')}
          >
            <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.button, tw`flex-1`]}
            onPress={handleCopyAnalysis}
            accessibilityLabel={t('contextMenu.copy')}
            accessibilityHint={t('contextMenu.copyHint')}
          >
            <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Modal de sélection de menu */}
      <ModalComponent
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          AccessibilityInfo.announceForAccessibility(t('nutritionAnalysis.menuModalClosed'));
        }}
        title={t('nutritionAnalysis.selectMenuTitle')}
      >
        <View style={tw`p-md`}>
          <Text style={globalStyles.text}>{t('nutritionAnalysis.selectExistingMenu')}</Text>
          <FlatList
            data={menus}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id}
            style={tw`max-h-48 mb-md`}
            accessibilityLabel={t('nutritionAnalysis.menuList')}
            accessibilityRole="list"
          />
          <Text style={[globalStyles.text, tw`mt-md`]}>{t('nutritionAnalysis.createNewMenu')}</Text>
          <Text style={globalStyles.textSmall}>{t('nutritionAnalysis.menuName')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-sm`]}>
            <TextInput
              value={newMenuName}
              onChangeText={setNewMenuName}
              placeholder={t('nutritionAnalysis.menuNamePlaceholder')}
              accessibilityLabel={t('nutritionAnalysis.menuName')}
            />
          </View>
          <Text style={globalStyles.textSmall}>{t('nutritionAnalysis.menuDate')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-sm`]}>
            <TextInput
              value={newMenuDate}
              onChangeText={setNewMenuDate}
              placeholder={t('nutritionAnalysis.menuDatePlaceholder')}
              accessibilityLabel={t('nutritionAnalysis.menuDate')}
            />
          </View>
          <Text style={globalStyles.textSmall}>{t('nutritionAnalysis.menuType')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-md`]}>
            <Picker
              selectedValue={newMenuType}
              onValueChange={(value) => setNewMenuType(value)}
              accessibilityLabel={t('nutritionAnalysis.menuType')}
            >
              <Picker.Item label={t('mealTypes.breakfast')} value="petit-déjeuner" />
              <Picker.Item label={t('mealTypes.lunch')} value="déjeuner" />
              <Picker.Item label={t('mealTypes.dinner')} value="dîner" />
              <Picker.Item label={t('mealTypes.snack')} value="collation" />
            </Picker>
          </View>
          <TouchableOpacity
            style={[globalStyles.button, tw`mt-md`]}
            onPress={handleCreateNewMenu}
            disabled={!newMenuName || !newMenuDate}
            accessibilityLabel={t('nutritionAnalysis.createMenu')}
          >
            <Text style={globalStyles.buttonText}>{t('nutritionAnalysis.createMenu')}</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>

      {/* Menu contextuel */}
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={handleCopyAnalysis}
            accessibilityLabel={t('contextMenu.copy')}
            accessibilityRole="menuitem"
          >
            <MaterialIcons name="content-copy" size={theme.fonts.sizes.medium} color={theme.colors.textPrimary} />
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
            <MaterialIcons name="share" size={theme.fonts.sizes.medium} color={theme.colors.textPrimary} />
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
            <MaterialIcons name="delete" size={theme.fonts.sizes.medium} color={theme.colors.error} />
            <Text style={conversationStyles.contextMenuText}>{t('contextMenu.delete')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Notification Toast */}
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

// Styles locaux
const styles = StyleSheet.create({
  touchableContainer: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  summary: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  item: {
    alignItems: 'center',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(NutritionAnalysisTemplate);
