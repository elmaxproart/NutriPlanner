import React from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, KeyboardTypeOptions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface InputProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  error?: string;
  style?: any;
  inputStyle?: any;
  iconName?: string;
  iconPosition?: 'left' | 'right'; // Position de l'icône
  iconColor?: string; // Couleur de l'icône
  iconSize?: number; // Taille de l'icône
  onIconPress?: () => void; // Action au clic sur l'icône
  iconStyle?: any; // Style personnalisé pour l'icône
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean; // Champ sécurisé (mot de passe)
  multiline?: boolean; // Champ multiligne
  numberOfLines?: number; // Nombre de lignes pour multiline
  editable?: boolean; // Champ éditable ou non
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; // Capitalisation automatique
  autoCorrect?: boolean; // Correction automatique
}

export const Input = ({
  value,
  onChangeText,
  placeholder,
  error,
  style,
  inputStyle,
  iconName,
  iconPosition = 'right',
  iconColor = '#b0b0b0',
  iconSize = 20,
  onIconPress,
  iconStyle,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  autoCapitalize = 'sentences',
  autoCorrect = true,
}: InputProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, error && styles.inputErrorContainer]}>
        {iconName && iconPosition === 'left' && (
          <TouchableOpacity
            onPress={onIconPress}
            disabled={!onIconPress}
            style={[styles.iconContainer, styles.iconLeft]}
          >
            <Icon name={iconName} size={iconSize} color={iconColor} style={iconStyle} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            iconName && iconPosition === 'left' && styles.inputWithLeftIcon,
            iconName && iconPosition === 'right' && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#b0b0b0"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {iconName && iconPosition === 'right' && (
          <TouchableOpacity
            onPress={onIconPress}
            disabled={!onIconPress}
            style={[styles.iconContainer, styles.iconRight]}
          >
            <Icon name={iconName} size={iconSize} color={iconColor} style={iconStyle} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  inputErrorContainer: {
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputWithLeftIcon: {
    paddingLeft: 5,
  },
  inputWithRightIcon: {
    paddingRight: 5,
  },
  iconContainer: {
    padding: 10,
  },
  iconLeft: {
    marginRight: 5,
  },
  iconRight: {
    marginLeft: 5,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 5,
  },
});
