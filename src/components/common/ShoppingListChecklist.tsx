import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, AccessibilityInfo } from 'react-native';
import { StyleSheet } from 'react-native';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Ingredient } from '../../constants/entities';
import { globalStyles } from '../../styles/globalStyles';

interface ShoppingListChecklistProps {
  items: Ingredient[];
  onToggle: (itemId: string) => void;
  style?: any;
  itemStyle?: any;
  accessibilityLabel?: string;
}

const ShoppingListChecklist: React.FC<ShoppingListChecklistProps> = ({
  items,
  onToggle,
  style,
  itemStyle,
  accessibilityLabel,
}) => {
  const { t, i18n } = useTranslation();

  // Support RTL
  const isRTL = i18n.dir() === 'rtl';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const renderItem = useCallback(
    ({ item }: { item: Ingredient }) => {
      const itemId = item.id;
      const isChecked = item.stockActuel >= item.quantite; // Considère comme coché si stockActuel couvre la quantité

      const handleToggle = () => {
        onToggle(itemId);
        AccessibilityInfo.announceForAccessibility(
          t('shoppingList.itemToggled', {
            name: item.nom,
            status: isChecked ? t('unchecked') : t('checked'),
          }),
        );
      };

      return (
        <TouchableOpacity
          style={[styles.itemContainer, itemStyle, tw`flex-${flexDirection} p-sm`]}
          onPress={handleToggle}
          accessibilityLabel={t('shoppingList.item', { name: item.nom })}
          accessibilityHint={t('shoppingList.itemToggleHint')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isChecked }}
        >
          <MaterialIcons
            name={isChecked ? 'check-box' : 'check-box-outline-blank'}
            size={theme.fonts.sizes.medium}
            color={isChecked ? theme.colors.primary : theme.colors.textSecondary}
            accessibilityLabel={t('icons.checkbox', {
              status: isChecked ? t('checked') : t('unchecked'),
            })}
          />
          <View style={tw`flex-1 ml-sm`}>
            <Text style={globalStyles.text}>{item.nom}</Text>
            <Text style={globalStyles.textSmall}>
              {t('shoppingList.itemDetails', {
                quantity: item.quantite,
                unit: item.unite,
                category: item.categorie
                  ? t(`ingredient.categories.${item.categorie}`)
                  : t('unknown'),
              })}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [itemStyle, flexDirection, t, onToggle],
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={[styles.container, style]}
      contentContainerStyle={tw`pb-sm`}
      accessibilityLabel={accessibilityLabel || t('shoppingList.itemsList')}
      accessibilityRole="list"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  itemContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
});

export default memo(ShoppingListChecklist);
