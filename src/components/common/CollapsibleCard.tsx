import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  style?: any;
  titleStyle?: any;
  iconSize?: number;
  iconColor?: string;
  onToggle?: () => void;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  children,
  initiallyExpanded = false,
  style,
  titleStyle,
  iconSize = 24,
  iconColor = theme.colors.textPrimary,
  onToggle,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const rotation = useSharedValue(initiallyExpanded ? 180 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => {
      const newState = !prev;
      rotation.value = withTiming(newState ? 180 : 0, { duration: theme.animation.duration });
      AccessibilityInfo.announceForAccessibility(newState ? 'Contenu déplié' : 'Contenu replié');
      onToggle?.(); // Call onToggle if provided
      return newState;
    });
  }, [rotation, onToggle]);

  return (
    <View style={[globalStyles.card, style, styles.container]} accessibilityLabel="Carte pliable">
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir ou fermer ${title}`}
      >
        <Text style={[globalStyles.title, titleStyle]}>{title}</Text>
        <Animated.View style={animatedStyle}>
          <Icon name="expand-more" size={iconSize} color={iconColor} />
        </Animated.View>
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.textSecondary,
  },
});

export default React.memo(CollapsibleCard);
