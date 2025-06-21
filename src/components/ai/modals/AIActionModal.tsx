import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AITemplate } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface TemplateCardProps {
  item: AITemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ item, isSelected, onSelect }) => {
  const { t } = useTranslation();
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (

      <TouchableOpacity
        style={[commonStyles.card, isSelected && styles.selectedCard]}
        onPress={() => onSelect(item.id)}
        accessibilityLabel={t(`templates.${item.id}.title`)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        testID={`template-card-${item.id}`}
      >
        <Animated.View style={animatedCardStyle}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.surface]}
            style={commonStyles.cardGradient}
          >
            <MaterialCommunityIcons
              name={item.iconName}
              size={30}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={commonStyles.cardTitle}>{t(`templates.${item.id}.title`)}</Text>
            <Text style={commonStyles.cardDescription}>{t(`templates.${item.id}.description`)}</Text>
            {isSelected && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.colors.primary}
                style={styles.checkIcon}
              />
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

  );
};

interface AIActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: AITemplate, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  templates?: AITemplate[];
  loading?: boolean;
  initialCategory?: string;
  initialSelectedTemplateId?: string;
  isFinalStep?: boolean;
}

const AIActionModal: React.FC<AIActionModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Choisir une action IA',
  templates = [],
  loading = false,
  initialCategory = '',
  initialSelectedTemplateId = '',
  isFinalStep = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [filteredTemplates, setFilteredTemplates] = useState<AITemplate[]>(templates);
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialSelectedTemplateId);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const dataToUse = useMemo(() => templates, [templates]);
  const categories = useMemo(
    () => ['Tout', ...new Set(dataToUse.map((template) => template.description))],
    [dataToUse],
  );

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      modalTranslateY.value = withTiming(0, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      AccessibilityInfo.announceForAccessibility(t('modal.opened', { title }));
      setSelectedCategory(initialCategory);
      setSelectedTemplateId(initialSelectedTemplateId);
      setFilteredTemplates(dataToUse);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedTemplateId(null);
      });
    }
  }, [visible, modalOpacity, modalTranslateY, initialCategory, initialSelectedTemplateId, dataToUse, t, title]);

  const filterTemplates = useCallback(() => {
    let filtered = dataToUse;
    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          t(`templates.${template.id}.title`).toLowerCase().includes(searchQuery.toLowerCase()) ||
          t(`templates.${template.id}.description`).toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCategory && selectedCategory !== 'Tout') {
      filtered = filtered.filter((template) => t(`templates.${template.id}.description`) === selectedCategory);
    }
    setFilteredTemplates(filtered);
  }, [searchQuery, selectedCategory, dataToUse, t]);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, filterTemplates]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleConfirm = useCallback(async () => {
    if (selectedTemplateId) {
      const template = dataToUse.find((te) => te.id === selectedTemplateId);
      if (template) {
        await onSelect(template, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(t('templates.selected', { title: t(`templates.${template.id}.title`) }));
      }
    }
  }, [selectedTemplateId, dataToUse, onSelect, isFinalStep, onClose, t]);

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              commonStyles.button,
              {
                marginRight: theme.spacing.sm,
                backgroundColor:
                  item === (selectedCategory || 'Tout')
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
            onPress={() => setSelectedCategory(item === 'Tout' ? '' : item)}
            accessibilityLabel={t('categories.filter', { category: item })}
            testID={`category-filter-${item}`}
          >
            <Text
              style={[
                commonStyles.buttonText,
                {
                  color:
                    item === (selectedCategory || 'Tout')
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryListContent}
      />
    </View>
  );

  const renderTemplate = ({ item }: { item: AITemplate }) => (
    <TemplateCard
      item={item}
      isSelected={item.id === selectedTemplateId}
      onSelect={setSelectedTemplateId}
    />
  );

  return (

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        accessible
        accessibilityLabel={t('modal.accessibilityLabel')}
        testID="ai-action-modal"
      >
        <View style={commonStyles.modalOverlay}>
          <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
            <TouchableOpacity
              style={commonStyles.closeModalButton}
              onPress={onClose}
              accessibilityLabel={t('modal.close')}
              testID="close-button"
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>

            <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
              {title}
            </Text>

            <TextInput
              style={commonStyles.searchInput}
              placeholder={t('modal.searchPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel={t('modal.searchAccessibilityLabel')}
              testID="search-input"
            />

            {renderCategoryFilter()}

            {isLoading ? (
              <View style={commonStyles.centeredContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={commonStyles.textSecondary}>{t('modal.loading')}</Text>
              </View>
            ) : filteredTemplates.length === 0 ? (
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>{t('modal.noActionsFound')}</Text>
              </View>
            ) : (
              <FlatList
                data={filteredTemplates}
                renderItem={renderTemplate}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.actionListContent}
                showsVerticalScrollIndicator={false}
                accessibilityLabel={t('modal.actionsListAccessibilityLabel')}
                testID="templates-list"
              />
            )}

            <TouchableOpacity
              style={[commonStyles.button, !selectedTemplateId && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={!selectedTemplateId}
              accessibilityLabel={t('modal.confirm')}
              testID="confirm-button"
            >
              <LinearGradient
                colors={
                  selectedTemplateId
                    ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                    : ['#666', '#666']
                }
                style={commonStyles.buttonGradient}
              >
                <Text style={commonStyles.buttonText}>{t('modal.confirm')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  icon: {
    marginBottom: theme.spacing.sm,
    alignSelf: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  actionListContent: {
    paddingBottom: theme.spacing.lg,
  },
  categoryFilterContainer: {
    marginVertical: theme.spacing.md,
  },
  categoryListContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AIActionModal;
