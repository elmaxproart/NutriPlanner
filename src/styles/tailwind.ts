// src/styles/tailwind.ts

import { create } from 'twrnc';
import { theme } from './theme';

export const tw = create({
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        textPrimary: theme.colors.textPrimary,
        textSecondary: theme.colors.textSecondary,
        error: theme.colors.error,
      },
      spacing: {
        xs: `${theme.spacing.xs}px`,
        sm: `${theme.spacing.sm}px`,
        md: `${theme.spacing.md}px`,
        lg: `${theme.spacing.lg}px`,
        xl: `${theme.spacing.xl}px`,
        xxl: `${theme.spacing.xxl}px`,
      },
      borderRadius: {
        small: `${theme.borderRadius.small}px`,
        medium: `${theme.borderRadius.medium}px`,
        large: `${theme.borderRadius.large}px`,
        xlarge: `${theme.borderRadius.xlarge}px`,
      },
    },
  },
});
