import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Ingredient } from '../AddMenuPage';

const HistoriqueAchatScreen: React.FC = () => {
  const [history, setHistory] = useState<Ingredient[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const fetchHistory = async () => {
      const snapshot = await firestore()
        .collection('historiqueAchats')
        .orderBy('addedAt', 'desc')
        .get();
      const data = snapshot.docs.map(doc => doc.data() as Ingredient);
      setHistory(data);
      setFilteredHistory(data);
    };
    fetchHistory();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = history.filter(item =>
      item.ingredientName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredHistory(filtered);
  };

  const totalDepenses = filteredHistory.reduce((sum, item) => {
    const price = parseFloat(item.price);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <TextInput
        placeholder="Rechercher un ingrédient..."
        placeholderTextColor={isDark ? '#aaa' : '#666'}
        value={search}
        onChangeText={handleSearch}
        style={[styles.searchInput, isDark && styles.darkInput]}
      />

      <Text style={[styles.totalText, isDark && styles.darkText]}>
        Total Dépenses : {totalDepenses.toLocaleString()} FCFA
      </Text>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item, index) => item.ingredientName + index}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && styles.darkCard]}>
            <Text style={[styles.title, isDark && styles.darkText]}>
              {item.ingredientName}
            </Text>
            <Text style={[styles.text, isDark && styles.darkText]}>
              Quantité: {item.quantity} {item.unite}
            </Text>
            <Text style={[styles.text, isDark && styles.darkText]}>
              Prix: {item.price} FCFA
            </Text>
            {item.addedAt && (
              <Text style={[styles.date, isDark && styles.darkDate]}>
                {typeof item.addedAt === 'object' && 'seconds' in item.addedAt
                  ? new Date(item.addedAt.seconds * 1000).toLocaleDateString()
                  : new Date(item.addedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            Aucun achat trouvé.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  card: {
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginBottom: 12,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  darkText: {
    color: '#fff',
  },
  darkDate: {
    color: '#aaa',
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 10,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  totalText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});

export default HistoriqueAchatScreen;
