import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import {Ingredient} from '../AddMenuPage';
import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';

const options: CameraOptions = {
  mediaType: 'photo',
  quality: 0.7,
  includeBase64: true,
};

function StockScreen({navigation}: any) {
  const [stock, setStock] = useState<(Ingredient & {id: string})[]>([]);
  const [filteredStock, setFilteredStock] = useState<
    (Ingredient & {id: string})[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [origineFilter, setOrigineFilter] = useState<string>('');
  const [selectedIngredient, setSelectedIngredient] = useState<
    (Ingredient & {id: string}) | null
  >(null);
  const [editFields, setEditFields] = useState<Partial<Ingredient>>({});

  const tabs = [
    {label: 'Stock', screen: 'StockScreen'},
    {label: 'Course', screen: 'Courses'},
    {label: 'Historique', screen: 'HistoriqueAchats'},
    {label: 'Achat rapide', screen: 'AchatRapide'},
  ];

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('stock')
      .orderBy('ingredientName')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Ingredient),
          }));
          setStock(data);
          setFilteredStock(data);
          setLoading(false);
        },
        err => {
          console.error('Erreur Firestore:', err);
          setError('Impossible de charger le stock.');
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = stock.filter(item => {
      const nameMatch = item.ingredientName
        .toLowerCase()
        .includes(search.toLowerCase());
      const origineMatch =
        item.origine?.toLowerCase().includes(origineFilter.toLowerCase()) ??
        true;
      return nameMatch && origineMatch;
    });
    setFilteredStock(filtered);
  }, [search, origineFilter, stock]);

  const handleEdit = (ingredient: Ingredient & {id: string}) => {
    setSelectedIngredient(ingredient);
    setEditFields(ingredient);
  };

  const saveUpdate = async () => {
    if (!selectedIngredient) return;
    try {
      await firestore()
        .collection('stock')
        .doc(selectedIngredient.id)
        .update({
          ...editFields,
          price: editFields.price ? Number(editFields.price) : undefined,
          quantity: editFields.quantity
            ? Number(editFields.quantity)
            : undefined,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      setSelectedIngredient(null);
      Alert.alert('Succès', 'Ingrédient mis à jour.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Mise à jour échouée.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Confirmer', 'Supprimer cet ingrédient ?', [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deleteIngredient(id),
      },
    ]);
  };

  const deleteIngredient = async (id: string) => {
    try {
      await firestore().collection('stock').doc(id).delete();
      Alert.alert('Supprimé', 'Ingrédient supprimé.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'La suppression a échoué.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setOrigineFilter('');
  };



  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false; // au démontage
    };
  }, []);

  const pickImage = (onPick: (base64: string) => void) => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets[0]?.base64) {
        onPick(`data:${response.assets[0].type};base64,${response.assets[0].base64}`);
      } else {
        // Vérifier que le composant est toujours monté avant d'afficher l'alerte
        if (isMounted.current) {
          Alert.alert('Erreur', "Impossible de récupérer l’image.");
        }
      }
    });
  };
  const saveImageToFirestore = async (itemId: string, base64Image: string) => {
    try {
      await firestore()
        .collection('stock')
        .doc(itemId)
        .update({
          ingredientImage: base64Image,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      Alert.alert('Succès', 'Image mise à jour.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de mettre à jour l'image.");
    }
  };

  const renderItem = ({item}: {item: Ingredient & {id: string}}) => {
    const isBase64 = item.ingredientImage?.startsWith('data:image');
    const isHttpUrl = item.ingredientImage?.startsWith('http');

    return (
      <View style={styles.card}>
        {isBase64 || isHttpUrl ? (
          <Image source={{uri: item.ingredientImage}} style={styles.image} />
        ) : (
          <TouchableOpacity
            onPress={() =>
              pickImage(base64Image =>
                saveImageToFirestore(item.id, base64Image),
              )
            }
            style={[
              styles.image,
              {
                backgroundColor: '#555',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 25, // cercle
              },
            ]}>
            <AntDesign name="plus" size={30} color="#FFA500" />
          </TouchableOpacity>
        )}
        <View style={styles.details}>
          <Text style={styles.name}>{item.ingredientName}</Text>
          <Text style={styles.text}>
            {item.quantity} {item.unite} — {item.price} FCFA
          </Text>
          {item.origine && (
            <Text style={styles.text}>Origine : {item.origine}</Text>
          )}
          {item.otherName && (
            <Text style={styles.text}>Alias : {item.otherName}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <AntDesign name="edit" size={20} color="orange" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id)}>
            <AntDesign name="delete" size={20} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.appBarContainer}>
        <View style={styles.appbartextAndback}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={32} color="#FFA500" />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Stock des Ingrédients</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <AntDesign
            name="search1"
            size={18}
            color="#FFA500"
            style={styles.icon}
          />
          <TextInput
            placeholder="Nom ingrédient"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.searchContainer}>
          <AntDesign
            name="earth"
            size={18}
            color="#FFA500"
            style={styles.icon}
          />
          <TextInput
            placeholder="Origine"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={origineFilter}
            onChangeText={setOrigineFilter}
          />
        </View>

        <TouchableOpacity onPress={clearFilters} style={styles.resetButton}>
          <AntDesign name="closecircleo" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {selectedIngredient && (
        <View style={styles.editBox}>
          <Text style={{fontWeight: 'bold', color: '#fff'}}>
            Modifier : {selectedIngredient.ingredientName}
          </Text>
          <Text style={{color: '#ccc', marginBottom: 10}}>
            Modifiez les champs ci-dessous et appuyez sur "Enregistrer" pour
            mettre à jour l'ingrédient.
          </Text>
          <TextInput
            placeholder="Nom"
            value={editFields.ingredientName || ''}
            onChangeText={text =>
              setEditFields({...editFields, ingredientName: text})
            }
            style={styles.editInput}
          />
          <TextInput
            placeholder="Prix"
            keyboardType="numeric"
            value={editFields.price || ''}
            onChangeText={text => setEditFields({...editFields, price: text})}
            style={styles.editInput}
          />
          <TextInput
            placeholder="Quantité"
            keyboardType="numeric"
            value={editFields.quantity || ''}
            onChangeText={text =>
              setEditFields({...editFields, quantity: text})
            }
            style={styles.editInput}
          />

          <TextInput
            placeholder="Unité"
            value={editFields.unite || ''}
            onChangeText={text => setEditFields({...editFields, unite: text})}
            style={styles.editInput}
          />
          <TextInput
            placeholder="Origine"
            value={editFields.origine || ''}
            onChangeText={text => setEditFields({...editFields, origine: text})}
            style={styles.editInput}
          />

          <View style={styles.editActions}>
            <TouchableOpacity onPress={saveUpdate} style={styles.iconButton}>
              <AntDesign name="check" size={20} color="green" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedIngredient(null)}
              style={styles.iconButton}>
              <AntDesign name="close" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.text}>Chargement du stock...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : filteredStock.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.text}>Aucun ingrédient correspondant.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStock}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{padding: 16}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#1e1e1e'},
  backButton: {padding: 4, marginRight: 50},
  appBarContainer: {
    backgroundColor: '#292929',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  appbartextAndback: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#292929',
    paddingVertical: 8,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {borderBottomColor: '#FFA500'},
  tabText: {color: '#ccc', fontSize: 16},
  activeTabText: {color: '#FFA500', fontWeight: 'bold'},
  appBarTitle: {
    color: '#FFA500',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8, // pour l'image, tu peux passer à 25 pour un cercle si tu veux
    backgroundColor: '#444',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  icon: {marginRight: 6},
  editTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFA500',
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: '#444',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },

  resetButton: {padding: 6, backgroundColor: '#FF8800', borderRadius: 8},
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#292929',
    padding: 10,
    borderRadius: 8,
  },

  details: {flex: 1, justifyContent: 'center'},
  name: {fontWeight: 'bold', fontSize: 16, color: '#FFA500'},
  text: {color: '#ddd', fontSize: 14},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {color: '#ff4444', fontSize: 16},
  actions: {justifyContent: 'space-around', alignItems: 'center'},
  editBox: {backgroundColor: '#333', padding: 12, margin: 12, borderRadius: 8},
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  iconButton: {padding: 10},
});

export default StockScreen;
