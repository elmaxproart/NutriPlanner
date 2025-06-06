import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as geminiStyles } from '../../../styles/geminiStyle';
import { Card } from '../../common/Card';

interface Menu {
  id: string;
  typeRepas: string;
  description: string;
  plats: string[];
  date?: string;
  isVegetarian?: boolean;
}

interface MenuSuggestionProps {
  menus: Menu[];
  onSelectMenu?: (menu: Menu) => void;
}

const MenuSuggestion = ({ menus, onSelectMenu }: MenuSuggestionProps) => {
  return (
    <View style={[geminiStyles.suggestionCard, localStyles.container]}>
      <View style={localStyles.header}>
        <Icon name="food" size={24} color="#2980b9" style={localStyles.headerIcon} />
        <Text style={[geminiStyles.messageText, localStyles.headerText]}>
          Voici vos suggestions de menus :
        </Text>
      </View>
      {menus.length > 0 ? (
        menus.map((menu, index) => (
          <Card key={menu.id || index} title={menu.typeRepas} style={localStyles.card}>
            <View style={localStyles.cardContent}>
              <View style={localStyles.menuInfo}>
                {menu.isVegetarian && (
                  <View style={localStyles.vegetarianBadge}>
                    <Icon name="leaf" size={14} color="#27AE60" />
                    <Text style={localStyles.badgeText}>Végétarien</Text>
                  </View>
                )}
                <Text style={geminiStyles.cardDescription}>{menu.description}</Text>
                {menu.plats.length > 0 && (
                  <View style={localStyles.platsContainer}>
                    <Text style={localStyles.platsTitle}>Plats inclus :</Text>
                    {menu.plats.map((plat, idx) => (
                      <View key={idx} style={localStyles.platItem}>
                        <Icon name="silverware" size={14} color="#b0b0b0" style={localStyles.platIcon} />
                        <Text style={localStyles.platText}>{plat}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {menu.date && (
                  <Text style={localStyles.dateText}>
                    Prévu pour : {menu.date}
                  </Text>
                )}
              </View>
              {onSelectMenu && (
                <TouchableOpacity
                  onPress={() => onSelectMenu(menu)}
                  style={localStyles.actionButton}
                >
                  <Icon name="check-circle" size={20} color="#27AE60" />
                  <Text style={localStyles.actionText}>Sélectionner</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      ) : (
        <View style={localStyles.emptyContainer}>
          <Icon name="food-off" size={40} color="#b0b0b0" />
          <Text style={localStyles.emptyText}>Aucun menu suggéré</Text>
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
    padding: 16,
  },
  cardContent: {
    marginTop: 8,
  },
  menuInfo: {
    marginBottom: 12,
  },
  vegetarianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#27AE60',
    fontSize: 12,
    marginLeft: 4,
  },
  platsContainer: {
    marginTop: 8,
  },
  platsTitle: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  platItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  platIcon: {
    marginRight: 6,
  },
  platText: {
    color: '#ffffff',
    fontSize: 14,
  },
  dateText: {
    color: '#b0b0b0',
    fontSize: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
  },
  actionText: {
    color: '#27AE60',
    fontSize: 14,
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

export default MenuSuggestion;
