// src/components/conversation/ContextMenu.tsx

import React, { memo, useCallback } from 'react';
import {  TouchableOpacity, Text, AccessibilityInfo, Animated } from 'react-native';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AiInteraction } from '../../constants/entities';
import { conversationStyles } from '../../styles/conversationStyles';

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  message: AiInteraction | null;
  animatedStyle: any;
  onCopy: () => Promise<void>;
  onShare: () => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  position,
  message,
  animatedStyle,
  onCopy,
  onShare,
  onDelete,
  onClose,
}) => {
  const { t } = useTranslation();

  const handleAction = useCallback(
    async (action: 'copy' | 'share' | 'delete') => {
      try {
        switch (action) {
          case 'copy':
            await onCopy();
            break;
          case 'share':
            await onShare();
            break;
          case 'delete':
            onDelete();
            break;
        }
        AccessibilityInfo.announceForAccessibility(t(`contextMenu.${action}Success`));
      } catch (err) {
        logger.error(`Error performing ${action}`, { error: getErrorMessage(err) });
        AccessibilityInfo.announceForAccessibility(t(`contextMenu.${action}Error`));
      } finally {
        onClose();
      }
    },
    [onCopy, onShare, onDelete, onClose, t],
  );

  if (!visible || !message) {
    return null;
  }

  return (
    <Animated.View
      style={[conversationStyles.contextMenu, animatedStyle, { top: position.y, left: position.x }]}
      accessibilityLabel={t('contextMenu.container')}
      accessibilityHint={t('contextMenu.hint')}
    >
      <TouchableOpacity
        style={conversationStyles.contextMenuItem}
        onPress={() => handleAction('copy')}
        accessibilityLabel={t('contextMenu.copy')}
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
        onPress={() => handleAction('share')}
        accessibilityLabel={t('contextMenu.share')}
      >
        <MaterialIcons name="share" size={theme.fonts.sizes.medium} color={theme.colors.textPrimary} />
        <Text style={conversationStyles.contextMenuText}>{t('contextMenu.share')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={conversationStyles.contextMenuItem}
        onPress={() => handleAction('delete')}
        accessibilityLabel={t('contextMenu.delete')}
      >
        <MaterialIcons name="delete" size={theme.fonts.sizes.medium} color={theme.colors.textPrimary} />
        <Text style={conversationStyles.contextMenuText}>{t('contextMenu.delete')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(ContextMenu);
