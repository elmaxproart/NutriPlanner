import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useMenus } from '../hooks/useMenus';
import { useAIConversation } from '../hooks/useAIConversation';
import { useFirestore } from '../hooks/useFirestore';
import { Menu, Ingredient, MembreFamille } from '../constants/entities';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ModalComponent } from '../components/common/Modal';

const MenuSuggestionsScreen = () => {
  const navigation = useNavigation();
  const { userId } = useAuth();
  const { addMenu } = useMenus(userId || '', 'defaultFamilyId');
  const { getMenuSuggestions } = useAIConversation({
    userId: userId || '',
    familyId: 'defaultFamilyId',
  });
  const { getCollection } = useFirestore(userId || '', 'defaultFamilyId');
  const [suggestions, setSuggestions] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ days: '7', mealType: 'All' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [familyData, setFamilyData] = useState<MembreFamille[]>([]);

  // Charger les données nécessaires
  const fetchData = useCallback(async () => {
    try {
      const fetchedIngredients = await getCollection<Ingredient>('Ingredients');
      const fetchedFamilyData = await getCollection<MembreFamille>('FamilyMembers');
      setIngredients(fetchedIngredients);
      setFamilyData(fetchedFamilyData);
    } catch (err) {
      setError('Erreur lors du chargement des données initiales');
      setModalMessage('Erreur lors du chargement des données initiales');
      setIsModalVisible(true);
    }
  }, [getCollection]);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const suggestedMenus = await getMenuSuggestions(
        ingredients,
        familyData,
        parseInt(filters.days, 10),
        3
      );
      setSuggestions(suggestedMenus);
    } catch (err) {
      setError('Erreur lors de la récupération des suggestions');
      setModalMessage('Erreur lors de la récupération des suggestions');
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [getMenuSuggestions, filters.days, ingredients, familyData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (ingredients.length > 0 || familyData.length > 0) {
      fetchSuggestions();
    }
  }, [fetchSuggestions, ingredients, familyData]);

  const handleAddToPlan = useCallback(
    async (menu: Menu) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, dateCreation, dateMiseAJour, ...menuToAdd } = menu; // Exclure les champs non désirés
        await addMenu(menuToAdd);
        setModalMessage('Menu ajouté au plan');
        setIsModalVisible(true);
      } catch (err) {
        setModalMessage('Échec de l\'ajout au plan');
        setIsModalVisible(true);
      }
    },
    [addMenu]
  );

  const applyFilters = useCallback(
    (days: string, mealType: string) => {
      setFilters({ days, mealType });
    },
    []
  );

  const renderSuggestionItem = ({ item }: { item: Menu }) => (
    <Card title={item.foodName || 'Menu sans nom'} style={styles.suggestionCard}>
      <Text style={styles.detailText}>Type : {item.typeRepas || 'Non spécifié'}</Text>
      <Text style={styles.detailText}>Coût : ${(item.coutTotalEstime || 0).toFixed(2)}</Text>
      <Button title="Ajouter au Plan" onPress={() => handleAddToPlan(item)} style={styles.addButton} />
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.filters}>
        <Button
          title="1 Jour"
          onPress={() => applyFilters('1', filters.mealType)}
          style={styles.filterButton}
        />
        <Button
          title="7 Jours"
          onPress={() => applyFilters('7', filters.mealType)}
          style={styles.filterButton}
        />
        <Button
          title="Déjeuner"
          onPress={() => applyFilters(filters.days, 'Déjeuner')}
          style={styles.filterButton}
        />
        <Button
          title="Dîner"
          onPress={() => applyFilters(filters.days, 'Dîner')}
          style={styles.filterButton}
        />
      </View>
      {error && (
        <ModalComponent visible={isModalVisible} onClose={() => setIsModalVisible(false)} title="Erreur">
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{error}</Text>
            <Button title="Fermer" onPress={() => setIsModalVisible(false)} style={styles.modalButton} />
          </View>
        </ModalComponent>
      )}
      <FlatList
        data={suggestions}
        renderItem={renderSuggestionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <ModalComponent visible={isModalVisible} onClose={() => setIsModalVisible(false)} title="Message">
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>{modalMessage}</Text>
          <Button title="Fermer" onPress={() => setIsModalVisible(false)} style={styles.modalButton} />
        </View>
      </ModalComponent>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#2e2e2e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  list: {
    paddingBottom: 16,
  },
  suggestionCard: {
    marginBottom: 16,
  },
  detailText: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
});

export default MenuSuggestionsScreen;
