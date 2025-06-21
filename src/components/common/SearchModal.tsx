import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Menu, Recette, Ingredient, MembreFamille } from '../../constants/entities';
import { useFirestore } from '../../hooks/useFirestore';


interface SearchResult {
  id: string;
  type: 'Menu' | 'Recipe' | 'Ingredient' | 'FamilyMember';
  displayText: string;
  navigationParams: { [key: string]: string };
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { getCollection, loading } = useFirestore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Animation for modal
  const modalOpacity = useSharedValue(0);
  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: withTiming(modalOpacity.value, { duration: 300, easing: Easing.out(Easing.ease) }) }],
  }));

  useEffect(() => {
    modalOpacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible, modalOpacity]);

  // Search across collections
  const performSearch = useCallback(async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    try {
      const [menus, recipes, ingredients, familyMembers] = await Promise.all([
        getCollection<Menu>('Menus'),
        getCollection<Recette>('Recipes'),
        getCollection<Ingredient>('Ingredients'),
        getCollection<MembreFamille>('FamilyMembers'),
      ]);

      const filteredResults: SearchResult[] = [
        ...menus
          .filter(
            item =>
              item.foodName?.toLowerCase().includes(search.toLowerCase()) ||
              item.description?.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            type: 'Menu' as const,
            displayText: item.foodName || '',
            navigationParams: { menuId: item.id },
          })),
        ...recipes
          .filter(item => item.nom?.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            type: 'Recipe' as const,
            displayText: item.nom || '',
            navigationParams: { recipeId: item.id },
          })),
        ...ingredients
          .filter(item => item.nom?.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            type: 'Ingredient' as const,
            displayText: item.nom || '',
            navigationParams: {}, // Navigates to RecipeList
          })),
        ...familyMembers
          .filter(item => item.nom?.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            type: 'FamilyMember' as const,
            displayText: item.nom || '',
            navigationParams: { memberId: item.id },
          })),
      ];

      setResults(filteredResults);
    } catch (err) {
    }
  }, [search, getCollection]);

  useEffect(() => {
    performSearch();
  }, [search, performSearch]);

  // Handle navigation based on result type
  const handleResultPress = (result: SearchResult) => {
    onClose();
    switch (result.type) {
      case 'Menu':
        navigation.navigate('MenuDetail', { menuId: result.navigationParams.menuId });
        break;
      case 'Recipe':
        navigation.navigate('RecipeDetail', { recipeId: result.navigationParams.recipeId });
        break;
      case 'Ingredient':
        navigation.navigate('RecipeList');
        break;
      case 'FamilyMember':
        navigation.navigate('FamilyMemberDetail', { memberId: result.navigationParams.memberId });
        break;
    }
  };


  const highlightText = (text: string, query: string) => {
    if (!query) {return <Text style={styles.menuItemText}>{text}</Text>;}
    const parts = text.split(new RegExp(`(${query})`, 'i'));
    return (
      <Text style={styles.menuItemText}>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  // Render category header with "View All" button
  const renderCategoryHeader = (type: SearchResult['type']) => {
    const count = results.filter(result => result.type === type).length;
    if (count === 0) {return null;}

    const navigateToList = () => {
      onClose();
      switch (type) {
        case 'Menu':
          navigation.navigate('Menu');
          break;
        case 'Recipe':
          navigation.navigate('RecipeList');
          break;
        case 'FamilyMember':
          navigation.navigate('FamilyList');
          break;
        default:
          break;
      }
    };

    return (
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{t(`search.categories.${type.toLowerCase()}`)}</Text>
        {count > 3 && (
          <TouchableOpacity
            onPress={navigateToList}
            style={styles.viewAllButton}
            accessibilityLabel={t('search.viewAll', { category: t(`search.categories.${type.toLowerCase()}`) })}
          >
            <LinearGradient colors={['#FF4F00', '#FF7F3F']} style={styles.viewAllGradient}>
              <Text style={styles.viewAllText}>{t('search.viewAll')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render search result item
  const renderMenuItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => handleResultPress(item)}
      accessibilityLabel={t(`search.${item.type.toLowerCase()}.container`, { name: item.displayText })}
    >
      {highlightText(item.displayText, search)}
    </TouchableOpacity>
  );

  // Group results by type for rendering
  const groupedResults = [
    { type: 'Menu' as const, data: results.filter(r => r.type === 'Menu') },
    { type: 'Recipe' as const, data: results.filter(r => r.type === 'Recipe') },
    { type: 'Ingredient' as const, data: results.filter(r => r.type === 'Ingredient') },
    { type: 'FamilyMember' as const, data: results.filter(r => r.type === 'FamilyMember') },
  ].filter(group => group.data.length > 0);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <LinearGradient colors={['#2e2e2e', '#1a1a1a']} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t('search.placeholder')}
                placeholderTextColor="#aaa"
                accessibilityLabel={t('search.accessibilityLabel')}
              />
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel={t('modal.close')}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('search.loading')}</Text>
              </View>
            ) : results.length === 0 && search.trim() ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('search.noResults')}</Text>
              </View>
            ) : (
              <FlatList
                data={groupedResults}
                renderItem={({ item: group }) => (
                  <View>
                    {renderCategoryHeader(group.type)}
                    <FlatList
                      data={group.data}
                      renderItem={renderMenuItem}
                      keyExtractor={item => `${item.type}-${item.id}`}
                      contentContainerStyle={styles.menuList}
                    />
                  </View>
                )}
                keyExtractor={group => group.type}
                contentContainerStyle={styles.menuList}
              />
            )}
          </LinearGradient>
        </Animated.View>
      </View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  highlightedText: {
    color: '#FF4F00',
    fontWeight: '600',
  },
  menuList: {
    paddingBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#2e2e2e',
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewAllGradient: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchModal;
