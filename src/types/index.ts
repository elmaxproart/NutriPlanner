// src/types/index.ts

import { PromptType } from '../services/prompts';

export interface ActionButton {
  type: string;
  label: string;
  iconName: string;
  iconLibrary: 'MaterialIcons' | 'FontAwesome' | 'Ionicons';
  onPress: () => void;
  color?: string;
  accessibilityLabel: string;
}

export interface TemplateComponentProps {
  message: any;
  promptType?: PromptType;
  interactionType: string;
  onAction?: (action: string, data: any) => void;
  id?: string;
}
