// src/styles/theme.ts

export const theme = {
  colors: {
    primary: '#26A69A',
    secondary: '#4CAF50',
    background: '#000',
    dark: 'rgba(36, 36, 36, 0.74)',
    surface: '#1E1E1E',
    textPrimary: '#1E1E1E',
    textSecondary: '#B0B0B0',
    error: '#FF6347',
    warning: '#FF9800',
    info: '#2196F3',
    success: '#4CAF50',
    gradientStart: '#26A69A',
    gradientEnd: '#4CAF50',
    disabled: '#666',
    accent: '#FF7F3F',
    white: '#fff',
  },
  fonts: {
    regular: 'Roboto-Regular',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    sizes: {
      xs: 10,
      small: 12,
      medium: 16,
      large: 20,
      title: 24,
      headline: 28,
    },
    semiBold: 'Roboto-SemiBold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    small: 5,
    medium: 10,
    large: 15,
    xlarge: 20,
    round: 30,
  },
  elevation: {
    none: 0,
    low: 4,
    medium: 8,
    high: 12,
  },
  shadow: {
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.3,
    radius: 6,
  },
  animation: {
    duration: 200,
    easing: 'ease-in-out',
  },
};

