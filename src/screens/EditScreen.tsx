import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {styles} from '../styles/addPageStyle';

type Ingredient = {
  ingredientImage?: string;
  ingredientName: string;
  price: string;
};

type MenuItem = {
  id: string;
  foodName: string;
  foodPick: string;
  description: string;
  foodIngredients: Ingredient[];
  price: number;
  forFamilyPrice: number;
};

const EditScreen: React.FC<{route: any; navigation: any}> = ({
  route,
  navigation,
}) => {
  const {item}: {item: MenuItem} = route.params;
  const userId = auth().currentUser?.uid;
  const [foodName, setFoodName] = useState(item.foodName);
  const [foodPick, setFoodPick] = useState(item.foodPick);
  const [description, setDescription] = useState(item.description);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    item.foodIngredients || [],
  );
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    ingredientName: '',
    price: '',
  });
  const [currentStep, setCurrentStep] = useState(1);

  const pickImage = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true}, response => {
      if (response.assets && response.assets[0]?.base64) {
        setFoodPick(
          `data:${response.assets[0].type};base64,${response.assets[0].base64}`,
        );
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer l’image.');
      }
    });
  };

  const addIngredient = () => {
    if (newIngredient.ingredientName && newIngredient.price) {
      setIngredients([...ingredients, newIngredient]);
      setNewIngredient({ingredientName: '', price: ''});
    } else {
      Alert.alert('Erreur', 'Nom et prix obligatoires.');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    if (!foodName || !foodPick || ingredients.length === 0) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    const price = ingredients.reduce(
      (sum, ing) => sum + parseFloat(ing.price || '0'),
      0,
    );
    const familySnapshot = await firestore()
      .collection(`users/${userId}/family`)
      .get();
    const familySize = familySnapshot.size || 1;

    try {
      await firestore()
        .collection(`users/${userId}/mymenu`)
        .doc(item.id)
        .update({
          foodName,
          foodPick,
          description,
          foodIngredients: ingredients,
          price,
          forFamilyPrice: price * familySize,
        });
      Alert.alert('Succès', 'Plat mis à jour avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Mise à jour échouée.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.formContain,{flex:1}]}>
      <Text style={styles.headerTitle}>
        {currentStep === 1 ? 'Étape 1: Infos Plat' : 'Étape 2: Ingrédients'}
      </Text>

      {currentStep === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nom du plat"
            value={foodName}
            onChangeText={setFoodName}
          />
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <Text style={{color: '#fff'}}>
              {foodPick ? 'Changer image' : 'Choisir image'}
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
            style={[styles.input, {height: 100}]}
            placeholder="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setCurrentStep(2)}>
            <Text style={{color: '#fff'}}>Suivant</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {ingredients.map((ing, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text style={{color: '#000'}}>
                {ing.ingredientName} - {ing.price} FCFA
              </Text>
              <TouchableOpacity onPress={() => removeIngredient(index)}>
                <AntDesign name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{marginTop: 10}}>
            <TextInput
              style={styles.input}
              placeholder="Nom ingrédient"
              value={newIngredient.ingredientName}
              onChangeText={text =>
                setNewIngredient({...newIngredient, ingredientName: text})
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Prix ingrédient"
              keyboardType="numeric"
              value={newIngredient.price}
              onChangeText={text =>
                setNewIngredient({...newIngredient, price: text})
              }
            />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Text style={{color: '#fff'}}>Ajouter ingrédient</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
            <Text style={{color: '#fff'}}>Enregistrer les modifications</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default EditScreen;
