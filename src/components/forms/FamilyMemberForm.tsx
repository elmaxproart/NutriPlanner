import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { styles as onboardingStyles } from '../../styles/onboardingStyle';
import { MembreFamille } from '../../constants/entities';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { ModalComponent } from '../common/Modal';
import { launchImageLibrary } from 'react-native-image-picker';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { validateMembreFamille } from '../../utils/dataValidators'; // Assuming this utility exists
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

interface FamilyMemberFormProps {
  initialData?: Partial<MembreFamille>;
  onSave: (memberData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => void;
  onCancel: () => void; // Added onCancel prop
  loading?: boolean; // Added for external loading state
  isEditing?: boolean;
  userId: string;
  familyId: string;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading = false, // Default to false
  isEditing = false,
  userId,
  familyId,
}) => {
  // Initialize formData with default values to ensure no undefined properties
  const [formData, setFormData] = useState<Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>>(
    () => ({ // Use a function to ensure initial state is only computed once
      nom: initialData?.nom || '',
      prenom: initialData?.prenom || '',
      dateNaissance: initialData?.dateNaissance || '',
      genre: initialData?.genre || 'homme',
      role: initialData?.role || 'parent',
      preferencesAlimentaires: initialData?.preferencesAlimentaires || [],
      allergies: initialData?.allergies || [],
      restrictionsMedicales: initialData?.restrictionsMedicales || [],
      niveauAcces: initialData?.niveauAcces || 'membre',
      photoProfil: initialData?.photoProfil || '',
      historiqueRepas: initialData?.historiqueRepas || [],
      repasFavoris: initialData?.repasFavoris || [],
      contactUrgence: initialData?.contactUrgence || { nom: '', telephone: '' },
      aiPreferences: initialData?.aiPreferences || {
        niveauEpices: 0,
        apportCaloriqueCible: 0,
        cuisinesPreferees: [],
      },
      userId: userId, // Set default userId
      familyId: familyId, // Set default familyId
      createurId: initialData?.createurId || userId, // Set default creatorId
    })
  );

  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.photoProfil || null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false); // This will still trigger a modal, but deletion logic will be in parent
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update form data if initialData changes (for editing scenarios)
  useEffect(() => {
    if (initialData) {
      setFormData((prevData) => ({
        ...prevData,
        ...initialData,
        contactUrgence: initialData.contactUrgence || { nom: '', telephone: '' },
        aiPreferences: initialData.aiPreferences || {
          niveauEpices: 0,
          apportCaloriqueCible: 0,
          cuisinesPreferees: [],
        },
      }));
      setSelectedImage(initialData.photoProfil || null);
    }
  }, [initialData]);

  const handleImagePick = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImage(response.assets[0].uri);
        setFormData((prev) => ({ ...prev, photoProfil: response.assets ? response.assets[0].uri : '' }));
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    // Validate the formData before passing it up
    const validationErrors = validateMembreFamille(formData as MembreFamille); // Cast for validation
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join('\n'));
      setErrorModalVisible(true);
      return;
    }

    // Pass the prepared data to the parent's onSave function
    onSave(formData);
  }, [formData, onSave]);

  const handleDelete = useCallback(() => {
    // This form component does not directly delete.
    // It should trigger a callback to the parent if deletion is needed.
    // For now, let's just close the modal and log.
    setDeleteConfirmVisible(false);
    setErrorMessage('La suppression doit être implémentée au niveau de l\'écran parent.');
    setErrorModalVisible(true);
    // You might want to pass a prop like onDeleteConfirmed: (memberId: string) => void;
  }, []);

  const renderPreviewModal = () => (
    <ModalComponent
      visible={previewVisible}
      onClose={() => setPreviewVisible(false)}
      title={`Aperçu de ${formData.prenom} ${formData.nom}`}
    >
      <Animated.View entering={FadeInUp} exiting={FadeOutDown} style={formStyles.modalContent}>
        <Avatar
          size={100}
          source={selectedImage ? { uri: selectedImage } : (formData.photoProfil ? { uri: formData.photoProfil } : require('../../assets/images/ia.jpg'))}
          style={avatarContainerStyles.container}
        />
        <Text style={onboardingStyles.cardDescription}>
          Rôle: {formData.role}
        </Text>
        <Text style={onboardingStyles.cardDescription}>
          Âge: {formData.dateNaissance ? (new Date().getFullYear() - new Date(formData.dateNaissance).getFullYear()) : 'N/A'} ans
        </Text>
        <Text style={onboardingStyles.cardDescription}>
          Genre: {formData.genre}
        </Text>
        <Text style={onboardingStyles.cardDescription}>
          Préférences: {formData.preferencesAlimentaires.join(', ') || 'Aucune'}
        </Text>
        <Button
          title="Modifier"
          onPress={() => setPreviewVisible(false)}
          style={onboardingStyles.saveButton}
        />
        {isEditing && (
          <Button
            title="Supprimer"
            onPress={() => {
              setPreviewVisible(false);
              setDeleteConfirmVisible(true);
            }}
            style={onboardingStyles.removeBtn}
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
      <Animated.View entering={FadeInUp} exiting={FadeOutDown} style={formStyles.modalContent}>
        <Text style={formStyles.modalText}>
          Voulez-vous vraiment supprimer {formData.prenom} {formData.nom} ?
        </Text>
        <Button
          title="Confirmer"
          onPress={handleDelete}
          style={onboardingStyles.removeBtn}
        />
        <Button
          title="Annuler"
          onPress={() => setDeleteConfirmVisible(false)}
          style={onboardingStyles.skipButton}
        />
      </Animated.View>
    </ModalComponent>
  );

  const renderErrorModal = () => (
    <ModalComponent
      visible={errorModalVisible}
      onClose={() => setErrorModalVisible(false)}
      title="Erreur"
    >
      <Animated.View entering={FadeInUp} exiting={FadeOutDown} style={formStyles.modalContent}>
        <Text style={formStyles.errorText}>{errorMessage}</Text>
      </Animated.View>
    </ModalComponent>
  );

  return (
    <View style={formStyles.container}>
      {renderPreviewModal()}
      {renderDeleteConfirmModal()}
      {renderErrorModal()}
      <ScrollView style={formStyles.formContain}>
        <Text style={formStyles.headerTitle}>
          {isEditing ? 'Modifier un Membre' : 'Ajouter un Membre'}
        </Text>
        <TouchableOpacity onPress={handleImagePick} style={avatarContainerStyles.container}>
          <Avatar
            size={120}
            source={selectedImage ? { uri: selectedImage } : (formData.photoProfil ? { uri: formData.photoProfil } : require('../../assets/images/ia.jpg'))}
          />
          <Text style={onboardingStyles.welcomeText}>Changer Photo de Profil</Text>
        </TouchableOpacity>

        <Text style={formStyles.sectionTitle}>Informations Personnelles</Text>
        <Input
          value={formData.nom}
          onChangeText={(text) => setFormData({ ...formData, nom: text })}
          placeholder="Nom"
          iconName="account"
          iconPosition="left"
          style={onboardingStyles.input}
        />
        <Input
          value={formData.prenom}
          onChangeText={(text) => setFormData({ ...formData, prenom: text })}
          placeholder="Prénom"
          iconName="account"
          iconPosition="left"
          style={onboardingStyles.input}
        />
        <Input
          value={formData.dateNaissance}
          onChangeText={(text) => setFormData({ ...formData, dateNaissance: text })}
          placeholder="Date de Naissance (YYYY-MM-DD)"
          iconName="calendar"
          iconPosition="left"
          style={onboardingStyles.input}
          keyboardType="numeric"
        />
        <View style={onboardingStyles.input}>
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
        <View style={onboardingStyles.input}>
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
        <View style={onboardingStyles.input}>
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

        <Text style={formStyles.sectionTitle}>Préférences et Restrictions</Text>
        <Input
          value={formData.preferencesAlimentaires.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, preferencesAlimentaires: text.split(',').map(s => s.trim()) })}
          placeholder="Préférences Alimentaires (séparées par des virgules)"
          iconName="food"
          iconPosition="left"
          style={onboardingStyles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.allergies.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, allergies: text.split(',').map(s => s.trim()) })}
          placeholder="Allergies (séparées par des virgules)"
          iconName="alert"
          iconPosition="left"
          style={onboardingStyles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.restrictionsMedicales.join(', ')}
          onChangeText={(text) => setFormData({ ...formData, restrictionsMedicales: text.split(',').map(s => s.trim()) })}
          placeholder="Restrictions Médicales (séparées par des virgules)"
          iconName="hospital-box"
          iconPosition="left"
          style={onboardingStyles.input}
          multiline
          numberOfLines={2}
        />

        <Text style={formStyles.sectionTitle}>Informations Complémentaires</Text>
        <Input
          value={formData.repasFavoris?.join(', ') || ''}
          onChangeText={(text) => setFormData({ ...formData, repasFavoris: text.split(',').map(s => s.trim()) })}
          placeholder="Repas Favoris (séparées par des virgules)"
          iconName="heart"
          iconPosition="left"
          style={onboardingStyles.input}
          multiline
          numberOfLines={2}
        />
        <Input
          value={formData.contactUrgence.nom}
          onChangeText={(text) =>
            setFormData((prevData) => ({
              ...prevData,
              contactUrgence: { ...prevData.contactUrgence, nom: text },
            }))
          }
          placeholder="Nom du Contact d'Urgence"
          iconName="account-box"
          iconPosition="left"
          style={onboardingStyles.input}
        />
        <Input
          value={formData.contactUrgence.telephone}
          onChangeText={(text) =>
            setFormData((prevData) => ({
              ...prevData,
              contactUrgence: { ...prevData.contactUrgence, telephone: text },
            }))
          }
          placeholder="Téléphone du Contact d'Urgence"
          iconName="phone"
          iconPosition="left"
          style={onboardingStyles.input}
          keyboardType="phone-pad"
        />
        <Input
          value={formData.aiPreferences.niveauEpices.toString()}
          onChangeText={(text) =>
            setFormData((prevData) => ({
              ...prevData,
              aiPreferences: { ...prevData.aiPreferences, niveauEpices: parseInt(text, 10) || 0 },
            }))
          }
          placeholder="Niveau d'Épices (1-5)"
          iconName="fire"
          iconPosition="left"
          style={onboardingStyles.input}
          keyboardType="numeric"
        />
        <Input
          value={formData.aiPreferences.apportCaloriqueCible.toString()}
          onChangeText={(text) =>
            setFormData((prevData) => ({
              ...prevData,
              aiPreferences: { ...prevData.aiPreferences, apportCaloriqueCible: parseInt(text, 10) || 0 },
            }))
          }
          placeholder="Apport Calorique Cible (kcal)"
          iconName="scale"
          iconPosition="left"
          style={onboardingStyles.input}
          keyboardType="numeric"
        />
        <Input
          value={formData.aiPreferences.cuisinesPreferees.join(', ')}
          onChangeText={(text) =>
            setFormData((prevData) => ({
              ...prevData,
              aiPreferences: { ...prevData.aiPreferences, cuisinesPreferees: text.split(',').map(s => s.trim()) },
            }))
          }
          placeholder="Cuisines Préférées (séparées par des virgules)"
          iconName="globe"
          iconPosition="left"
          style={onboardingStyles.input}
          multiline
          numberOfLines={2}
        />

        {loading && (
          <View style={formStyles.formLoadingOverlay}>
            <ActivityIndicator size="large" color="#f7b733" />
            <Text style={formStyles.formLoadingText}>Sauvegarde...</Text>
          </View>
        )}

        <Button title="Sauvegarder" onPress={handleSave} style={onboardingStyles.saveButton} />
        <Button title="Aperçu" onPress={() => setPreviewVisible(true)} style={onboardingStyles.detailButton} />
        {isEditing && (
          <Button
            title="Supprimer"
            onPress={() => setDeleteConfirmVisible(true)}
            style={onboardingStyles.removeBtn}
          />
        )}
        <Button title="Fermer" onPress={onCancel} style={onboardingStyles.skipButton} />
      </ScrollView>
    </View>
  );
};

export default FamilyMemberForm;

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d', // Use a consistent background
  },
  formContain: {
    padding: 20,
    flexGrow: 1, // Allow content to grow
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7b733', // Use accent color
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  modalContent: {
    alignItems: 'center', // Center content in modals
  },
  modalText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  formLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Ensure it's on top
    borderRadius: 15, // Match card styles
  },
  formLoadingText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 10,
  },
});
