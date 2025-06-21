// src/hooks/useContextMenu.ts

import { useState, useCallback } from 'react';
import { Share, AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { copyTextToClipboard, copyImageUrlToClipboard } from '../utils/clipboard';
import { AiInteraction } from '../constants/entities';

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  message: AiInteraction | null;
  animatedStyle: any; // Style animé pour Reanimated
}

interface ContextMenuActions {
  showContextMenu: (message: AiInteraction, position: { x: number; y: number }) => void;
  hideContextMenu: () => void;
  handleCopy: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleDelete: () => void;
}

export const useContextMenu = (onDelete: (messageId: string) => void): [ContextMenuState, ContextMenuActions] => {
  const [state, setState] = useState<Omit<ContextMenuState, 'animatedStyle'>>({ visible: false, position: { x: 0, y: 0 }, message: null });
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }],
  }));

  const showContextMenu = useCallback((message: AiInteraction, position: { x: number; y: number }) => {
    setState({ visible: true, position, message });
    opacity.value = withTiming(1, { duration: 200 });
    AccessibilityInfo.announceForAccessibility('Menu contextuel ouvert');
  }, [opacity]);

  const hideContextMenu = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 }, () => {
      setState({ visible: false, position: { x: 0, y: 0 }, message: null });
    });
  }, [opacity]);

  const handleCopy = useCallback(async () => {
    if (!state.message) {return;}
    const content = state.message.content;
    try {
      const result = content.type === 'image'
        ? await copyImageUrlToClipboard(content.uri)
        : await copyTextToClipboard(typeof content === 'string' ? content : JSON.stringify(content));
      AccessibilityInfo.announceForAccessibility(result.success ? 'Contenu copié' : 'Erreur lors de la copie');
    } catch (error) {
      console.error('Erreur de copie:', error);
    }
    hideContextMenu();
  }, [state.message, hideContextMenu]);

  const handleShare = useCallback(async () => {
    if (!state.message) {return;}
    const content = state.message.content;
    try {
      const message = typeof content === 'string' ? content : content.type === 'image' ? content.uri : JSON.stringify(content);
      await Share.share({ message });
      AccessibilityInfo.announceForAccessibility('Contenu partagé');
    } catch (error) {
      console.error('Erreur de partage:', error);
      AccessibilityInfo.announceForAccessibility('Erreur lors du partage');
    }
    hideContextMenu();
  }, [state.message, hideContextMenu]);

  const handleDelete = useCallback(() => {
    if (state.message) {
      onDelete(state.message.id);
      AccessibilityInfo.announceForAccessibility('Message supprimé');
    }
    hideContextMenu();
  }, [state.message, onDelete, hideContextMenu]);

  return [
    { ...state, animatedStyle },
    { showContextMenu, hideContextMenu, handleCopy, handleShare, handleDelete },
  ];
};
