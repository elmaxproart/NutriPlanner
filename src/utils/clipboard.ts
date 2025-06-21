// src/utils/clipboard.ts

import Clipboard from '@react-native-clipboard/clipboard';
import { AccessibilityInfo } from 'react-native';

interface ClipboardResult {
  success: boolean;
  message: string;
}

export const copyTextToClipboard = async (text: string): Promise<ClipboardResult> => {
  try {
    await Clipboard.setString(text);
    AccessibilityInfo.announceForAccessibility('Texte copié dans le presse-papiers');
    return { success: true, message: 'Texte copié!' };
  } catch (error) {
    console.error('Erreur lors de la copie du texte:', error);
    AccessibilityInfo.announceForAccessibility('Erreur lors de la copie du texte');
    return { success: false, message: 'Erreur lors de la copie' };
  }
};

export const copyImageUrlToClipboard = async (url: string): Promise<ClipboardResult> => {
  try {
    await Clipboard.setString(url);
    AccessibilityInfo.announceForAccessibility('URL de l’image copiée dans le presse-papiers');
    return { success: true, message: 'URL de l’image copiée!' };
  } catch (error) {
    console.error('Erreur lors de la copie de l’URL:', error);
    AccessibilityInfo.announceForAccessibility('Erreur lors de la copie de l’URL de l’image');
    return { success: false,
      message: 'Erreur lors de la copie de l’URL' };
  }
};
