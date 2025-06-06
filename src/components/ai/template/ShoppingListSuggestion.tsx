import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as geminiStyles } from '../../../styles/geminiStyle';
import { Card } from '../../common/Card';

interface ShoppingItem {
  id: string;
  ingredientId: string;
  nom: string;
  quantite: number;
  unite: string;
  checked?: boolean;
  categorie?: string;
}

interface ShoppingListSuggestionProps {
  items: ShoppingItem[];
  onToggleItem?: (id: string) => void;
  onGenerateList?: () => void;
}

const ShoppingListSuggestion = ({ items, onToggleItem, onGenerateList }: ShoppingListSuggestionProps) => {
  const [showAllItems, setShowAllItems] = useState(false);
  const displayedCategories = [...new Set(items.map(item => item.categorie))].sort();
  const itemsToShow = showAllItems ? items : items.slice(0, 5);

  return (
    <View style={[geminiStyles.suggestionCard, localStyles.container]}>
      <View style={localStyles.header}>
        <Icon name="cart-outline" size={24} color="#2980b9" style={localStyles.headerIcon} />
        <Text style={[geminiStyles.messageText, localStyles.headerText]}>
          Voici votre liste de courses :
        </Text>
      </View>
      {items.length > 0 ? (
        <>
          {displayedCategories.map((category, index) => {
            const categoryItems = itemsToShow.filter(item => item.categorie === category);
            return (
              <Card key={index} title={category || 'Divers'} style={localStyles.card}>
                {categoryItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onToggleItem?.(item.id)}
                    style={localStyles.itemContainer}
                  >
                    <View style={localStyles.itemContent}>
                      <Icon
                        name={item.checked ? 'checkbox-marked' : 'checkbox-blank-circle-outline'}
                        size={20}
                        color={item.checked ? '#27AE60' : '#b0b0b0'}
                        style={localStyles.checkbox}
                      />
                      <View style={localStyles.itemInfo}>
                        <Text style={[localStyles.itemName, item.checked && localStyles.checkedText]}>
                          {item.nom || item.ingredientId}
                        </Text>
                        <Text style={localStyles.itemQuantity}>
                          {item.quantite} {item.unite}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>
            );
          })}
          {items.length > 5 && !showAllItems && (
            <TouchableOpacity
              onPress={() => setShowAllItems(true)}
              style={localStyles.showMoreButton}
            >
              <Text style={localStyles.showMoreText}>
                Voir plus ({items.length - 5} autres)
              </Text>
            </TouchableOpacity>
          )}
          {onGenerateList && (
            <TouchableOpacity
              onPress={onGenerateList}
              style={localStyles.actionButton}
            >
              <Icon name="refresh" size={20} color="#2980b9" />
              <Text style={localStyles.actionText}>Regénérer la liste</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={localStyles.emptyContainer}>
          <Icon name="cart-off" size={40} color="#b0b0b0" />
          <Text style={localStyles.emptyText}>Aucune liste de courses</Text>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    marginBottom: 12,
    padding: 0,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 16,
  },
  checkedText: {
    color: '#666666',
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  showMoreText: {
    color: '#2980b9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  actionText: {
    color: '#2980b9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginTop: 10,
  },

});

export default ShoppingListSuggestion;
