import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AntDesign from 'react-native-vector-icons/AntDesign';

type Ingredient = {
  ingredientName: string;
  price: string;
  ingredientImage?: string;
};

type MenuItem = {
  id: string;
  foodName: string;
  description: string;
  planningType?: 'jour' | 'semaine';
  addedAt?: any;
  foodPick?: string; // image du plat
  foodIngredients?: Ingredient[];
  price?: number;
  forFamilyPrice?: number;
  day?: string; // ajouté pour le groupement par jour (si disponible)
};

const MenuPlanifiesScreen: React.FC = () => {
  const userId = auth().currentUser?.uid;
  const [menusJour, setMenusJour] = useState<MenuItem[]>([]);
  const [menusSemaine, setMenusSemaine] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // État modal et détail
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!userId) return;

    const fetchPlannedMenus = async () => {
      setLoading(true);
      try {
        // Récupérer menus du jour
        const jourSnapshot = await firestore()
          .collection(`users/${userId}/monPanierDujour`)
          .where('planningType', '==', 'jour')
          .get();

        const menusJourData = jourSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            foodIngredients: data.foodIngredients || [],
          } as MenuItem;
        });

        // Récupérer menus de la semaine
        const semaineSnapshot = await firestore()
          .collection(`users/${userId}/menuSemain`)
          .where('planningType', '==', 'semaine')
          .get();

        let menusSemaineData: MenuItem[] = [];
        semaineSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // On suppose que chaque doc contient plusieurs menus sous forme clé-valeur
          const menusInDoc = Object.entries(data).map(([key, val]) => ({
            id: key,
            ...(val as object),
            foodIngredients: (val as any).foodIngredients || [],
          })) as MenuItem[];
          menusSemaineData = [...menusSemaineData, ...menusInDoc];
        });

        setMenusJour(menusJourData);
        setMenusSemaine(menusSemaineData);
      } catch (error) {
        console.error('Erreur récupération menus planifiés :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlannedMenus();
  }, [userId]);

  const handleShowDetails = (item: MenuItem) => {
    setSelectedItemDetail(item);
    setModalVisible(true);
    setCurrentStep(1);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => handleShowDetails(item)}
    >
      <Text style={styles.menuTitle}>{item.foodName}</Text>
      <Text style={styles.menuDesc} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Groupement des menus de la semaine par jour
  const groupedMenusByDay = menusSemaine.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const day = item.day || 'Inconnu';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  // Contenu du modal de détail
  const renderModalContent = () => {
    if (!selectedItemDetail) return null;

    const {
      foodName,
      description,
      foodPick,
      foodIngredients = [],
      price,
      forFamilyPrice,
    } = selectedItemDetail;

    return (
      <View style={[styles.overlay, styles.center]}>
        <View style={[styles.formContain, { width: '90%', maxHeight: '80%' }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.headerTitle}>
              {currentStep === 1 ? 'Étape 1: Infos du Plat' : 'Étape 2: Ingrédients'}
            </Text>

            {currentStep === 1 ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nom du plat"
                  placeholderTextColor="#999"
                  value={foodName}
                  editable={false}
                />

                {foodPick ? (
                  <Image source={{ uri: foodPick }} style={styles.foodImage} />
                ) : null}

                <TextInput
                  style={[styles.input, { height: 100, marginBottom: 20 }]}
                  multiline
                  placeholder="Description du plat"
                  placeholderTextColor="#999"
                  value={description}
                  editable={false}
                />

                <Text style={styles.priceText}>Prix: {price ?? 0} FCFA</Text>
                <Text style={styles.priceText}>Prix pour famille: {forFamilyPrice ?? 0} FCFA</Text>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => setCurrentStep(2)}
                >
                  <Text style={styles.saveButtonText}>Voir les ingrédients</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Ingrédients</Text>

                {foodIngredients.length > 0 ? (
                  foodIngredients.map((ing, index) => (
                    <View key={index} style={styles.ingredientRow}>
                      <View style={styles.ingredientLeft}>
                        <View style={styles.ingredientImageContainer}>
                          {ing.ingredientImage ? (
                            <Image
                              source={{ uri: ing.ingredientImage }}
                              style={styles.ingredientImage}
                            />
                          ) : (
                            <AntDesign name="plus" size={24} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.ingredientText}>
                          {ing.ingredientName} - {ing.price} FCFA
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noIngredientText}>Aucun ingrédient disponible.</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { marginTop: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
                  ]}
                  onPress={() => setCurrentStep(1)}
                >
                  <AntDesign name="back" size={24} color="#fff" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Retour</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                setModalVisible(false);
                setCurrentStep(1);
                setSelectedItemDetail(null);
              }}
            >
              <AntDesign name="close" size={24} color="#fff" />
              <Text style={styles.removeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Menus planifiés du jour</Text>

        {menusJour.length === 0 ? (
          <Text style={styles.emptyText}>Aucun menu planifié pour aujourd'hui.</Text>
        ) : (
          <FlatList
            data={menusJour}
            renderItem={renderMenuItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        )}

        <Text style={styles.sectionTitle}>Menus planifiés de la semaine</Text>

        {menusSemaine.length === 0 ? (
          <Text style={styles.emptyText}>Aucun menu planifié pour cette semaine.</Text>
        ) : (
          Object.entries(groupedMenusByDay).map(([day, menus]) => (
            <View key={day} style={{ marginBottom: 20 }}>
              <Text style={styles.dayTitle}>
                {day} ({menus.length} plat{menus.length > 1 ? 's' : ''})
              </Text>
              {menus.map(menu => (
                <TouchableOpacity
                  key={menu.id}
                  style={styles.menuItem}
                  onPress={() => handleShowDetails(menu)}
                >
                  <Text style={styles.menuTitle}>{menu.foodName}</Text>
                  <Text style={styles.menuDesc} numberOfLines={1}>
                    {menu.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        {renderModalContent()}
      </Modal>
    </View>
  );
};

export default MenuPlanifiesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#f5f5f5',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  dayTitle: {
    color: '#ffa500',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
  },
  menuItem: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  menuTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  menuDesc: {
    color: '#aaa',
    marginTop: 6,
  },
  emptyText: {
    color: '#777',
    fontStyle: 'italic',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18,18,18,0.95)',
    padding: 20,
  },
  formContain: {
    backgroundColor: '#212121',
    borderRadius: 8,
    padding: 15,
    alignSelf: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#f5f5f5',
    marginBottom: 15,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 8,
    color: '#fff',
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  foodImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  removeBtn: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },

  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientImageContainer: {
    backgroundColor: '#ffa500',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ingredientImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  ingredientText: {
    color: '#fff',
    fontSize: 16,
  },
  noIngredientText: {
    color: '#ccc',
    fontStyle: 'italic',
    fontSize: 16,
    marginTop: 10,
  },
});
