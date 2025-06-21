import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { ModalComponent } from '../components/common/Modal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { MembreFamille } from '../constants/entities';
import { FamilyMemberWizard } from '../components/forms/FamilyMemberWizard';

type AddFamilyMemberScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddFamilyMember'>;

interface AddFamilyMemberScreenProps {
  navigation: AddFamilyMemberScreenNavigationProp;
}

const AddFamilyMemberScreen: React.FC<AddFamilyMemberScreenProps> = ({ navigation }) => {
  const { userId } = useAuth();
  const { familyMembers, loading: familyLoading, error: familyError, addFamilyMember } = useFamilyData();

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [familyId, setFamilyId] = useState<string | null>(null);

  // Obtenir familyId à partir des membres existants ou d'une autre source
  useEffect(() => {
    if (familyMembers.length > 0) {
      setFamilyId(familyMembers[0].familyId!);
    } else {
      setErrorMessage('Aucune famille trouvée. Veuillez créer une famille avant d’ajouter un membre.');
      setIsErrorModalVisible(true);
    }
  }, [familyMembers]);

  // Afficher les erreurs de useFamilyData
  useEffect(() => {
    if (familyError) {
      setErrorMessage(familyError);
      setIsErrorModalVisible(true);
    }
  }, [familyError]);

  const handleSaveMember = async (formData: Omit<MembreFamille, 'id' | 'dateCreation' | 'dateMiseAJour'>) => {
    if (!familyId) {
      setErrorMessage('ID de famille manquant. Veuillez réessayer.');
      setIsErrorModalVisible(true);
      return;
    }

    const newMemberData: Omit<MembreFamille, 'id' | 'dateMiseAJour'> = {
      ...formData,
      dateCreation: new Date().toISOString(),
      familyId, // Assurez-vous que familyId est inclus
    };

    const memberId = await addFamilyMember(newMemberData);
    if (memberId) {
      setSuccessMessage('Membre de la famille ajouté avec succès !');
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        navigation.goBack();
      }, 1500);
    } else {
      if (!familyError) {
        setErrorMessage('Une erreur inattendue est survenue lors de l’ajout du membre.');
        setIsErrorModalVisible(true);
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (familyLoading || !userId || !familyId) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des informations...</Text>
        {(!userId || !familyId) && (
          <Text style={styles.errorText}>
            {userId ? 'Aucune famille configurée.' : 'Veuillez vous connecter.'}
          </Text>
        )}
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
        <Text style={styles.headerTitle}>Ajouter un membre</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <FamilyMemberWizard
          onSave={handleSaveMember}
          onCancel={handleCancel}
          loading={familyLoading}
          familyId={familyId}
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
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AddFamilyMemberScreen;
