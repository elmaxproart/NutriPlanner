// src/styles/conversationStyles.ts

import { StyleSheet } from 'react-native';
import { theme } from './theme';
import { width } from './DashbordStyle';

export const conversationStyles = StyleSheet.create({
  messageContainer: {
    maxWidth: width * 0.75,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    elevation: theme.elevation.low,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    lineHeight: 22,
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    elevation: theme.elevation.high,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
    zIndex: 1000,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  contextMenuText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fonts.sizes.medium,
    marginLeft: theme.spacing.sm,
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  swipeDeleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: theme.borderRadius.medium,
  },
  swipeDeleteText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.small,
  },
});
