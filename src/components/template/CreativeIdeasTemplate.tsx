// CreativeIdeasTemplate.tsx
// Composant pour afficher les idées créatives générées par l'IA dans un format interactif et accessible.

import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, Vibration, FlatList, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { tw } from '../../styles/tailwind';
import { globalStyles } from '../../styles/globalStyles';
import { conversationStyles } from '../../styles/conversationStyles';
import { theme } from '../../styles/theme';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import { useContextMenu } from '../../hooks/useContextMenu';
import { TemplateProps, CreativeIdeasContent } from '../../types/messageTypes';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import { copyTextToClipboard } from '../../utils/clipboard';
import CollapsibleCard from '../common/CollapsibleCard';
import ToastNotification from '../common/ToastNotification';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { templateConfig } from '../../constants/templateConfig';

interface CreativeIdeasTemplateProps extends TemplateProps {}

// Composant principal pour afficher les idées créatives
const CreativeIdeasTemplate: React.FC<CreativeIdeasTemplateProps> = ({
  message,
  onAction,
  id,
  interactionType,
}) => {
  const { t, i18n } = useTranslation();

  // États locaux
  const [isContentCollapsed, setIsContentCollapsed] = useState<boolean>(true);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Animations d'entrée
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
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
  const content = message.content as CreativeIdeasContent;
  const ideasContent = content.type === 'creative_ideas' ? content : null;

  // Effet d'animation à l'entrée
  useEffect(() => {
    if (!ideasContent) {return;}
    try {
      opacity.value = withTiming(1, { duration: theme.animation.duration });
      translateY.value = withTiming(0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(t('creativeIdeas.loaded'));
    } catch (err) {
      logger.error('Erreur lors de l’animation', { error: getErrorMessage(err) });
      setToastMessage(t('errors.animationFailed'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [opacity, translateY, ideasContent, t]);

  // Gestionnaire pour copier le texte
  const handleCopyText = useCallback(async () => {
    try {
      if (ideasContent) {
        const text = ideasContent.ideas
          .map((idea) => `${t('creativeIdeas.idea')}: ${idea.name}\n${t('creativeIdeas.description')}: ${idea.description}`)
          .join('\n\n');
        await copyTextToClipboard(text);
        setToastMessage(t('contextMenu.copySuccess'));
        setToastType('success');
        setToastVisible(true);
        await handleCopy();
        AccessibilityInfo.announceForAccessibility(t('contextMenu.copySuccess'));
      }
    } catch (err) {
      logger.error('Erreur lors de la copie', { error: getErrorMessage(err) });
      setToastMessage(t('contextMenu.copyError'));
      setToastType('error');
      setToastVisible(true);
    }
  }, [ideasContent, handleCopy, t]);

  // Gestionnaire des actions
  const handleAction = useCallback(
    (action: string, data: any) => {
      try {
        onAction?.(action, data);
        setToastMessage(t(`actions.${action}Success`));
        setToastType('success');
        setToastVisible(true);
        AccessibilityInfo.announceForAccessibility(t(`actions.${action}`));
      } catch (err) {
        logger.error(`Erreur lors de l’action ${action}`, { error: getErrorMessage(err) });
        setToastMessage(t(`actions.${action}Error`));
        setToastType('error');
        setToastVisible(true);
      }
    },
    [onAction, t],
  );

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

  // Retour anticipé si le contenu est invalide
  if (!ideasContent) {
    logger.error('Contenu d’idées créatives invalide', { id });
    return (
      <View style={globalStyles.card}>
        <ToastNotification
          message={t('errors.invalidCreativeIdeasMessage')}
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

  // Icône basée sur le type d’interaction
  const iconName = templateConfig[interactionType]?.iconName || 'lightbulb-outline';

  // Rendu d’une idée individuelle
  const renderIdea = ({ item, index }: { item: { name: string; description: string }; index: number }) => (
    <CollapsibleCard
      title={`${t('creativeIdeas.idea')} ${index + 1}: ${item.name}`}
      initiallyExpanded={index === 0}
      style={tw`mb-sm`}
    >
      <MarkdownRenderer
        content={item.description}
        style={tw`p-sm`}
        textStyle={globalStyles.text}
      />
    </CollapsibleCard>
  );

  return (
    <Animated.View
      style={[globalStyles.card, animatedStyle, swipeAnimatedStyle]}
      onTouchStart={handleLongPress}
      accessibilityLabel={t('creativeIdeas.container')}
      accessibilityHint={t('creativeIdeas.hint')}
      accessibilityRole="summary"
      {...handleSwipe(() => handleAction('delete', { id })).panHandlers}
    >
      {/* En-tête */}
      <View style={[styles.header, tw`flex-${flexDirection}`]}>
        <MaterialIcons
          name={iconName}
          size={theme.fonts.sizes.large}
          color={theme.colors.textPrimary}
          accessibilityLabel={t(`icons.${iconName}`)}
        />
        <Text style={[globalStyles.title, tw`ml-sm flex-1`]} numberOfLines={2}>
          {t('creativeIdeas.title')}
        </Text>
      </View>

      {/* Liste des idées */}
      <CollapsibleCard
        title={t('creativeIdeas.ideas')}
        initiallyExpanded={!isContentCollapsed}
        onToggle={() => setIsContentCollapsed(!isContentCollapsed)}
        style={tw`mb-md`}
      >
        <FlatList
          data={ideasContent.ideas}
          renderItem={renderIdea}
          keyExtractor={(item, index) => `${id}-idea-${index}`}
          style={tw`p-sm`}
          accessibilityLabel={t('creativeIdeas.list')}
        />
      </CollapsibleCard>

      {/* Actions */}
      <View style={[styles.actions, tw`flex-${flexDirection}`]}>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1 mr-sm`]}
          onPress={() => handleAction('share', {
            text: ideasContent.ideas
              .map((idea) => `${t('creativeIdeas.idea')}: ${idea.name}\n${t('creativeIdeas.description')}: ${idea.description}`)
              .join('\n\n'),
          })}
          accessibilityLabel={t('actions.share')}
          accessibilityHint={t('actions.shareHint')}
        >
          <Text style={globalStyles.buttonText}>{t('actions.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.button, tw`flex-1`]}
          onPress={handleCopyText}
          accessibilityLabel={t('contextMenu.copy')}
          accessibilityHint={t('contextMenu.copyHint')}
        >
          <Text style={globalStyles.buttonText}>{t('contextMenu.copy')}</Text>
        </TouchableOpacity>
      </View>

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
            onPress={handleCopyText}
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
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});

export default memo(CreativeIdeasTemplate);
