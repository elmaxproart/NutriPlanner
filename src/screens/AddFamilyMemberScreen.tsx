import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

import FamilyMemberForm from '../components/forms/FamilyMemberForm';
import { ModalComponent } from '../components/common/Modal';

import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { MembreFamille } from '../constants/entities';
import { generateId } from '../utils/helpers';

type AddFamilyMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddFamilyMember'>;

interface AddFamilyMemberScreenProps {
  navigation: AddFamilyMemberScreenNavigationProp;
}

const AddFamilyMemberScreen: React.FC<AddFamilyMemberScreenProps> = ({ navigation }) => {
  const { userId } = useAuth();
  const familyId = generateId('family');

  const { addFamilyMember, loading, error } = useFamilyData(userId || '', familyId);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Effect to show error modal if useFamilyData reports an error
  React.useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setIsErrorModalVisible(true);
    }
  }, [error]);

  const handleSaveMember = async (formData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    // The formData already includes userId, familyId, createurId from the form
    const newMemberData: Omit<MembreFamille, 'id' | 'dateMiseAJour'> = { // Removed dateCreation from Omit as it's set in form
      ...formData,
      dateCreation: new Date().toISOString(), // Ensure dateCreation is set here or in the form
    };

    const memberId = await addFamilyMember(newMemberData);
    if (memberId) {
      setSuccessMessage('Membre de la famille ajouté avec succès !');
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        navigation.goBack(); // Navigate back after success
      }, 1500);
    } else {
      // Error message is already handled by useFamilyData and propagated to 'error' state
      // If addFamilyMember returns null without setting an error, use a generic message
      if (!error) { // Only set generic message if no specific error from hook
        setErrorMessage('Une erreur inattendue est survenue lors de l\'ajout du membre.');
        setIsErrorModalVisible(true);
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack(); // Navigate back
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un membre</Text>
        <View style={styles.headerRightPlaceholder} /> {/* Replaced inline style */}
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f7b733" />
            <Text style={styles.loadingText}>Ajout du membre...</Text>
          </View>
        ) : (
          <FamilyMemberForm
            userId={userId || ''}
            familyId={familyId}
            onSave={handleSaveMember} // Correct prop name
            onCancel={handleCancel}
            loading={loading} // Pass loading state to form
          />
        )}
      </ScrollView>

      {/* Success Modal */}
      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
      >
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>

      {/* Error Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginTop: 20, // Adjust for SafeAreaView/StatusBar
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRightPlaceholder: { // New style for placeholder
    width: 24, // Consistent width
  },
  formContainer: {
    flexGrow: 1,
    // The FamilyMemberForm has its own padding, so remove padding here
    // padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AddFamilyMemberScreen;
