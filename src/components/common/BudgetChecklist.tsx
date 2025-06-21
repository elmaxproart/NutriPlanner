import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, AccessibilityInfo } from 'react-native';
import { StyleSheet } from 'react-native';
import { tw } from '../../styles/tailwind';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Budget } from '../../constants/entities';
import { globalStyles } from '../../styles/globalStyles';

interface BudgetChecklistProps {
  expenses: Budget['depenses'];
  onToggle: (expenseId: string) => void;
  style?: any;
  itemStyle?: any;
  accessibilityLabel?: string;
}

const BudgetChecklist: React.FC<BudgetChecklistProps> = ({
  expenses,
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
    ({ item }: { item: Budget['depenses'][0] }) => {
      const expenseId = `${item.date}-${item.description}`;
      const isChecked = !!item.preuveAchatUrl; // Considère comme coché si preuveAchatUrl existe

      const handleToggle = () => {
        onToggle(expenseId);
        AccessibilityInfo.announceForAccessibility(
          t('budget.expenseToggled', { description: item.description, status: isChecked ? t('unchecked') : t('checked') }),
        );
      };

      return (
        <TouchableOpacity
          style={[styles.itemContainer, itemStyle, tw`flex-${flexDirection} p-sm`]}
          onPress={handleToggle}
          accessibilityLabel={t('budget.expenseItem', { description: item.description })}
          accessibilityHint={t('budget.expenseToggleHint')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isChecked }}
        >
          <MaterialIcons
            name={isChecked ? 'check-box' : 'check-box-outline-blank'}
            size={theme.fonts.sizes.medium}
            color={isChecked ? theme.colors.primary : theme.colors.textSecondary}
            accessibilityLabel={t('icons.checkbox', { status: isChecked ? t('checked') : t('unchecked') })}
          />
          <View style={tw`flex-1 ml-sm`}>
            <Text style={globalStyles.text}>{item.description}</Text>
            <Text style={globalStyles.textSmall}>
              {t('budget.expenseDetails', {
                amount: item.montant,
                category: t(`budget.categories.${item.categorie}`),
                date: new Date(item.date).toLocaleDateString(i18n.language, { dateStyle: 'short' }),
              })}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [itemStyle, flexDirection, t, i18n.language, onToggle],
  );

  return (
    <FlatList
      data={expenses}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.date}-${item.description}`}
      style={[styles.container, style]}
      contentContainerStyle={tw`pb-sm`}
      accessibilityLabel={accessibilityLabel || t('budget.expensesList')}
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

export default memo(BudgetChecklist);
