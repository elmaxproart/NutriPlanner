import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { MembreFamille } from '../constants/entities';
import { ModalComponent } from '../components/common/Modal'; // Assuming ModalComponent is here
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App'; // Import RootStackParamList
import { calculateAge } from '../utils/helpers'; // Assuming calculateAge utility exists

// Ensure RootStackParamList in App.tsx is correctly defined for this route:
// type RootStackParamList = {
//   FamilyMemberDetail: { memberId: string; familyId: string; };
//   EditFamilyMember: { memberId: string; familyId: string; }; // <--- Make sure familyId is here
//   // ... other routes
// };

type FamilyMemberDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FamilyMemberDetail'>;
type FamilyMemberDetailScreenRouteProp = RouteProp<RootStackParamList, 'FamilyMemberDetail'>;

interface FamilyMemberDetailScreenProps {
  navigation: FamilyMemberDetailScreenNavigationProp;
  route: FamilyMemberDetailScreenRouteProp;
}

const FamilyMemberDetailScreen: React.FC<FamilyMemberDetailScreenProps> = ({ navigation, route }) => {
  // Get memberId and familyId from navigation params
  const { memberId, familyId } = route.params;

  const { userId } = useAuth();

  // Use useFamilyData with the userId and the dynamically passed familyId
  const { familyMembers, loading: familyDataLoading, error: familyDataError, fetchFamilyMembers } = useFamilyData(userId || '', familyId);

  const [member, setMember] = useState<MembreFamille | null>(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch family members when component mounts or relevant IDs change
  useEffect(() => {
    if (userId && familyId) {
      fetchFamilyMembers();
    }
  }, [userId, familyId, fetchFamilyMembers]);


  // Find the specific member to display details for
  useEffect(() => {
    if (familyMembers && memberId) {
      const foundMember = familyMembers.find(m => m.id === memberId);
      if (foundMember) {
        setMember(foundMember);
      } else {
        setErrorMessage('Membre de la famille non trouvé.');
        setIsErrorModalVisible(true);
      }
    }
  }, [familyMembers, memberId]);


  // Display errors from useFamilyData hook
  useEffect(() => {
    if (familyDataError) {
      setErrorMessage(familyDataError);
      setIsErrorModalVisible(true);
    }
  }, [familyDataError]);

  // Navigate to the EditFamilyMember screen, passing memberId AND familyId
  const handleEditMember = useCallback(() => {
    if (member) {
      // --- IMPORTANT: Pass familyId here as per RootStackParamList definition ---
      navigation.navigate('EditFamilyMember', { memberId: member.id, familyId: familyId });
    }
  }, [navigation, member, familyId]); // Add familyId to dependencies

  // Show a loading indicator while data is being fetched
  if (familyDataLoading || !userId || !familyId) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des détails du membre...</Text>
        {(!userId || !familyId) && (
          <Text style={styles.errorText}>Identifiants utilisateur ou famille manquants.</Text>
        )}
      </View>
    );
  }

  // Handle case where member details are not available
  if (!member) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
        <Text style={styles.emptyText}>Détails du membre non disponibles ou introuvables.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Retour</Text>
        </TouchableOpacity>
        {/* Error Modal for issues related to member not found */}
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

  // Main component rendering
  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Membre</Text>
        <TouchableOpacity onPress={handleEditMember} style={styles.editButton}>
          <AntDesign name="edit" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={member.photoProfil ? { uri: member.photoProfil } : require('../assets/images/okok.jpg')} // Fallback image
          style={styles.profileImage}
        />
        <Text style={styles.memberName}>{member.prenom} {member.nom}</Text>
        {member.dateNaissance && calculateAge(member.dateNaissance) && <Text style={styles.memberInfo}>Âge: {calculateAge(member.dateNaissance)} ans</Text>}
        <Text style={styles.memberInfo}>Rôle: {member.role}</Text>
      </View>

      <View style={styles.detailsSection}>
        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.infoRow}>
          <Icon name="email-outline" size={20} color="#b0b0b0" style={styles.icon} />
          <Text style={styles.infoText}>Email: {member.contactUrgence?.nom || 'Non spécifié'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color="#b0b0b0" style={styles.icon} />
          <Text style={styles.infoText}>Téléphone: {member.contactUrgence?.telephone || 'Non spécifié'}</Text>
        </View>

        {/* Preferences and Restrictions */}
        <Text style={styles.sectionTitle}>Préférences et Restrictions</Text>
        <View style={styles.infoRow}>
          <Icon name="food-apple" size={20} color="#27AE60" style={styles.icon} />
          <Text style={styles.infoText}>
            Préférences: {member.preferencesAlimentaires.length > 0 ? member.preferencesAlimentaires.join(', ') : 'Aucune'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="alert-circle-outline" size={20} color="#E74C3C" style={styles.icon} />
          <Text style={styles.infoText}>
            Allergies: {member.allergies && member.allergies.length > 0 ? member.allergies.join(', ') : 'Aucune'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="medical-bag" size={20} color="#E74C3C" style={styles.icon} />
          <Text style={styles.infoText}>
            Restrictions Médicales: {member.restrictionsMedicales && member.restrictionsMedicales.length > 0 ? member.restrictionsMedicales.join(', ') : 'Aucune'}
          </Text>
        </View>

        {/* AI Preferences */}
        <Text style={styles.sectionTitle}>Préférences IA</Text>
        <View style={styles.infoRow}>
          <Icon name="chili-settings-outline" size={20} color="#b0b0b0" style={styles.icon} />
          <Text style={styles.infoText}>Niveau d'épices préféré: {member.aiPreferences?.niveauEpices || 'Non défini'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="chef-hat" size={20} color="#b0b0b0" style={styles.icon} />
          <Text style={styles.infoText}>Cuisines préférées: {member.aiPreferences?.cuisinesPreferees?.join(', ') || 'Non définies'}</Text>
        </View>
      </View>

      {/* Error Modal (for general errors not handled by specific UI) */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    padding: 20,
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
  errorText: { // Added style for error messages in loading state
    color: '#E74C3C',
    marginTop: 5,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editButton: {
    padding: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f7b733',
    marginBottom: 15,
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  memberInfo: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 5,
  },
  detailsSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7b733',
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#FFF',
    flexShrink: 1, // Allow text to wrap
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default FamilyMemberDetailScreen;
