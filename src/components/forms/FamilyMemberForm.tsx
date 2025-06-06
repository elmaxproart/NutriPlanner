import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { styles } from '../../styles/onboardingStyle';
import { useFamilyData } from '../../hooks/useFamilyData';
import { MembreFamille } from '../../constants/entities';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { ModalComponent } from '../common/Modal';
import { launchImageLibrary } from 'react-native-image-picker';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { UserRole } from '../../constants/categories';

const pickerStyles = StyleSheet.create({
  picker: {
    color: '#fff',
  },
});

const avatarContainerStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 20,
  },
});

const FamilyMemberForm: React.FC<{
  member?: MembreFamille;
  userId: string;
  familyId: string;
  onSave: (member: MembreFamille) => void;
  onClose: () => void;
  isEditing?: boolean;
}> = ({ member, userId, familyId, onSave, onClose, isEditing = false }) => {
  const { addFamilyMember, updateFamilyMember } = useFamilyData(userId, familyId);

  const [formData, setFormData] = useState<MembreFamille>(
    member || {
      id: '',
      familyId,
      createurId: userId,
      dateCreation: new Date().toISOString(),
      userId: '',
      nom: '',
      prenom: '',
      dateNaissance: '',
      genre: 'homme',
      role: 'parent',
      preferencesAlimentaires: [],
      allergies: [],
      restrictionsMedicales: [],
      niveauAcces: 'membre',
      photoProfil: '',
      historiqueRepas: [],
      repasFavoris: [],
      contactUrgence: { nom: '', telephone: '' }, // Non optionnel dans l'état initial
      aiPreferences: { // Non optionnel dans l'état initial
        niveauEpices: 0,
        apportCaloriqueCible: 0,
        cuisinesPreferees: [],
      },
    }
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        ...member,
        contactUrgence: member.contactUrgence || { nom: '', telephone: '' },
        aiPreferences: member.aiPreferences || {
          niveauEpices: 0,
          apportCaloriqueCible: 0,
          cuisinesPreferees: [],
        },
      });
    }
  }, [member]);

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImage(response.assets[0].uri);
        setFormData({ ...formData, photoProfil: response.assets[0].uri });
      }
    });
  };

  const handleSave = async () => {
    if (!formData.nom || !formData.prenom || !formData.dateNaissance) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Date de Naissance).');
      setErrorModalVisible(true);
      return;
    }

    try {
      const updatedMember: MembreFamille = {
        ...formData,
        dateMiseAJour: new Date().toISOString(),
      };
      if (isEditing && member?.id) {
        await updateFamilyMember(member.id, updatedMember);
      } else {
        await addFamilyMember(updatedMember);
      }
      onSave(updatedMember);
      onClose();
    } catch (error) {
      setErrorMessage('Impossible de sauvegarder le membre. Veuillez réessayer.');
      setErrorModalVisible(true);
    }
  };

  const handleDelete = async () => {
    try {
      if (member?.id) {
        // Implémenter la suppression via useFamilyData si nécessaire
        setDeleteConfirmVisible(false);
        onClose();
      }
    } catch (error) {
      setErrorMessage('Impossible de supprimer le membre. Veuillez réessayer.');
      setErrorModalVisible(true);
    }
  };

  const renderPreviewModal = () => (
    <ModalComponent
      visible={previewVisible}
      onClose={() => setPreviewVisible(false)}
      title={`Aperçu de ${formData.prenom} ${formData.nom}`}
    >
      <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
        <Avatar
          size={100}
          source={{ uri: selectedImage || formData.photoProfil || undefined }}
          style={avatarContainerStyles.container}
        />
        <Text style={styles.cardDescription}>
          Rôle: {formData.role}
        </Text>
        <Text style={styles.cardDescription}>
          Âge: {formData.dateNaissance ? (new Date().getFullYear() - new Date(formData.dateNaissance).getFullYear()) : 'N/A'} ans
        </Text>
        <Text style={styles.cardDescription}>
          Genre: {formData.genre}
        </Text>
        <Text style={styles.cardDescription}>
          Préférences: {formData.preferencesAlimentaires.join(', ') || 'Aucune'}
        </Text>
        <Button
          title="Modifier"
          onPress={() => setPreviewVisible(false)}
          style={styles.saveButton}
        />
        {isEditing && (
          <Button
            title="Supprimer"
            onPress={() => {
              setPreviewVisible(false);
              setDeleteConfirmVisible(true);
            }}
            style={styles.removeBtn}
          />
        )}
      </Animated.View>
    </ModalComponent>
  );

  const renderDeleteConfirmModal = () => (
    <ModalComponent
      visible={deleteConfirmVisible}
      onClose={() => setDeleteConfirmVisible(false)}
      title="Confirmer la Suppression"
    >
      <Text style={styles.modalText}>
        Voulez-vous vraiment supprimer {formData.prenom} {formData.nom} ?
      </Text>
      <Button
        title="Confirmer"
        onPress={handleDelete}
        style={styles.removeBtn}
      />
      <Button
        title="Annuler"
        onPress={() => setDeleteConfirmVisible(false)}
        style={styles.skipButton}
      />
    </ModalComponent>
  );

  const renderErrorModal = () => (
    <ModalComponent
      visible={errorModalVisible}
      onClose={() => setErrorModalVisible(false)}
      title="Erreur"
    >
      <Text style={styles.errorText}>{errorMessage}</Text>
    </ModalComponent>
  );

  return (
    <View style={styles.container}>
      {renderPreviewModal()}
      {renderDeleteConfirmModal()}
      {renderErrorModal()}
      <ScrollView style={styles.formContain}>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier un Membre' : 'Ajouter un Membre'}
        </Text>
        <TouchableOpacity onPress={handleImagePick} style={avatarContainerStyles.container}>
          <Avatar
            size={120}
            source={{ uri: selectedImage || formData.photoProfil || undefined }}
          />
          <Text style={styles.welcomeText}>Changer Photo de Profil</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        <Input
          value={formData.nom}
          onChangeText={(text) => setFormData({ ...formData, nom: text })}
          placeholder="Nom"
          iconName="account"
          iconPosition="left"
          style={styles.input}
        />
        <Input
          value={formData.prenom}
          onChangeText={(text) => setFormData({ ...formData, prenom: text })}
          placeholder="Prénom"
          iconName="account"
          iconPosition="left"
          style={styles.input}
        />
        <Input
          value={formData.dateNaissance}
          onChangeText={(text) => setFormData({ ...formData, dateNaissance: text })}
          placeholder="Date de Naissance (YYYY-MM-DD)"
          iconName="calendar"
          iconPosition="left"
          style={styles.input}
          keyboardType="numeric"
        />
        <View style={styles.input}>
          <Picker
            selectedValue={formData.genre}
            onValueChange={(itemValue: 'homme' | 'femme' | 'autre') =>
              setFormData({ ...formData, genre: itemValue })
            }
            style={pickerStyles.picker}
          >
            <Picker.Item label="Homme" value="homme" />
            <Picker.Item label="Femme" value="femme" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>
        </View>
        <View style={styles.input}>
          <Picker
            selectedValue={formData.role}
            onValueChange={(itemValue: UserRole) =>
              setFormData({ ...formData, role: itemValue })
            }
            style={pickerStyles.picker}
          >
            <Picker.Item label="Parent" value="parent" />
            <Picker.Item label="Enfant" value="enfant" />
            <Picker.Item label="Conjoint" value="conjoint" />
            <Picker.Item label="Autre" value="autre" />
          </Picker>
        </View>
        <View style={styles.input}>
          <Picker
            selectedValue={formData.niveauAcces}
            onValueChange={(itemValue: 'admin' | 'membre') =>
              setFormData({ ...formData, niveauAcces: itemValue })
            }
            style={pickerStyles.picker}
          >
            <Picker.Item label="Administrateur" value="admin" />
            <Picker.Item label="Membre" value="membre" />
          </Picker>
        </View>
        <Text style={styles.sectionTitle}>Préférences et Restrictions</Text>
        <Input
          value={formData.preferencesAlimentaires.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, preferencesAlimentaires: text.split(',').map(s => s.trim()) })}
          placeholder="Préférences Alimentaires (séparées par des virgules)"
          iconName="food"
          iconPosition="left"
          style={styles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.allergies.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, allergies: text.split(',').map(s => s.trim()) })}
          placeholder="Allergies (séparées par des virgules)"
          iconName="alert"
          iconPosition="left"
          style={styles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.restrictionsMedicales.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, restrictionsMedicales: text.split(',').map(s => s.trim()) })}
          placeholder="Restrictions Médicales (séparées par des virgules)"
          iconName="hospital-box"
          iconPosition="left"
          style={styles.input}
          multiline
          numberOfLines={2}
        />
        <Text style={styles.sectionTitle}>Informations Complémentaires</Text>
        <Input
          value={formData.repasFavoris?.join(', ') || ''}
          onChangeText={(text) => setFormData({ ...formData, repasFavoris: text.split(',').map(s => s.trim()) })}
          placeholder="Repas Favoris (séparés par des virgules)"
          iconName="heart"
          iconPosition="left"
          style={styles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.contactUrgence.nom}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              contactUrgence: {
                nom: text,
                telephone: formData.contactUrgence.telephone,
              },
            })
          }
          placeholder="Nom du Contact d'Urgence"
          iconName="account-box"
          iconPosition="left"
          style={styles.input}
        />
        <Input
          value={formData.contactUrgence.telephone}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              contactUrgence: {
                nom: formData.contactUrgence.nom,
                telephone: text,
              },
            })
          }
          placeholder="Téléphone du Contact d'Urgence"
          iconName="phone"
          iconPosition="left"
          style={styles.input}
          keyboardType="phone-pad"
        />
        <Input
          value={formData.aiPreferences.niveauEpices.toString()}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              aiPreferences: {
                niveauEpices: parseInt(text, 10) || 0,
                apportCaloriqueCible: formData.aiPreferences.apportCaloriqueCible,
                cuisinesPreferees: formData.aiPreferences.cuisinesPreferees,
              },
            })
          }
          placeholder="Niveau d'Épices (1-5)"
          iconName="fire"
          iconPosition="left"
          style={styles.input}
          keyboardType="numeric"
        />
        <Input
          value={formData.aiPreferences.apportCaloriqueCible.toString()}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              aiPreferences: {
                niveauEpices: formData.aiPreferences.niveauEpices,
                apportCaloriqueCible: parseInt(text, 10) || 0,
                cuisinesPreferees: formData.aiPreferences.cuisinesPreferees,
              },
            })
          }
          placeholder="Apport Calorique Cible (kcal)"
          iconName="scale"
          iconPosition="left"
          style={styles.input}
          keyboardType="numeric"
        />
        <Input
          value={formData.aiPreferences.cuisinesPreferees.join(', ')}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              aiPreferences: {
                niveauEpices: formData.aiPreferences.niveauEpices,
                apportCaloriqueCible: formData.aiPreferences.apportCaloriqueCible,
                cuisinesPreferees: text.split(',').map(s => s.trim()),
              },
            })
          }
          placeholder="Cuisines Préférées (séparées par des virgules)"
          iconName="globe"
          iconPosition="left"
          style={styles.input}
          multiline
          numberOfLines={2}
        />
        <Button title="Sauvegarder" onPress={handleSave} style={styles.saveButton} />
        <Button title="Aperçu" onPress={() => setPreviewVisible(true)} style={styles.detailButton} />
        {isEditing && (
          <Button
            title="Supprimer"
            onPress={() => setDeleteConfirmVisible(true)}
            style={styles.removeBtn}
          />
        )}
        <Button title="Fermer" onPress={onClose} style={styles.skipButton} />
      </ScrollView>
    </View>
  );
};

export default FamilyMemberForm;
