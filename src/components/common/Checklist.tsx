// src/components/common/Checklist.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { ListeCourses } from '../../constants/entities';

interface ChecklistProps {
  items: ListeCourses['items'];
  onToggle: (itemId: string) => void;
  style?: any;
  itemStyle?: any;
}

const ChecklistItem: React.FC<{
  nom: string;
  quantite: number;
  unite: string;
  achete: boolean;
  id: string;
  onToggle: (itemId: string) => void;
  itemStyle?: any;
}> = ({ nom, quantite, unite, achete, id, onToggle, itemStyle }) => {
  const scale = useSharedValue(achete ? 1 : 0);

  React.useEffect(() => {
    scale.value = withTiming(achete ? 1 : 0, { duration: theme.animation.duration });
  }, [achete, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    onToggle(id);
    AccessibilityInfo.announceForAccessibility(
      `${nom} ${achete ? 'décochez' : 'cochez'}`,
    );
  };

  return (
    <TouchableOpacity
      style={[styles.item, itemStyle]}
      onPress={handleToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={`${nom}, ${quantite} ${unite}, ${achete ? 'acheté' : 'non acheté'}`}
    >
      <View style={styles.checkbox}>
        {achete && (
          <Animated.View style={animatedStyle}>
            <Icon name="check" size={20} color={theme.colors.success} />
          </Animated.View>
        )}
      </View>
      <Text style={[globalStyles.text, styles.itemText]}>{`${nom} (${quantite} ${unite})`}</Text>
    </TouchableOpacity>
  );
};

const Checklist: React.FC<ChecklistProps> = ({ items, onToggle, style, itemStyle }) => {
  return (
    <View style={[globalStyles.container, style, styles.container]}>
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          nom={item.nom}
          quantite={item.quantite}
          unite={item.unite}
          achete={item.stockActuel > 0}
          id={item.id}
          onToggle={onToggle}
          itemStyle={itemStyle}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  itemText: {
    flex: 1,
  },
});

export default React.memo(Checklist);
