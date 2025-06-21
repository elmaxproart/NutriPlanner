// src/components/conversation/ActionButtons.tsx

import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ActionButtonsProps {
  visible: boolean;
  onCopy: () => Promise<void>;
  onShare: () => Promise<void>;
  onDelete: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  visible,
  onCopy,
  onShare,
  onDelete,
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
        AccessibilityInfo.announceForAccessibility(t(`actions.${action}Success`));
      } catch (err) {
        logger.error(`Error performing ${action}`, { error: getErrorMessage(err) });
        AccessibilityInfo.announceForAccessibility(t(`actions.${action}Error`));
      }
    },
    [onCopy, onShare, onDelete, t],
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={[tw`flex-row justify-end mt-sm`]}>
      <TouchableOpacity
        style={tw`p-sm`}
        onPress={() => handleAction('copy')}
        accessibilityLabel={t('actions.copy')}
      >
        <MaterialIcons
          name="content-copy"
          size={theme.fonts.sizes.medium}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`p-sm`}
        onPress={() => handleAction('share')}
        accessibilityLabel={t('actions.share')}
      >
        <MaterialIcons name="share" size={theme.fonts.sizes.medium} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`p-sm`}
        onPress={() => handleAction('delete')}
        accessibilityLabel={t('actions.delete')}
      >
        <MaterialIcons name="delete" size={theme.fonts.sizes.medium} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );
};

export default memo(ActionButtons);
