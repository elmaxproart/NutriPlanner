import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

import { FamilyCard } from '../components/ai/FamilyCard';
import { ModalComponent } from '../components/common/Modal';

import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';



type FamilyListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FamilyList'>;
type FamilyListScreenRouteProp = RouteProp<RootStackParamList, 'FamilyList'>;

interface FamilyListScreenProps {
  navigation: FamilyListScreenNavigationProp;
  route: FamilyListScreenRouteProp;
}

const FamilyListScreen: React.FC<FamilyListScreenProps> = ({ navigation }) => {
  const { userId } = useAuth();


  const familyId = 'family1';

  const { familyMembers, loading, error, fetchFamilyMembers } = useFamilyData(userId || '', familyId);

  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {

    if (userId) {
      fetchFamilyMembers();
    }
  }, [userId, fetchFamilyMembers]);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setIsErrorModalVisible(true);
    }
  }, [error]);


  const handleCardPress = (memberId: string) => {
    navigation.navigate('FamilyMemberDetail', { memberId, familyId });
  };

  // Navigate to AddFamilyMember screen
  const handleAddMember = () => {
    navigation.navigate('AddFamilyMember');
  };

  // Placeholder function for sending data to AI (simulated)
  const handleSendToAI = (message: string) => {
    setErrorMessage(`Message AI simulé: "${message}"`);
    setIsErrorModalVisible(true); // Using error modal for demo info
  };

  // Show a loading indicator while family members are being fetched
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f7b733" />
        <Text style={styles.loadingText}>Chargement des membres de la famille...</Text>
      </View>
    );
  }

  // Main component rendering
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Votre Famille</Text>

      {/* List of family members */}
      <FlatList
        data={familyMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FamilyCard
            member={item}
            onPress={() => handleCardPress(item.id)} // Calls handleCardPress which now includes familyId
            onSendToAI={handleSendToAI}
          />
        )}
        contentContainerStyle={styles.listContentContainer}
        // Component to show when the list is empty
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <AntDesign name="team" size={50} color="#b0b0b0" style={styles.emptyIcon} />
            <Text style={styles.emptyListText}>Aucun membre de la famille trouvé.</Text>
            <Text style={styles.emptyListSubText}>Ajoutez-en un pour commencer la planification !</Text>
          </View>
        }
      />

      {/* Floating action button to add a new family member */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
        <AntDesign name="pluscircle" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Ajouter un membre</Text>
      </TouchableOpacity>

      {/* Error / Info Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur / Info"
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
    paddingTop: 20, // Adjust for status bar or safe area
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80, // Ensure space for the floating action button at the bottom
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50, // Vertical padding for empty list message
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyListText: {
    color: '#b0b0b0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListSubText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  addButton: {
    position: 'absolute', // Position the button absolutely
    bottom: 20, // 20 units from the bottom
    right: 20, // 20 units from the right
    backgroundColor: '#f7b733', // Accent color for the button
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // Make it pill-shaped
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10, // Space between icon and text
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default FamilyListScreen;
