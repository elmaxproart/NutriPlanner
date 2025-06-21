// src/styles/globalStyles.ts

import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
    elevation: theme.elevation.medium,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  text: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    lineHeight: 22,
  },
  textBold: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
  },
  textSmall: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.title,
    letterSpacing: 0.8,
  },
  headline: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.headline,
    letterSpacing: 1.2,
  },
  button: {
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.xl,
    elevation: theme.elevation.high,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
});
