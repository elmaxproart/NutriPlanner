// src/components/common/SingleTemplatePreview.tsx
import React, { memo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { templateConfig } from '../../constants/templateConfig';
import { PromptType } from '../../services/prompts';
import { AiInteractionType, AiInteraction } from '../../constants/entities';
import TemplateFactory from '../template/TemplateFactory';
import { theme } from '../../styles/theme';
import { AccessibilityInfo, findNodeHandle } from 'react-native';
import analytics from '../../utils/helpers';

const { width } = Dimensions.get('window');
const TEMPLATE_CARD_WIDTH = width * 0.85;
const TEMPLATE_CARD_MARGIN = theme.spacing.sm;

interface SingleTemplatePreviewProps {
  interaction: AiInteraction;
  promptType?: PromptType;
  interactionType: AiInteractionType;
  onPress: () => void;
  isDarkMode: boolean;
  index: number;
}

const SingleTemplatePreview: React.FC<SingleTemplatePreviewProps> = memo(
  ({ interaction, promptType, interactionType, onPress, isDarkMode, index }) => {
    const { t } = useTranslation();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const ref = useRef<View>(null);

    // Animation for card appearance
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    useEffect(() => {
      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 500 });
      }, index * 100);
      return () => clearTimeout(timeout);
    }, [opacity, index]);

    // Handle press interactions for animation
    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 20, stiffness: 200 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    };

    // Get template configuration
    const config = templateConfig[promptType || interactionType] || {
      iconName: 'help-circle',
      backgroundColor: theme.colors.primary,
      animationType: 'fade',
    };
    const titleKey = promptType
      ? `templates.${promptType}.title`
      : `templates.${interactionType}.title`;

    // Accessibility focus handler
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
        onPress={() => {
          onPress();
          analytics.track('SingleTemplate_Pressed', { interactionId: interaction.id, promptType, interactionType });
        }}
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
                message={interaction}
                promptType={promptType}
                interactionType={interactionType}
                id={interaction.id}
              />
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  templateCard: {
    marginHorizontal: TEMPLATE_CARD_MARGIN,
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    minHeight: 300,
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
    minHeight: 200,
    maxHeight: 400,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
  },
});

export default SingleTemplatePreview;
