import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {Ingredient} from '../AddMenuPage';


const GestionStockScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [achatRapideMode, setAchatRapideMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Ingredient>>({});
  const isDark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const snapshot = await firestore().collection('ingredients').get();
        const data = snapshot.docs.map(doc => doc.data() as Ingredient);
        setIngredients(data);
      } catch (error) {
        console.error('Erreur lors du chargement des ingrédients:', error);
        Alert.alert('Erreur', 'Impossible de charger les ingrédients.');
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  const handleAddToStock = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({...ingredient, price: '', quantity: '', unite: ''});
    setAchatRapideMode(false);
    setModalVisible(true);
  };

  const handleAchatRapide = () => {
    setFormData({ingredientName: '', price: '', quantity: '', unite: ''});
    setAchatRapideMode(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const {ingredientName, price, quantity, unite} = formData;
    if (!ingredientName || !price || !quantity || !unite) return;

    const timestamp = firestore.FieldValue.serverTimestamp();
    const stockRef = firestore().collection('stock');

    const snapshot = await stockRef
      .where('ingredientName', '==', ingredientName.trim())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const existing = doc.data() as Ingredient;
      const newQuantity = (
        parseFloat(existing.quantity) + parseFloat(quantity)
      ).toString();

      await stockRef.doc(doc.id).update({
        ...formData,
        quantity: newQuantity,
        updatedAt: timestamp,
      });
    } else {
      await stockRef.add({
        ...formData,
        addedAt: timestamp,
      });
    }

    await firestore()
      .collection('historiqueAchats')
      .add({
        ...formData,
        addedAt: timestamp,
      });

    setModalVisible(false);
    setFormData({});
    setSelectedIngredient(null);
  };

  const filteredIngredients = ingredients.filter(ingr =>
    ingr.ingredientName.toLowerCase().includes(search.toLowerCase()),
  );



  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <TextInput
        placeholder="Rechercher un ingrédient..."
        placeholderTextColor={isDark ? '#aaa' : '#444'}
        value={search}
        onChangeText={setSearch}
        style={[styles.searchInput, isDark && styles.darkInput]}
      />

      <TouchableOpacity
        onPress={handleAchatRapide}
        style={styles.achatRapideBtn}>
        <Text style={styles.achatRapideText}>+ Achat Rapide</Text>
      </TouchableOpacity>
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#ffb732" />
        </View>
      ) : (
         <FlatList
        data={filteredIngredients}
        keyExtractor={(item, index) => item.ingredientName + index}
        renderItem={({item}) => (
          <View style={[styles.card, isDark && styles.darkCard]}>
            {item.ingredientImage ? (
              <Image
                source={{uri: item.ingredientImage}}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              // Espace vide pour garder la place de l'image
              <View style={styles.imagePlaceholder} />
            )}

            <Text style={[styles.name, isDark && styles.darkText]}>
              {item.ingredientName}
            </Text>

            {item.otherName ? (
              <Text style={[styles.secondaryText, isDark && styles.darkText]}>
                Autre nom : {item.otherName}
              </Text>
            ) : null}

            {item.description ? (
              <Text style={[styles.secondaryText, isDark && styles.darkText]}>
                Description : {item.description}
              </Text>
            ) : null}

            {item.origine ? (
              <Text style={[styles.secondaryText, isDark && styles.darkText]}>
                Origine : {item.origine}
              </Text>
            ) : null}

            <Text style={[styles.secondaryText, isDark && styles.darkText]}>
              Prix suggéré : {item.price || '—'} FCFA
            </Text>
            <Text style={[styles.secondaryText, isDark && styles.darkText]}>
              Quantité suggérée : {item.quantity || '—'} {item.unite || ''}
            </Text>

            <TouchableOpacity
              style={[styles.addButton, isDark && styles.darkButton]}
              onPress={() => handleAddToStock(item)}>
              <Text style={styles.addButtonText}>Ajouter au stock</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{padding: 16}}
      />

      )}

     
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDark && styles.darkModal]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              {achatRapideMode ? '🛒 Achat Rapide' : '📦 Ajouter au Stock'}
            </Text>

            <View style={styles.separator} />

            <TextInput
              placeholder="Nom"
              value={formData.ingredientName}
              onChangeText={text =>
                setFormData({...formData, ingredientName: text})
              }
              style={[styles.input, isDark && styles.darkInput]}
              placeholderTextColor={isDark ? '#aaa' : '#666'}
            />

            <TextInput
              placeholder="Prix"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={text => setFormData({...formData, price: text})}
              style={[styles.input, isDark && styles.darkInput]}
              placeholderTextColor={isDark ? '#aaa' : '#666'}
            />

            <TextInput
              placeholder="Quantité"
              keyboardType="numeric"
              value={formData.quantity}
              onChangeText={text => setFormData({...formData, quantity: text})}
              style={[styles.input, isDark && styles.darkInput]}
              placeholderTextColor={isDark ? '#aaa' : '#666'}
            />

            <TextInput
              placeholder="Unité"
              value={formData.unite}
              onChangeText={text => setFormData({...formData, unite: text})}
              style={[styles.input, isDark && styles.darkInput]}
              placeholderTextColor={isDark ? '#aaa' : '#666'}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton]}
                onPress={handleSave}>
                <Text style={styles.saveText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  darkContainer: {backgroundColor: '#121212'},
  searchInput: {
    margin: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ccc',
    borderWidth: 1,
    borderColor: '#bbb',
  },

  darkInput: {backgroundColor: '#1e1e1e', color: '#fff'},
  achatRapideBtn: {
    backgroundColor: '#181818',
    marginHorizontal: 16,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1 / 1.5,
    padding: 12,
    alignItems: 'center',
  },
  achatRapideText: {color: '#fff', fontWeight: 'bold'},
  card: {
    backgroundColor: '#fff', // clair par défaut
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // ... ombre, etc
  },
  darkCard: {
    backgroundColor: '#232323', // fond sombre un peu plus clair
    borderWidth: 1 / 8, // bordure fine
    borderColor: '#ff7f00', // orange vif bordure
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // couleur sombre sur clair
  },
  darkText: {
    color: '#fff', // orange clair sur fond sombre
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#181818',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  darkButton: {
    backgroundColor: '#ffb732', // un orange plus clair en dark mode
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 180,

    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ccc', // fallback gris clair si image ne charge pas
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  darkModal: {
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 16,
    opacity: 0.5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderColor: '#c0c0c0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GestionStockScreen;
