import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Alert, Platform} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import {styles, lightStyles, darkStyles} from '../styles/ProfileStyle';

export default function ProfileScreen({navigation}: any) {
  const [lightTheme, setDarkTheme] = useState(true);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([
    {
      id: Date.now(),
      fullName: '',
      age: '',
      allergies: [],
      doctorNote: false,
      vegan: false,
      imageUrl: 'https://example.com/default-profile.png',
      email: '',      
    },
  ]);

  //charger le nom d'utilisateur et l'image de profil
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser?.email) {
      const usernameFromEmail = currentUser.email.split('@')[0];
      setUserName(usernameFromEmail.replace(/[^a-zA-Z0-9]/g, ''));

      firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get()
        .then(doc => {
          if (doc.exists() && doc.data()?.userImageProfile) {
            setProfileImage(doc.data()?.userImageProfile);
          }
        });
    }
  }, []);

  //charger les membres de la famille
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get()
        .then(doc => {
          if (doc.exists() && doc.data()?.family) {
            setFamilyMembers(doc.data()?.family);
          }
        });
    }
  }, []);

  const toggleTheme = () => setDarkTheme(!lightTheme);
  const toggleLanguage = () =>
    setLanguage(prev => (prev === 'fr' ? 'en' : 'fr'));
  const themeStyles = lightTheme ? darkStyles : lightStyles;
  const [isLoding, setIsloding] = React.useState(false);

  const addMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        fullName: '',
        age: '',
        allergies: {nom: '', description: ''},
        doctorNote: false,
        vegan: false,
        imageUrl: '',
        email: '',
      },
    ]);
  };

  const updateMember = (index: number, field: string, value: any) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const updateAllergy = (
    memberIndex: number,
    allergyIndex: number,
    key: 'nom' | 'description',
    value: string,
  ) => {
    const updated = [...familyMembers];
    updated[memberIndex].allergies[allergyIndex][key] = value;
    setFamilyMembers(updated);
  };
  const removeAllergy = (memberIndex: number, allergyIndex: number) => {
    const updated = [...familyMembers];
    updated[memberIndex].allergies.splice(allergyIndex, 1);
    setFamilyMembers(updated);
  };

  const addAllergy = (memberIndex: number) => {
    const updated = [...familyMembers];
    updated[memberIndex].allergies.push({nom: '', description: ''});
    setFamilyMembers(updated);
  };

  const uploadImage = async (index: number) => {
    Alert.alert(
      'Choisir une option',
      'Voulez-vous prendre une photo ou en choisir une dans la galerie ?',
      [
        {
          text: 'Caméra',
          onPress: async () => {
            const result = await launchCamera({mediaType: 'photo'});
            handleImageResult(result, index);
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const result = await launchImageLibrary({mediaType: 'photo'});
            handleImageResult(result, index);
          },
        },
        {text: 'Annuler', style: 'cancel'},
      ],
    );
  };
  const handleImageResult = async (result: any, index: number) => {
    if (!result?.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    if (!uri) {
      Alert.alert('Erreur', 'Image non sélectionnée.');
      return;
    }

    try {
      const path = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;

      // Lire l'image et convertir en base64
      const base64Image = await RNFS.readFile(path, 'base64');
      const dataUri = `data:${asset.type};base64,${base64Image}`;
      setUploadProgress(100);
      // Mettre à jour le membre avec la base64 dans `imageUrl`
      const updated = [...familyMembers];
      updated[index].imageUrl = dataUri;
      setFamilyMembers(updated);
    } catch (error: any) {
      console.error('Lecture de l’image échouée:', error);
      Alert.alert('Erreur', `Impossible de lire l’image : ${error.message}`);
    }
  };
  const changeProfileImage = async () => {
    Alert.alert(
      'Choisir une option',
      'Voulez-vous prendre une photo ou en choisir une dans la galerie ?',
      [
        {
          text: 'Caméra',
          onPress: async () => {
            const result = await launchCamera({mediaType: 'photo'});
            handleProfileImageResult(result);
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const result = await launchImageLibrary({mediaType: 'photo'});
            handleProfileImageResult(result);
          },
        },
        {text: 'Annuler', style: 'cancel'},
      ],
    );
  };

  const handleProfileImageResult = async (result: any) => {
    if (!result?.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    const uri = asset.uri;

    if (!uri) {
      Alert.alert('Erreur', 'Image non sélectionnée.');
      return;
    }

    try {
      const path = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const base64Image = await RNFS.readFile(path, 'base64');
      const dataUri = `data:${asset.type};base64,${base64Image}`;
      setProfileImage(dataUri);
      setUploadProgress(100);
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('users').doc(currentUser.uid).set(
          {
            userImageProfile: dataUri,
          },
          {merge: true},
        );
      }
    } catch (error: any) {
      console.error('Erreur image de profil:', error);
      Alert.alert('Erreur', 'Impossible de charger l’image.');
    }
  };

  const saveFamily = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    try {
      await firestore().collection('users').doc(currentUser.uid).set(
        {
          family: familyMembers,
        },
        {merge: true},
      );
      Alert.alert('Succès', 'Famille sauvegardée !');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde.');
    }
  };

  const removeMember = (index: number) => {
    const updated = [...familyMembers];
    updated.splice(index, 1);
    setFamilyMembers(updated);
  };

  const logoutUser = async () => {
    try {
      setIsloding(true);
      await auth().signOut();
      setIsloding(false);
      Alert.alert('Déconnecté !');
      navigation.navigate('Login');
    } catch (e: any) {
      setIsloding(false);
      Alert.alert('Déconnexion échouée !\n' + e.message);
    }
  };
  const handleLogout = async () => {
    await logoutUser();
    navigation.replace('Login');
  };

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Oui', onPress: handleLogout},
    ]);
  };

  if (isLoding) {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
        }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={lightTheme ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, themeStyles.text]}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 60}}>
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={() => changeProfileImage()}>
            {profileImage ? (
              <Image source={{uri: profileImage}} style={styles.memberImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="camera-plus-outline" size={30} color="#aaa" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.userName, themeStyles.text]}>
            {userName || 'Utilisateur'}
          </Text>
        </View>

        <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton}>
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={[styles.optionRow, themeStyles.border]}>
          <Text style={[styles.optionLabel, themeStyles.text]}>
            Thème sombre
          </Text>
          <Switch value={lightTheme} onValueChange={toggleTheme} />
        </View>

        <View style={[styles.optionRow, themeStyles.border]}>
          <Text style={[styles.optionLabel, themeStyles.text]}>
            Langue : {language.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={toggleLanguage}>
            <Text style={[styles.languageSwitch]}>
              {language === 'fr' ? 'EN' : 'FR'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.optionLabel, themeStyles.text]}>
          Membres de la famille
        </Text>

        {familyMembers.map((member, index) => (
          <View key={index} style={[{marginVertical: 10}, styles.formContain]}>
            <Icon
              name="trash-can-outline"
              onPress={() => removeMember(index)}
              size={25}
              color="#D9534F"
            />

            <TouchableOpacity onPress={() => uploadImage(index)}>
              {member.imageUrl ? (
                <Image
                  source={{uri: member.imageUrl}}
                  style={styles.memberImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera-plus-outline" size={30} color="#aaa" />
                </View>
              )}
            </TouchableOpacity>
            {uploadProgress !== null && (
              <View style={{marginVertical: 10, alignItems: 'center'}}>
                <Text>Upload : {Math.round(uploadProgress)}%</Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[styles.progressBar, {width: `${uploadProgress}%`}]}
                  />
                </View>
              </View>
            )}

            <TextInput
              style={[styles.input, themeStyles.text]}
              placeholder="Nom complet"
              value={member.fullName}
              onChangeText={text => updateMember(index, 'fullName', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, themeStyles.text]}
              placeholder="Âge"
              keyboardType="numeric"
              value={member.age}
              onChangeText={text => updateMember(index, 'age', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, themeStyles.text]}
              placeholder="Email"
              value={member.email}
              onChangeText={text => updateMember(index, 'email', text)}
              placeholderTextColor="#aaa"
            />
            <View style={[styles.optionRow, themeStyles.border]}>
              <Text style={[styles.optionLabel, themeStyles.text]}>
                Exigence médicale ?
              </Text>
              <Switch
                value={member.doctorNote}
                onValueChange={value =>
                  updateMember(index, 'doctorNote', value)
                }
              />
            </View>

            {member.doctorNote && (
              <View>
                <Text style={[styles.optionLabel, themeStyles.text]}>
                  Allergies
                </Text>
                {member.allergies.map((allergy: any, allergyIndex: number) => (
                  <View key={allergyIndex}>
                    <TextInput
                      style={[styles.input, themeStyles.text]}
                      placeholder="Nom de l'allergie"
                      value={allergy.nom}
                      onChangeText={text =>
                        updateAllergy(index, allergyIndex, 'nom', text)
                      }
                      placeholderTextColor="#aaa"
                    />
                    <TextInput
                      style={[styles.input, themeStyles.text]}
                      placeholder="Description de l'allergie"
                      value={allergy.description}
                      onChangeText={text =>
                        updateAllergy(index, allergyIndex, 'description', text)
                      }
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                      onPress={() => removeAllergy(index, allergyIndex)}
                      style={styles.removeBtn}>
                      <Icon name="close" size={25} color="#fff" />
                      <Text style={{color: '#fff', marginLeft: 5}}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => addAllergy(index)}
                  style={styles.addButton}>
                  <Icon name="plus" size={30} color="#fff" />
                  <Text style={{color: '#fff', marginLeft: 5}}>
                    Ajouter une allergie
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.optionRow, themeStyles.border]}>
              <Text style={[styles.optionLabel, themeStyles.text]}>
                Végane ?
              </Text>
              <Switch
                value={member.vegan}
                onValueChange={value => updateMember(index, 'vegan', value)}
              />
            </View>
          </View>
        ))}
        <TouchableOpacity onPress={addMember} style={styles.addButton}>
          <Icon name="account-plus" size={30} color="#fff" />
          <Text style={{color: '#fff', marginLeft: 5}}>Ajouter un membre</Text>
        </TouchableOpacity>

        {familyMembers.length > 0 && (
          <TouchableOpacity onPress={saveFamily} style={styles.saveButton}>
            <Icon name="content-save" size={20} color="#fff" />
            <Text style={{color: '#fff', marginLeft: 5}}>Sauvegarder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
