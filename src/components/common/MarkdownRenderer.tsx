import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { theme } from '../../styles/theme';
import { logger } from '../../utils/logger';

interface MarkdownRendererProps {
  content: string;
  style?: any;
  textStyle?: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, style, textStyle }) => {
  const markdownStyles = useMemo(
    () => ({
      body: {
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.regular,
        fontSize: theme.fonts.sizes.medium,
        lineHeight: 22,
      },
      heading1: {
        fontFamily: theme.fonts.bold,
        fontSize: theme.fonts.sizes.title,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
      },
      heading2: {
        fontFamily: theme.fonts.bold,
        fontSize: theme.fonts.sizes.large,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
      },
      list_item: {
        marginBottom: theme.spacing.xs,
      },
      bullet_list_icon: {
        color: theme.colors.textPrimary,
        marginRight: theme.spacing.xs,
      },
      link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline' as const,
      },
    }),
    []
  );

  if (!content) {
    logger.warn('MarkdownRenderer: No content provided');
    return null;
  }

  try {
    return (
      <View style={[styles.container, style]}>
        <Markdown style={{ ...markdownStyles, ...textStyle }}>{content}</Markdown>
      </View>
    );
  } catch (error) {
    logger.error('MarkdownRenderer: Failed to render markdown', { error: error});
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Erreur lors du rendu du contenu.</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
  },
});

export default React.memo(MarkdownRenderer);
