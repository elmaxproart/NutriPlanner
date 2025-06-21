import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { FamilyMemberWizard } from '../components/forms/FamilyMemberWizard';
import { ModalComponent } from '../components/common/Modal';
import { MembreFamille } from '../constants/entities';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type EditFamilyMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditFamilyMember'>;
type EditFamilyMemberScreenRouteProp = RouteProp<RootStackParamList, 'EditFamilyMember'>;

interface EditFamilyMemberScreenProps {
  navigation: EditFamilyMemberScreenNavigationProp;
  route: EditFamilyMemberScreenRouteProp;
}

const EditFamilyMemberScreen: React.FC<EditFamilyMemberScreenProps> = ({ navigation, route }) => {
  const { memberId } = route.params;
  const { userId } = useAuth();
  const { familyMembers, loading: familyLoading, error: familyError, updateFamilyMember } = useFamilyData();

  const [memberToEdit, setMemberToEdit] = useState<MembreFamille | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Effect to find the member to edit
  useEffect(() => {
    if (familyMembers && memberId) {
      const foundMember = familyMembers.find((m) => m.id === memberId);
      if (foundMember) {
        setMemberToEdit(foundMember);
      } else {
        setErrorMessage('Membre de la famille introuvable pour édition.');
        setIsErrorModalVisible(true);
      }
    }
  }, [familyMembers, memberId]);

  // Effect to display errors from useFamilyData
  useEffect(() => {
    if (familyError) {
      setErrorMessage(familyError);
      setIsErrorModalVisible(true);
    }
  }, [familyError]);


  const handleSubmit = useCallback(
    async (formData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
      if (!memberToEdit) {
        setErrorMessage('Aucun membre sélectionné pour la mise à jour.');
        setIsErrorModalVisible(true);
        return;
      }
      if (!userId || !memberToEdit.familyId) {
        setErrorMessage('Erreur: Identifiants utilisateur ou famille manquants.');
        setIsErrorModalVisible(true);
        return;
      }

      setIsUpdating(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        await updateFamilyMember(memberToEdit.id, formData);
        setSuccessMessage('Membre de la famille mis à jour avec succès !');
        setIsSuccessModalVisible(true);
        setTimeout(() => {
          setIsSuccessModalVisible(false);
          navigation.goBack();
        }, 1500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Erreur lors de la mise à jour du membre.');
        setIsErrorModalVisible(true);
      } finally {
        setIsUpdating(false);
      }
    },
    [memberToEdit, updateFamilyMember, navigation, userId]
  );

  // Handle cancellation
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Show loading while fetching data
  if (familyLoading || !userId) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des informations...</Text>
        {!userId && <Text style={styles.errorText}>Veuillez vous connecter.</Text>}
      </View>
    );
  }

  // Show error if member not found
  if (!memberToEdit) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <Text style={styles.emptyText}>Membre non trouvé ou erreur de chargement.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Retour</Text>
        </TouchableOpacity>
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
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {isUpdating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f7b733" />
            <Text style={styles.loadingText}>Mise à jour du membre...</Text>
          </View>
        )}
        <FamilyMemberWizard
          isEditing
          initialData={memberToEdit}
          onSave={handleSubmit}
          onCancel={handleCancel}
          loading={isUpdating}
          familyId={memberToEdit.familyId!}
        />
      </ScrollView>

      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
      >
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>

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
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRightPlaceholder: {
    width: 24,
  },
  formContainer: {
    flexGrow: 1,
    position: 'relative',
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 15,
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default EditFamilyMemberScreen;
