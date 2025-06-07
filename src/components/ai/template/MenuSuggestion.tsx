import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { styles as geminiStyles } from '../../../styles/geminiStyle';
import { Card } from '../../common/Card';
import { Menu } from '../../../constants/entities';

interface MenuSuggestionProps {
  menus: Menu[];
  onSelectMenu?: (menu: Menu) => void;
}

const MenuSuggestion = ({ menus, onSelectMenu }: MenuSuggestionProps) => {
  return (
    <View style={[geminiStyles.suggestionCard, localStyles.container]}>
      <View style={localStyles.header}>
        <AntDesign name="food" size={24} color="#2980b9" style={localStyles.headerIcon} />
        <Text style={[geminiStyles.messageText, localStyles.headerText]}>
          Voici vos suggestions de menus :
        </Text>
      </View>
      {menus.length > 0 ? (
        menus.map((menu, index) => (
          <Card key={menu.id || index} title={menu.typeRepas} style={localStyles.card}>
            <View style={localStyles.cardContent}>
              <View style={localStyles.menuInfo}>
                {menu.aiSuggestions && menu.aiSuggestions?.recettesAlternatives.length > 0 && (
                  <View style={localStyles.vegetarianBadge}>
                    <AntDesign name="leaf" size={14} color="#27AE60" />
                    <Text style={localStyles.badgeText}>Alternatives suggérées</Text>
                  </View>
                )}
                <Text style={geminiStyles.cardDescription}>{menu.description || 'Pas de description'}</Text>
                {menu.recettes.length > 0 && (
                  <View style={localStyles.platsContainer}>
                    <Text style={localStyles.platsTitle}>Recettes incluses :</Text>
                    {menu.recettes.map((recette, idx) => (
                      <View key={idx} style={localStyles.platItem}>
                        <AntDesign name="silverware" size={14} color="#b0b0b0" style={localStyles.platIcon} />
                        <Text style={localStyles.platText}>{recette.nom || 'Recette sans nom'}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {menu.date && (
                  <Text style={localStyles.dateText}>
                    Prévu pour : {menu.date}
                  </Text>
                )}
                {menu.aiSuggestions && menu.aiSuggestions.ingredientsManquants.length > 0 && (
                  <View style={localStyles.platsContainer}>
                    <Text style={localStyles.platsTitle}>Ingrédients manquants :</Text>
                    {menu.aiSuggestions?.ingredientsManquants.map((ing, idx) => (
                      <View key={idx} style={localStyles.platItem}>
                        <AntDesign name="basket" size={14} color="#b0b0b0" style={localStyles.platIcon} />
                        <Text style={localStyles.platText}>{`${ing.nom} - ${ing.quantite} ${ing.unite}`}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {onSelectMenu && (
                <TouchableOpacity
                  onPress={() => onSelectMenu(menu)}
                  style={localStyles.actionButton}
                >
                  <AntDesign name="checkcircle" size={20} color="#27AE60" />
                  <Text style={localStyles.actionText}>Sélectionner</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      ) : (
        <View style={localStyles.emptyContainer}>
          <AntDesign name="food-off" size={40} color="#b0b0b0" />
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
