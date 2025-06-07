import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface IconButtonProps {
  iconName: string;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: any;
  disabled?: boolean;
}

export const IconButton = ({ iconName, onPress, size = 24, color = '#ffffff', style, disabled = false }: IconButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
    >
      <Icon name={iconName} size={size} color={disabled ? '#666666' : color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
