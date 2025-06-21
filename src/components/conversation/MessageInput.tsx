// src/components/conversation/MessageInput.tsx

import React, { memo, useCallback, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  AccessibilityInfo,
  Image,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/helpers';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { globalStyles } from '../../styles/globalStyles';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (uri: string, mimeType: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendText, onSendImage }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSend = useCallback(() => {
    if (text.trim()) {
      onSendText(text.trim());
      setText('');
      AccessibilityInfo.announceForAccessibility(t('message.sent'));
    }
  }, [text, onSendText, t]);

  const pickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        const mimeType = result.assets[0].type || 'image/jpeg';
        setImageUri(uri);
        onSendImage(uri, mimeType);
        AccessibilityInfo.announceForAccessibility(t('imagePicker.imageSent'));
      }
    } catch (err) {
      logger.error('Error picking image', { error: getErrorMessage(err) });
      AccessibilityInfo.announceForAccessibility(t('imagePicker.error'));
    }
  }, [onSendImage, t]);

  const captureImage = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 1,
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        const mimeType = result.assets[0].type || 'image/jpeg';
        setImageUri(uri);
        onSendImage(uri, mimeType);
        AccessibilityInfo.announceForAccessibility(t('imagePicker.imageSent'));
      }
    } catch (err) {
      logger.error('Error capturing image', { error: getErrorMessage(err) });
      AccessibilityInfo.announceForAccessibility(t('imagePicker.error'));
    }
  }, [onSendImage, t]);

  const handleClearImage = useCallback(() => {
    setImageUri(null);
    AccessibilityInfo.announceForAccessibility(t('imagePicker.imageCleared'));
  }, [t]);

  return (
    <View style={[globalStyles.card, tw`flex-row items-center p-md`]}>
      {imageUri && (
        <View style={tw`mr-md`}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={tw`absolute top-0 right-0 p-xs`}
            onPress={handleClearImage}
            accessibilityLabel={t('imagePicker.clear')}
            accessibilityHint={t('imagePicker.clearHint')}
          >
            <MaterialIcons name="close" size={theme.fonts.sizes.medium} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      )}
      <TextInput
        style={[globalStyles.text, tw`flex-1 h-10`]}
        value={text}
        onChangeText={setText}
        placeholder={t('message.inputPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        accessibilityLabel={t('message.input')}
        accessibilityHint={t('message.inputHint')}
      />
      <TouchableOpacity
        style={tw`p-sm`}
        onPress={pickImage}
        accessibilityLabel={t('imagePicker.pick')}
        accessibilityHint={t('imagePicker.pickHint')}
      >
        <MaterialIcons name="photo-library" size={theme.fonts.sizes.large} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`p-sm`}
        onPress={captureImage}
        accessibilityLabel={t('imagePicker.capture')}
        accessibilityHint={t('imagePicker.captureHint')}
      >
        <MaterialIcons name="photo-camera" size={theme.fonts.sizes.large} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[globalStyles.button, tw`ml-sm`]}
        onPress={handleSend}
        disabled={!text.trim()}
        accessibilityLabel={t('message.send')}
        accessibilityHint={t('message.sendHint')}
      >
        <Text style={globalStyles.buttonText}>{t('message.send')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.small,
  },
});

export default memo(MessageInput);
