import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import {styles} from '../styles/addPageStyle';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import CustomPopup from '../components/CustumPopup';

import {ToastAndroid} from 'react-native';

export type Ingredient = {
  ingredientImage?: string;
  ingredientName: string;
  price: string;
  unite: string;
  quantity: string;
  origine?: string;
  description?: string;
  otherName?: string;
  addedAt?: FirebaseFirestoreTypes.Timestamp | string;
};

export type MenuItem = {
  id: string;
  foodName: string;
  foodPick: string;
  description: string;
  foodIngredients: Ingredient[];
  price: number;
  forFamilyPrice: number;
  day?: string;
  origine?: string;
  otherName?: string;
};

const AddMenuPage: React.FC<{navigation: any}> = ({navigation}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [planningType, setPlanningType] = useState<'jour' | 'semaine' | null>(
    null,
  );
  const userId = auth().currentUser?.uid;
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [foodPick, setFoodPick] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodOrigine, setFoodOrigine] = useState('');
  const [foodOtherName, setFoodOtherName] = useState('');
  const [foodDay, setFoodDay] = useState('');

  const [price, setPrice] = useState(0);
  const [forFamilyPrice, setForFamilyPrice] = useState(0);
  const [searchText, setSearchText] = useState('');
  const filteredMenus = menus.filter(
    menu =>
      menu.foodName.toLowerCase().includes(searchText.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchText.toLowerCase()),
  );

  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(
    null,
  );

  const [selectedItemToPlan, setSelectedItemToPlan] = useState<MenuItem | null>(
    null,
  );
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<
    'info' | 'alert' | 'error' | 'success'
  >('info');

  const showPopup = (
    type: 'info' | 'alert' | 'error' | 'success',
    message: string,
  ) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    ingredientName: '',
    price: '',
    quantity: '',
    unite: '',
    origine: '',
    description: '',
    otherName: '',
  });

  const [familySize, setFamilySize] = useState(1);
  const updatePrice = () => {
    const newPrice = calculatePrice();
    setPrice(newPrice);
    setForFamilyPrice(newPrice * familySize);
  };

  useEffect(() => {
    const fetchMenus = async () => {
      const snapshot = await firestore()
        .collection(`users/${userId}/mymenu`)
        .get();
      const data = snapshot.docs.map(doc => {
        const menu = doc.data() as MenuItem;
        const {id, ...menuWithoutId} = menu as any;
        return {
          id: doc.id,
          ...menuWithoutId,
          forFamilyPrice: (menu.price || 0) * familySize,
        };
      });

      setMenus(data);
    };
    const planItem = async (planningType: 'jour' | 'semaine') => {
      if (!selectedItemToPlan || !userId) return;

      try {
        const baseData = {
          ...selectedItemToPlan,
          planningType,
          addedAt: firestore.FieldValue.serverTimestamp(),
        };

        if (planningType === 'jour') {
          await firestore()
            .collection(`users/${userId}/menuDujour`)
            .add(baseData);
        } else if (planningType === 'semaine') {
          const currentWeek = new Date().toISOString().split('T')[0]; // simplifié pour un ID unique
          await firestore()
            .collection(`users/${userId}/menuSemain`)
            .doc(currentWeek) // ou utilisez une structure type map
            .set({[selectedItemToPlan.id]: baseData}, {merge: true});
        }

        showPopup('success', `Plat planifié pour la ${planningType}`);
      } catch (error) {
        console.error('Erreur planification:', error);
        showPopup('error', 'Erreur lors de la planification');
      }

      setPlanModalVisible(false);
      setSelectedItemToPlan(null);
    };

    const fetchFamilySize = async () => {
      if (!userId) return;
      try {
        const snapshot = await firestore()
          .collection(`users/${userId}/family`)
          .get();

        console.log(
          'Docs trouvés dans family:',
          snapshot.docs.map(doc => doc.id),
        );

        const totalSize = snapshot.size;
        setFamilySize(totalSize + 1);
      } catch (error) {
        console.error('Erreur lors de la récupération de familySize:', error);
      }
    };

    fetchMenus();
    fetchFamilySize();
  }, [modalVisible, familySize]);

  const planItem = async (
    planningType: 'jour' | 'semaine',
    dateForWeek?: string,
  ) => {
    if (!selectedItemToPlan || !userId) return;

    try {
      const baseData = {
        ...selectedItemToPlan,
        planningType,
        addedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (planningType === 'jour') {
        await firestore()
          .collection(`users/${userId}/monPanierDujour`)
          .add(baseData);
      } else if (planningType === 'semaine') {
        // Stocker la date choisie (exemple : '2025-06-01')
        await firestore()
          .collection(`users/${userId}/menuSemain`)
          .doc(dateForWeek || new Date().toISOString().split('T')[0])
          .set({[selectedItemToPlan.id]: baseData}, {merge: true});
      }
      await updateCourseList(planningType, dateForWeek || date, selectedItemToPlan);


      showPopup('success', `Plat planifié pour la ${planningType}`);
    } catch (error) {
      console.error('Erreur planification:', error);
      showPopup('error', 'Erreur lors de la planification');
    }

    setPlanModalVisible(false);
    setSelectedItemToPlan(null);
    setPlanningType(null);
  };
  const updateCourseList = async (
  planningType: 'jour' | 'semaine',
  date: string,
  menu: MenuItem,
) => {
  const planningId = planningType === 'jour' ? date : date; // ou `week-yyyy-mm-dd`

  const courseDocRef = firestore()
    .collection(`users/${userId}/courses`)
    .doc(planningId);

  try {
    const courseDoc = await courseDocRef.get();

    let currentPlats = [];
    let total = 0;

    if (courseDoc.exists()) {
      const existingData = courseDoc.data();
      currentPlats = existingData?.plats || [];
      total = existingData?.totalPrice || 0;
    }

    // Ajout du plat planifié
    const newPlat = {
      foodName: menu.foodName,
      foodIngredients: menu.foodIngredients,
      forFamilyPrice: menu.forFamilyPrice,
    };

    currentPlats.push(newPlat);
    total += menu.forFamilyPrice;

    // Mettre à jour la course
    await courseDocRef.set(
      {
        type: planningType,
        date,
        plats: currentPlats,
        totalPrice: total,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log('Liste de courses mise à jour');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la liste de course :', error);
  }
};


  const pickImage = (onPick: (base64: string) => void) => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true}, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets[0]?.base64) {
        onPick(
          `data:${response.assets[0].type};base64,${response.assets[0].base64}`,
        );
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer l’image.');
      }
    });
  };
  useEffect(() => {
    const newTotalPrice = calculatePrice();
    setPrice(newTotalPrice);
    setForFamilyPrice(newTotalPrice * familySize);
  }, [familySize, ingredients]);

  const addIngredient = () => {
    if (newIngredient.ingredientName && newIngredient.price) {
      const updatedIngredients = [...ingredients, newIngredient];
      setIngredients(updatedIngredients);
      setNewIngredient({
        ingredientName: '',
        price: '',
        quantity: '',
        unite: '',
        origine: '',
        description: '',
        otherName: '',
        ingredientImage: undefined,
        addedAt: undefined,
      });

      const newTotalPrice = updatedIngredients.reduce(
        (sum, ing) => sum + parseFloat(ing.price || '0'),
        0,
      );

      setPrice(newTotalPrice);
      setForFamilyPrice(newTotalPrice * familySize);
    } else {
      Alert.alert(
        'Erreur',
        'Veuillez remplir le nom et le prix de l’ingrédient.',
      );
    }
  };

  const calculatePrice = () => {
    return ingredients.reduce(
      (sum, ing) => sum + parseFloat(ing.price || '0'),
      0,
    );
  };
  const removeIngredient = (indexToRemove: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSave = async () => {
    if (!foodName || !foodPick || ingredients.length === 0) {
      showPopup('error', 'Remplissez tous les champs obligatoires.');
      return;
    }

    try {
      await firestore().collection(`users/${userId}/mymenu`).add({
        foodName,
        foodPick,
        description,
        foodIngredients: ingredients,
        price,
        addedAt: firestore.FieldValue.serverTimestamp(),
        origine: foodOrigine,
        otherName: foodOtherName,
        day: foodDay,
      });

      setModalVisible(false);
      setFoodName('');
      setFoodPick('');
      setIngredients([]);
      setCurrentStep(1);
      setDescription('');
      setFoodOrigine('');
      setFoodOtherName('');
      setFoodDay('');
      setPrice(0);
      showPopup('success', 'Plat enregistré avec succès !');
    } catch (error) {
      showPopup('error', 'Une erreur est survenue lors de l’enregistrement.');
    }
  };

  const renderCard = ({item}: {item: MenuItem}) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedItemDetail(item);
        setDetailModalVisible(true);
      }}
      style={styles.card}>
      {/* Image principale */}
      {item.foodPick && (
        <Image source={{uri: item.foodPick}} style={styles.cardImage} />
      )}

      {/* Infos principales */}
      <View style={{padding: 10}}>
        <Text style={styles.cardTitle}>{item.foodName}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardPrice}>
          Prix pour une personne: {item.price} FCFA
        </Text>
        <Text style={[styles.cardPrice]}>
          Prix pour votre Famille : {item.forFamilyPrice} FCFA
        </Text>
        {item.origine && (
          <Text style={styles.cardDetail}>Origine : {item.origine}</Text>
        )}
        {item.otherName && (
          <Text style={styles.cardDetail}>Autre nom : {item.otherName}</Text>
        )}
        {item.day && (
          <Text style={styles.cardDetail}>Jour prévu : {item.day}</Text>
        )}

        {/* Ingrédients */}
        <View style={{marginTop: 8}}>
          {item.foodIngredients?.slice(0, 2).map((ing, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}>
              {ing.ingredientImage && (
                <Image
                  source={{uri: ing.ingredientImage}}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    marginRight: 6,
                  }}
                />
              )}
              <Text style={{fontSize: 12, color: '#fff'}}>
                {ing.ingredientName} - {ing.price} FCFA
              </Text>
            </View>
          ))}

          {/* Plus d'ingrédients */}
          {item.foodIngredients.length > 2 && (
            <Text style={{fontSize: 12, fontStyle: 'italic', color: '#ddd'}}>
              ...et plus
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  async function fetchMenu() {
    if (!userId) return;
    try {
      const snapshot = await firestore()
        .collection(`users/${userId}/mymenu`)
        .get();
      const data = snapshot.docs.map(doc => {
        const raw = doc.data();
        return {
          id: doc.id,
          foodName: raw.foodName || '',
          foodPick: raw.foodPick || '',
          description: raw.description || '',
          foodIngredients: raw.foodIngredients || [],
          price: raw.price || 0,
          forFamilyPrice: (raw.price || 0) * familySize,
          origine: raw.origine || '',
          otherName: raw.otherName || '',
          day: raw.day || '',
        };
      });

      setMenus(data);
    } catch (error) {
      console.error('Erreur lors du chargement du menu :', error);
    }
  }
  const [searchVisible, setSearchVisible] = useState(false);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (!searchVisible) setSearchText('');
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.appBarTitle}>Mes recettes</Text>

      <TouchableOpacity onPress={toggleSearch}>
        <Feather name={searchVisible ? 'x' : 'search'} size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
  const totalPrice = ingredients.reduce((total, ing) => {
    const price = parseFloat(ing.price) || 0;
    return total + price;
  }, 0);

  return (
    <View style={styles.container}>
      {renderAppBar()}
      {searchVisible && (
        <TextInput
          placeholder="Rechercher un plat..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.searchInput, {marginTop: 10}]}
        />
      )}

      <FlatList
        data={filteredMenus}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        numColumns={1}
        ListEmptyComponent={() => (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: '#999'}}>
              Aucun plat trouvé. Ajoutez-en un !
            </Text>
          </View>
        )}
        contentContainerStyle={{paddingBottom: 100}}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[
          styles.plusButton,
          {position: 'absolute', right: 20, bottom: 30},
        ]}
        onPress={() => setModalVisible(true)}>
        <Text style={{color: '#fff', fontSize: 30}}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={[
            styles.overlay,
            {justifyContent: 'center', alignItems: 'center'},
          ]}>
          <View style={[styles.formContain, {width: '90%'}]}>
            <ScrollView>
              <Text style={styles.headerTitle}>
                {currentStep === 1
                  ? 'Étape 1: Infos du Plat'
                  : 'Étape 2: Ingrédients'}
              </Text>

              {currentStep === 1 ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du plat"
                    placeholderTextColor="#999"
                    value={foodName}
                    onChangeText={setFoodName}
                  />

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => pickImage(setFoodPick)}>
                    <Text style={{color: '#fff'}}>
                      {foodPick
                        ? 'Modifier l’image du plat'
                        : 'Choisir une image du plat'}
                    </Text>
                    <AntDesign name="camera" size={24} color="#fff" />
                  </TouchableOpacity>

                  {foodPick ? (
                    <Image
                      source={{uri: foodPick}}
                      style={{width: '100%', height: 200, marginVertical: 10}}
                    />
                  ) : null}

                  <TextInput
                    style={[styles.input, {height: 100}, {marginBottom: 20}]}
                    multiline
                    placeholder="Description du plat"
                    placeholderTextColor="#999"
                    value={description}
                    onChangeText={setDescription}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Origine du plat (optionnel)"
                    placeholderTextColor="#999"
                    value={foodOrigine}
                    onChangeText={setFoodOrigine}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Autre nom du plat (optionnel)"
                    placeholderTextColor="#999"
                    value={foodOtherName}
                    onChangeText={setFoodOtherName}
                  />
                
                 
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => setCurrentStep(2)}>
                    <Text style={{color: '#fff'}}>Suivant</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      {color: 'white'},
                      {fontWeight: 'bold'},
                      {fontSize: 15},
                    ]}>
                    Ingrédients
                  </Text>
                  <Text style={{color: 'white'}}>
                    Prix total: {totalPrice} FCFA
                  </Text>
                  <Text style={[{color: 'white'}, {marginBottom: 10}]}>
                    Prix pour votre Famille: {forFamilyPrice} FCFA
                  </Text>

                  {ingredients.map((ing, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 10,
                        justifyContent: 'space-between',
                      }}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: '#FFA500',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            marginRight: 10,
                          }}>
                          {ing.ingredientImage ? (
                            <Image
                              source={{uri: ing.ingredientImage}}
                              style={{width: 50, height: 50, borderRadius: 25}}
                            />
                          ) : (
                            <AntDesign name="plus" size={24} color="#fff" />
                          )}
                        </View>
                        <Text style={{color: '#fff'}}>
                          {ing.ingredientName} - {ing.price} FCFA
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeIngredient(index)}>
                        <AntDesign name="closecircleo" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TextInput
                    style={styles.input}
                    placeholder="Nom de l’ingrédient"
                    placeholderTextColor="#999"
                    value={newIngredient.ingredientName}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, ingredientName: text})
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Prix"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={newIngredient.price}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, price: text})
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Quantité"
                    placeholderTextColor="#999"
                    value={newIngredient.quantity}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, quantity: text})
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Unité (kg, g, etc.)"
                    placeholderTextColor="#999"
                    value={newIngredient.unite}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, unite: text})
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Origine de l’ingrédient"
                    placeholderTextColor="#999"
                    value={newIngredient.origine}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, origine: text})
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Autre nom de l’ingrédient"
                    placeholderTextColor="#999"
                    value={newIngredient.otherName}
                    onChangeText={text =>
                      setNewIngredient({...newIngredient, otherName: text})
                    }
                  />

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      pickImage(base64 =>
                        setNewIngredient({
                          ...newIngredient,
                          ingredientImage: base64,
                        }),
                      )
                    }>
                    <AntDesign name="camera" size={24} color="#fff" />
                    <Text style={{color: '#fff'}}>
                      Ajouter une image (optionnelle)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addIngredient}>
                    <AntDesign name="plus" size={24} color="#fff" />
                    <Text style={{color: '#fff'}}>Ajouter l’ingrédient</Text>
                  </TouchableOpacity>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <TouchableOpacity
                      style={[styles.saveButton, {flex: 1, marginRight: 8}]}
                      onPress={() => setCurrentStep(1)}>
                      <AntDesign name="back" size={24} color="#fff" />
                      <Text style={{color: '#fff'}}>Retour</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveButton, {flex: 1, marginLeft: 8}]}
                      onPress={handleSave}>
                      <AntDesign name="save" size={24} color="#fff" />
                      <Text style={{color: '#fff'}}>Enregistrer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => {
                  setModalVisible(false);
                  setCurrentStep(1);
                }}>
                <AntDesign name="close" size={24} color="#fff" />
                <Text style={{color: '#fff'}}>Annuler</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <CustomPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        type={popupType}
        message={popupMessage}
      />

      {selectedItemDetail && (
        <Modal
          visible={detailModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModalVisible(false)}>
          <View style={styles.overlay}>
            <View
              style={[styles.formContain, {width: '90%', maxHeight: '90%'}]}>
              {/* Icone de fermeture */}
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={{position: 'absolute', top: 10, right: 10, zIndex: 10}}>
                <AntDesign name="closecircleo" size={24} color="#fff" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.headerTitle}>
                  {selectedItemDetail?.foodName}
                </Text>

                {selectedItemDetail?.foodPick && (
                  <Image
                    source={{uri: selectedItemDetail.foodPick}}
                    style={styles.cardImage}
                  />
                )}

                <Text style={styles.cardPrice}>
                  Prix: {selectedItemDetail?.price} FCFA
                </Text>
                <Text style={styles.cardPrice}>
                  Famille: {selectedItemDetail?.forFamilyPrice} FCFA
                </Text>

                <View style={{marginTop: 10}}>
                  {selectedItemDetail?.foodIngredients?.map((ing, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}>
                      {ing.ingredientImage && (
                        <Image
                          source={{uri: ing.ingredientImage}}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            marginRight: 6,
                          }}
                        />
                      )}
                      <Text style={{fontSize: 12, color: '#fff'}}>
                        {ing.ingredientName} - {ing.price} FCFA
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Modifier */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    setDetailModalVisible(false);
                    navigation.navigate('EditScreen', {
                      item: selectedItemDetail,
                    });
                  }}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    Modifier le plat
                  </Text>
                </TouchableOpacity>

                {/* Supprimer */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Alert.alert(
                      'Confirmation',
                      'Voulez-vous vraiment supprimer ce plat ?',
                      [
                        {text: 'Annuler', style: 'cancel'},
                        {
                          text: 'Supprimer',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const user = auth().currentUser;
                              if (!user) return;

                              await firestore()
                                .collection('users')
                                .doc(user.uid)
                                .collection('mymenu')
                                .doc(selectedItemDetail.id)
                                .delete();

                              ToastAndroid.show(
                                'Plat supprimé',
                                ToastAndroid.SHORT,
                              );
                              setDetailModalVisible(false);
                              fetchMenu(); // rechargement du menu
                            } catch (error) {
                              console.error('Erreur suppression :', error);
                            }
                          },
                        },
                      ],
                      {cancelable: true},
                    );
                  }}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    Supprimer le plat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    setPlanModalVisible(true);
                    setSelectedItemToPlan(selectedItemDetail);
                    setDetailModalVisible(false);
                  }}>
                  <Text style={styles.detailButtonText}>Planifier</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={planModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View
            style={[styles.MformContain, {width: '80%', alignItems: 'center'}]}>
            <Text style={styles.headerTitle}>Planifier pour :</Text>

            <TouchableOpacity
              style={styles.MsaveButton}
              onPress={() => {
                setPlanningType('jour');
                planItem('jour');
                setPlanModalVisible(false);
              }}>
              <Text style={{color: '#fff'}}>Un jour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.MsaveButton}
              onPress={() => {
                setPlanningType('semaine');
              }}>
              <Text style={{color: '#fff'}}>La semaine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPlanModalVisible(false)}
              style={[styles.MremoveBtn, {marginTop: 10}]}>
              <Text style={{color: '#FFF'}}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
        {planningType === 'semaine' && (
          <View style={{marginTop: 20, width: '80%'}}>
            <Text>
              Choisissez la date pour la planification de la semaine :
            </Text>
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
              minimumDate={new Date()} // ne pas pouvoir sélectionner une date passée
            />

            <TouchableOpacity
              style={[styles.MsaveButton, {marginTop: 10}]}
              onPress={() => {
                planItem('semaine', date);
                setPlanModalVisible(false);
                setPlanningType(null);
              }}>
              <Text style={{color: '#fff'}}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
};

export default AddMenuPage;
