// TemplateFactory.tsx
// Usine pour instancier le composant de template approprié en fonction du type d’interaction.

import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { getTemplate } from '../../constants/templateConfig';
import { PromptType } from '../../services/prompts';
import { AiInteraction, AiInteractionType } from '../../constants/entities';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { theme } from '../../styles/theme';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';

interface TemplateFactoryProps {
  message: AiInteraction;
  promptType?: PromptType;
  interactionType: AiInteractionType;
  onAction?: (action: string, data: any) => void;
  id: string;
}

// Composant principal pour instancier le template approprié
const TemplateFactory: React.FC<TemplateFactoryProps> = ({
  message,
  promptType,
  interactionType,
  onAction,
  id,
}) => {
  // Récupération de la configuration du template
  const templateConfig = useMemo(
    () => getTemplate(promptType, interactionType),
    [promptType, interactionType],
  );

  const { component: TemplateComponent, animationType } = templateConfig;

  // Gestion des animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animationType === 'slide' ? 50 : 0);
  const scale = useSharedValue(animationType === 'pop' ? 0.8 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Application des animations à l’entrée
  React.useEffect(() => {
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      if (animationType === 'slide') {
        translateY.value = withTiming(0, { duration: theme.animation.duration });
      }
      if (animationType === 'pop') {
        scale.value = withTiming(1, { duration: theme.animation.duration });
      }
    } catch (err) {
      logger.error('Erreur lors de l’animation', { error: getErrorMessage(err) });
    }
  }, [opacity, translateY, scale, animationType]);

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: templateConfig.backgroundColor }, animatedStyle]}
      accessibilityLabel={`Template ${templateConfig.id}`}
    >
      <TemplateComponent
        message={message}
        promptType={promptType}
        interactionType={interactionType}
        onAction={onAction}
        id={id}
      />
    </Animated.View>
  );
};

// Styles locaux
const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    marginVertical: theme.spacing.sm,
  },
});

export default memo(TemplateFactory);
