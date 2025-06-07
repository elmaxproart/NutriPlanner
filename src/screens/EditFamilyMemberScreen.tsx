import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData'; // This hook is expected to handle Firestore operations
import FamilyMemberForm from '../components/forms/FamilyMemberForm'; // Your FamilyMemberForm component
import { ModalComponent } from '../components/common/Modal'; // Your ModalComponent
import { MembreFamille } from '../constants/entities'; // Your MembreFamille entity
import AntDesign from 'react-native-vector-icons/AntDesign'; // Icon library
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App'; // Adjust path if needed

type EditFamilyMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditFamilyMember'>;
type EditFamilyMemberScreenRouteProp = RouteProp<RootStackParamList, 'EditFamilyMember'>;

interface EditFamilyMemberScreenProps {
  navigation: EditFamilyMemberScreenNavigationProp;
  route: EditFamilyMemberScreenRouteProp;
}

const EditFamilyMemberScreen: React.FC<EditFamilyMemberScreenProps> = ({ navigation, route }) => {
  const { memberId } = route.params; // Get memberId from navigation params
  const { userId } = useAuth(); // Get current userId from useAuth

  // --- IMPORTANT ---
  // You need a valid familyId here. If it's not dynamically obtained from user profile
  // (which you explicitly don't want to use), you must provide it from another source.
  // For this example, I'm using a placeholder 'your_hardcoded_family_id_here'.
  // In a real app, this should come from user's authenticated family context.
  const hardcodedFamilyId = 'your_hardcoded_family_id_here'; // <--- REMEMBER TO CHANGE THIS!

  const { familyMembers, loading: familyLoading, error: familyError, updateFamilyMember } = useFamilyData(userId || '', hardcodedFamilyId);

  const [memberToEdit, setMemberToEdit] = useState<MembreFamille | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // Local state for the update operation itself

  // Effect to find the member to edit from the fetched family members
  useEffect(() => {
    if (familyMembers && memberId) {
      const foundMember = familyMembers.find(m => m.id === memberId);
      if (foundMember) {
        setMemberToEdit(foundMember);
      } else {
        setErrorMessage('Membre de la famille introuvable pour édition.');
        setIsErrorModalVisible(true);
      }
    }
  }, [familyMembers, memberId]);

  // Effect to display errors from useFamilyData hook
  useEffect(() => {
    if (familyError) {
      setErrorMessage(familyError);
      setIsErrorModalVisible(true);
    }
  }, [familyError]);

  // Callback to handle data submitted from FamilyMemberForm
  const handleSubmit = useCallback(async (formData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    if (!memberToEdit) {
      setErrorMessage('Aucun membre sélectionné pour la mise à jour. Veuillez recharger l\'écran.');
      setIsErrorModalVisible(true);
      return;
    }
    if (!userId || !hardcodedFamilyId) {
        setErrorMessage('Erreur: Identifiants utilisateur ou famille manquants.');
        setIsErrorModalVisible(true);
        return;
    }

    setIsUpdating(true); // Start showing the update loading overlay
    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages

    try {
      // The `formData` comes directly from the FamilyMemberForm
      // The `memberToEdit.id` is the ID of the document to update
      await updateFamilyMember(memberToEdit.id, formData);
      setSuccessMessage('Membre de la famille mis à jour avec succès !');
      setIsSuccessModalVisible(true);
      // Navigate back after a short delay to allow user to see success message
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        navigation.goBack(); // Go back to the previous screen (e.g., FamilyMembersList)
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la mise à jour du membre de la famille.');
      setIsErrorModalVisible(true);
    } finally {
      setIsUpdating(false); // Stop showing the update loading overlay
    }
  }, [memberToEdit, updateFamilyMember, navigation, userId, hardcodedFamilyId]);

  // Handle cancellation from the form
  const handleCancel = useCallback(() => {
    navigation.goBack(); // Navigate back to the previous screen
  }, [navigation]);

  // Show global loading indicator while family data is being fetched
  if (familyLoading || !userId || !hardcodedFamilyId || hardcodedFamilyId === 'your_hardcoded_family_id_here') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des informations de la famille...</Text>
        {(!userId || !hardcodedFamilyId || hardcodedFamilyId === 'your_hardcoded_family_id_here') && (
            <Text style={styles.errorText}>Veuillez vous connecter et configurer l'ID de la famille.</Text>
        )}
      </View>
    );
  }

  // If memberToEdit is null after loading, it means the member wasn't found or an error occurred
  if (!memberToEdit) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <Text style={styles.emptyText}>Membre non trouvé ou erreur de chargement.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Retour</Text>
        </TouchableOpacity>
        {/* Error Modal for member not found */}
        <ModalComponent
          visible={isErrorModalVisible}
          onClose={() => setIsErrorModalVisible(false)}
          title="Erreur"
        >
          <Text style={styles.modalMessageText}>{errorMessage}</Text>
        </ModalComponent>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le membre</Text>
        <View style={styles.w } />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* The loading overlay for the update operation */}
        {isUpdating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f7b733" />
            <Text style={styles.loadingText}>Mise à jour du membre...</Text>
          </View>
        )}
        {/* Pass the member data, onSave, onCancel, and loading state to the form */}
        <FamilyMemberForm
          isEditing
          initialData={memberToEdit}
          onSave={handleSubmit} // This is the new callback for the form
          onCancel={handleCancel} // Pass the handleCancel callback
          loading={isUpdating} // Tell the form about the saving state
          userId={userId || ''} // Ensure userId is passed
          familyId={hardcodedFamilyId} // Ensure familyId is passed
        />
      </ScrollView>

      {/* Success Modal (controlled by this screen) */}
      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
      >
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>

      {/* Error Modal (controlled by this screen) */}
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
    paddingTop: StatusBar.currentHeight,
  },
  w:{
    width: 24,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  formContainer: {
    flexGrow: 1,
    padding: 20,
    position: 'relative', // Needed for absolute positioning of loadingOverlay
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#E74C3C',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#f7b733',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, // Covers the entire formContainer
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's above the form content
    borderRadius: 15, // Optional: match form card style if applies
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default EditFamilyMemberScreen;
