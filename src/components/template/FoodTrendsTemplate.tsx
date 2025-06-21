import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, FlatList, TextInput } from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage, formatDate } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import { TemplateProps, FoodTrendsContent, FoodTrend } from '../../types/messageTypes';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useMenus } from '../../hooks/useMenus';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useAuth } from '../../hooks/useAuth';
import { Menu, HistoriqueRepas, AiInteractionContent } from '../../constants/entities';
import { conversationStyles } from '../../styles/conversationStyles';
import { globalStyles } from '../../styles/globalStyles';
import CollapsibleCard from '../common/CollapsibleCard';
import ModalComponent from '../common/ModalComponent';
import ToastNotification from '../common/ToastNotification';
import { Picker } from '@react-native-picker/picker';

interface FoodTrendsTemplateProps extends TemplateProps {
  onAddToMenu?: (trendId: string, trendName: string) => void;
}

// Type guard for FoodTrendsContent
// TODO: Consider updating AiInteractionContent in entities.ts to include FoodTrendsContent for type safety.
const isFoodTrendsContent = (content: AiInteractionContent): content is FoodTrendsContent => {
  return (content as any).type === 'food_trends';
};

const FoodTrendsTemplate: React.FC<FoodTrendsTemplateProps> = ({
  message,
  onAction,
  id,
  onAddToMenu,
}) => {
  const { t, i18n } = useTranslation();
  const { menus, addMenu, fetchMenus, loading: menusLoading, error: menusError } = useMenus();
  const { addMealHistory, loading: historyLoading, error: historyError } = useMealHistory();
  const { userId } = useAuth();

  // Local states
  const [isTrendsCollapsed, setIsTrendsCollapsed] = useState<boolean>(true);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [newMenuName, setNewMenuName] = useState<string>('');
  const [newMenuDate, setNewMenuDate] = useState<string>(formatDate(new Date()));
  const [newMenuType, setNewMenuType] = useState<'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation'>('déjeuner');
  const [selectedTrend, setSelectedTrend] = useState<{ id: string; name: string } | null>(null);

  // Entry animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Swipe actions
  const [{ translateX }, { handleSwipe }] = useSwipeActions();
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Context menu
  const [
    { visible: contextVisible, position, animatedStyle: contextStyle },
    { showContextMenu, handleCopy, handleShare, handleDelete },
  ] = useContextMenu((messageId: string) => onAction?.('delete', { id: messageId }));

    const trendsContent = isFoodTrendsContent(message.content) ? message.content : null;

  // Action handlers
  const handleAddToMenu = useCallback(() => {
    try {
      if (!trendsContent || !selectedMenu || !selectedTrend) {
        setToastMessage(t('foodTrends.missingData'));
        setToastType('error');
        setToastVisible(true);
        return;
      }
      setModalVisible(false);

      const menuId = selectedMenu.id;
      const historyEntry: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        menuId,
        date: newMenuDate,
        typeRepas: selectedMenu.typeRepas,
        notes: `Tendance alimentaire ajoutée: ${selectedTrend.name}`,
      };

      addMealHistory(historyEntry)
        .then((historyId) => {
          if (historyId) {
            onAddToMenu?.(selectedTrend.id, selectedTrend.name);
            setToastMessage(t('foodTrends.addedToMenu', { menuName: selectedMenu.foodName || selectedMenu.typeRepas }));
            setToastType('success');
            setToastVisible(true);
            AccessibilityInfo.announceForAccessibility(
              t('foodTrends.addedToMenu', { menuName: selectedMenu.foodName || selectedMenu.typeRepas }),
            );
          } else {
            throw new Error('Failed to add meal history');
          }
        })
        .catch((err) => {
          logger.error('Error adding to menu', { error: getErrorMessage(err) });
          setToastMessage(t('foodTrends.addToMenuError'));
          setToastType('error');
          setToastVisible(true);
        })
        .finally(() => {
          setSelectedTrend(null);
        });
    } catch (err) {
      logger.error('Error adding to menu', { error: getErrorMessage(err) });
      setToastMessage(t('foodTrends.addToMenuError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [trendsContent, selectedMenu, selectedTrend, newMenuDate, addMealHistory, onAddToMenu, t]);

  const handleCreateNewMenu = useCallback(() => {
    try {
      if (!trendsContent || !newMenuName || !userId || !selectedTrend) {
        setToastMessage(t('foodTrends.missingData'));
        setToastType('error');
        setToastVisible(true);
        return;
      }
      setModalVisible(false);

      const newMenu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
        createurId: userId,
        date: newMenuDate,
        typeRepas: newMenuType,
        recettes: [],
        foodName: newMenuName,
        description: `Menu créé avec la tendance alimentaire: ${selectedTrend.name}`,
        coutTotalEstime: 0,
        statut: 'planifié',
      };

      addMenu(newMenu)
        .then((menuId) => {
          if (menuId) {
            const historyEntry: Omit<HistoriqueRepas, 'id' | 'dateCreation' | 'dateMiseAJour'> = {
              menuId,
              date: newMenuDate,
              typeRepas: newMenuType,
              notes: `Tendance alimentaire ajoutée: ${selectedTrend.name}`,
            };

            return addMealHistory(historyEntry).then((historyId) => ({ menuId, historyId }));
          }
          throw new Error('Failed to create menu');
        })
        .then(({ historyId }) => {
          if (historyId) {
            fetchMenus();
            onAddToMenu?.(selectedTrend.id, selectedTrend.name);
            setToastMessage(t('foodTrends.addedToNewMenu', { menuName: newMenuName }));
            setToastType('success');
            setToastVisible(true);
            AccessibilityInfo.announceForAccessibility(t('foodTrends.addedToNewMenu', { menuName: newMenuName }));
          } else {
            throw new Error('Failed to add meal history');
          }
        })
        .catch((err) => {
          logger.error('Error creating new menu', { error: getErrorMessage(err) });
          setToastMessage(t('foodTrends.addToMenuError'));
          setToastType('error');
          setToastVisible(true);
        })
        .finally(() => {
          setSelectedTrend(null);
        });
    } catch (err) {
      logger.error('Error creating new menu', { error: getErrorMessage(err) });
      setToastMessage(t('foodTrends.addToMenuError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [trendsContent, newMenuName, newMenuDate, newMenuType, userId, selectedTrend, addMenu, addMealHistory, fetchMenus, onAddToMenu, t]);

  const handleCopyTrends = useCallback(() => {
    try {
      if (!trendsContent) {
        setToastMessage(t('foodTrends.missingData'));
        setToastType('error');
        setToastVisible(true);
        return;
      }
      const text =
        `${t('foodTrends.title')}\n` +
        trendsContent.trends
          .map(
            (trend) =>
              `- ${trend.name}: ${trend.description} (${t('foodTrends.popularity', { popularity: trend.popularity })}%)`,
          )
          .join('\n');
      copyTextToClipboard(text)
        .then(() => {
          setToastMessage(t('contextMenu.copySuccess'));
          setToastType('success');
          setToastVisible(true);
          handleCopy();
        })
        .catch((err) => {
          logger.error('Error copying trends', { error: getErrorMessage(err) });
          setToastMessage(t('contextMenu.copyError'));
          setToastType('error');
          setToastVisible(true);
        });
    } catch (err) {
      logger.error('Error copying trends', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [trendsContent, handleCopy, t]);

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

  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);


  // Animation effect
  useEffect(() => {
    if (!trendsContent) {
      return;
    }
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('foodTrends.loaded'));
    } catch (err) {
      logger.error('Error applying animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, trendsContent, t]);

  // Error handling from hooks
  useEffect(() => {
    if (menusError || historyError) {
      setToastMessage(menusError || historyError || t('errors.generic'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [menusError, historyError, t]);

  // Render popularity stars
  const renderPopularityStars = useCallback(
    (popularity: number) => {
      const stars = Math.round(popularity / 20); // Convert 0-100 to 0-5 stars
      return (
        <View style={tw`flex-row`}>
          {[...Array(5)].map((_, index) => (
            <MaterialIcons
              key={index}
              name={index < stars ? 'star' : 'star-border'}
              size={theme.fonts.sizes.small}
              color={theme.colors.warning}
              accessibilityLabel={t('foodTrends.star', { number: index + 1 })}
            />
          ))}
        </View>
      );
    },
    [t],
  );

    const handleOpenMenuModal = useCallback(
    (trend: { id: string; name: string }) => {
      setSelectedTrend(trend);
      setModalVisible(true);
      AccessibilityInfo.announceForAccessibility(t('foodTrends.menuModalOpened'));
    },
    [t],
  );

  // Render trend item for FlatList
  const renderTrendItem = useCallback(
    ({ item }: { item: FoodTrend }) => (
      <View
        style={[tw`mb-md`, styles.item]}
        accessibilityLabel={t('foodTrends.trend', { name: item.name })}
      >
        <View style={tw`flex-1`}>
          <Text style={[globalStyles.textBold, tw`mb-xs`]}>{item.name}</Text>
          <Text style={[globalStyles.textSmall, tw`mb-sm`]}>{item.description}</Text>
          <View style={tw`flex-row items-center`}>
            <Text style={[globalStyles.textSmall, tw`mr-sm`]}>
              {t('foodTrends.popularity', { popularity: item.popularity })}
            </Text>
            {renderPopularityStars(item.popularity)}
          </View>
        </View>
        <TouchableOpacity
          style={[globalStyles.button, tw`mt-sm`]}
          onPress={() => handleOpenMenuModal({ id: item.id, name: item.name })}
          accessibilityLabel={t('foodTrends.addToMenu', { name: item.name })}
          accessibilityHint={t('foodTrends.addToMenuHint')}
          accessibilityRole="button"
        >
          <Text style={globalStyles.buttonText}>{t('foodTrends.addToMenu')}</Text>
        </TouchableOpacity>
      </View>
    ),
    [t, renderPopularityStars, handleOpenMenuModal],
  );



  // Render menu item for FlatList
  const renderMenuItem = useCallback(
    ({ item }: { item: Menu }) => (
      <TouchableOpacity
        style={[globalStyles.button, tw`p-sm mb-sm`]}
        onPress={() => {
          setSelectedMenu(item);
          setModalVisible(false);
          handleAddToMenu();
        }}
        accessibilityLabel={t('foodTrends.selectMenu', { menuName: item.foodName || item.typeRepas })}
        accessibilityRole="button"
      >
        <Text style={globalStyles.buttonText}>{item.foodName || item.typeRepas} ({item.date})</Text>
      </TouchableOpacity>
    ),
    [t, handleAddToMenu],
  );

  // Early return for invalid content
  if (!trendsContent) {
    logger.error('Invalid food trends content', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidFoodTrends')}
          type="error"
          onDismiss={handleDismissToast}
          duration={5000}
        />
      </View>
    );
  }

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const { trends } = trendsContent;

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle as ViewStyle]}
      onTouchStart={handleLongPress}
      accessibilityLabel={t('foodTrends.container')}
      accessibilityHint={t('foodTrends.hint')}
      accessibilityRole="summary"
      {...handleSwipe(() => handleAction('delete', { id })).panHandlers}
    >
      {/* Header */}
      <View style={[styles.header, tw`flex-${flexDirection}`]}>
        <MaterialIcons
          name="trending-up"
          size={theme.fonts.sizes.large}
          color={theme.colors.textPrimary}
          accessibilityLabel={t('icons.foodTrends')}
        />
        <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
          {t('foodTrends.title')}
        </Text>
      </View>

      {/* Trends List */}
      <CollapsibleCard
        title={t('foodTrends.trends', { count: trends.length })}
        initiallyExpanded={!isTrendsCollapsed}
        onToggle={() => setIsTrendsCollapsed(!isTrendsCollapsed)}
        style={tw`mb-md`}
      >
        <FlatList
          data={trends}
          renderItem={renderTrendItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          accessibilityLabel={t('foodTrends.trendsList')}
          contentContainerStyle={tw`p-sm`}
        />
      </CollapsibleCard>

      {/* Main Actions */}
      <View style={[styles.actions, tw`flex-${flexDirection}`]}>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() =>
            handleOpenMenuModal({ id: trends[0]?.id || 'default', name: trends[0]?.name || 'Tendances' })
          }
          disabled={menusLoading || historyLoading || trends.length === 0}
          accessibilityLabel={t('actions.addToMenu')}
          accessibilityHint={t('actions.addToMenuHint')}
          accessibilityRole="button"
        >
          <Text style={globalStyles.buttonText}>{t('actions.addToMenu')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() => handleAction('share', trendsContent)}
          accessibilityLabel={t('actions.share')}
          accessibilityHint={t('actions.shareHint')}
          accessibilityRole="button"
        >
          <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1`]}
          onPress={handleCopyTrends}
          accessibilityLabel={t('contextMenu.copy')}
          accessibilityHint={t('contextMenu.copyHint')}
          accessibilityRole="button"
        >
          <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Selection Modal */}
      <ModalComponent
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedTrend(null);
          AccessibilityInfo.announceForAccessibility(t('foodTrends.menuModalClosed'));
        }}
        title={t('foodTrends.selectMenuTitle')}
      >
        <View style={tw`p-md`}>
          <Text style={globalStyles.text}>{t('foodTrends.selectExistingMenu')}</Text>
          {menus.length > 0 ? (
            <FlatList
              data={menus}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id}
              style={tw`max-h-48 mb-md`}
              accessibilityLabel={t('foodTrends.menuList')}
              accessibilityRole="list"
            />
          ) : (
            <Text style={[globalStyles.textSmall, tw`mb-md`]}>{t('foodTrends.noMenus')}</Text>
          )}
          <Text style={[globalStyles.text, tw`mt-md`]}>{t('foodTrends.createNewMenu')}</Text>
          <Text style={globalStyles.textSmall}>{t('foodTrends.menuName')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-sm`]}>
            <TextInput
              value={newMenuName}
              onChangeText={setNewMenuName}
              placeholder={t('foodNames.menuPlaceholder')}
              accessibilityLabel={t('foodTrends.menuName')}
              style={styles.input}
            />
          </View>
          <Text style={globalStyles.textSmall}>{t('foodTrends.menuDate')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-sm`]}>
            <TextInput
              value={newMenuDate}
              onChangeText={setNewMenuDate}
              placeholder={t('foodTrends.placeholderDate')}
              accessibilityLabel={t('foodTrends.menuDate')}
              style={styles.input}
            />
          </View>
          <Text style={globalStyles.textSmall}>{t('foodTrends.menuType')}</Text>
          <View style={[tw`border border-gray-300 rounded p-2 mb-md`]}>
            <Picker
              selectedValue={newMenuType}
              onValueChange={(value) => setNewMenuType(value)}
              accessibilityLabel={t('foodTrends.menuType')}
              style={styles.picker}
            >
              <Picker.Item label={t('mealTypes.breakfast')} value="petit-déjeuner" />
              <Picker.Item label={t('mealTypes.lunch')} value="déjeuner" />
              <Picker.Item label={t('mealTypes.dinner')} value="dîner" />
              <Picker.Item label={t('mealTypes.snack')} value="collation" />
            </Picker>
          </View>
          <TouchableOpacity
            style={[
              globalStyles.button,
              tw`mt-md`,
              !newMenuName || !newMenuDate ? globalStyles.buttonDisabled : {},
            ]}
            onPress={handleCreateNewMenu}
            disabled={!newMenuName || !newMenuDate}
            accessibilityLabel={t('foodTrends.createMenu')}
            accessibilityRole="button"
          >
            <Text style={globalStyles.buttonText}>{t('foodTrends.createMenu')}</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>

      {/* Context Menu */}
      {contextVisible && (
        <Animated.View
          style={[conversationStyles.contextMenu, contextStyle, { top: position.y, left: position.x }]}
          accessibilityLabel={t('contextMenu.container')}
          accessibilityHint={t('contextMenu.hint')}
          accessibilityRole="menu"
        >
          <TouchableOpacity
            style={conversationStyles.contextMenuItem}
            onPress={handleCopyTrends}
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

      {/* Toast Notification */}
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
  item: {
    paddingHorizontal: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  input: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
  },
  picker: {
    color: theme.colors.textPrimary,
  },
});

export default memo(FoodTrendsTemplate);
