
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Switch,
  Animated,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { theme } from '../styles/theme';
import { logger } from '../utils/logger';
import { mockFamilyMembers } from '../constants/mockData';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';
import { MembreFamille } from '../constants/entities';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Preference {
  id: string;
  label: string;
  value: boolean | number | string;
  type: 'switch' | 'slider' | 'text';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId, signOut } = useAuth();
  const { getCollection } = useFirestore();
  const [userName, setUserName] = useState<string>('Utilisateur');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<MembreFamille[]>(mockFamilyMembers);
  const [preferences, setPreferences] = useState<Preference[]>([
    { id: 'notifications', label: 'Notifications Push', value: true, type: 'switch' },
    { id: 'darkMode', label: 'Mode Sombre', value: true, type: 'switch' },
    { id: 'vegan', label: 'Régime Végan', value: false, type: 'switch' },
    { id: 'spiceLevel', label: 'Niveau d\'épices', value: 1, type: 'slider' },
  ]);
  const [achievements] = useState<Achievement[]>([
    { id: '1', title: 'Chef Novice', description: 'Créer 5 menus', icon: 'chef-hat', progress: 0.6 },
    { id: '2', title: 'Planificateur', description: 'Planifier 10 repas', icon: 'calendar-check', progress: 0.8 },
    { id: '3', title: 'Économe', description: 'Économiser 100$', icon: 'piggy-bank', progress: 0.4 },
    { id: '4', title: 'Explorateur Culinaire', description: 'Essayer 3 cuisines différentes', icon: 'silverware', progress: 0.2 },
  ]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const fetchProfile = async () => {
      if (!userId) {return;}
      try {
        const firestore = (await import('@react-native-firebase/firestore')).default;
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists()) {
          const data = doc.data();
          if (data?.name) {setUserName(data.name);}
          if (data?.userImageProfile) {setProfileImage(data.userImageProfile);}
          if (data?.preferences) {setPreferences(data.preferences);}
        }

        const members = await getCollection<MembreFamille>('FamilyMembers');
        setFamilyMembers(members.length > 0 ? members : mockFamilyMembers);
      } catch (error: any) {
        logger.error('Erreur lors de la récupération du profil', { error: error.message });
      }
    };

    fetchProfile();
  }, [userId, getCollection, fadeAnim]);

  const handlePreferenceChange = useCallback(async (id: string, value: boolean | number | string) => {
    const updatedPreferences = preferences.map(pref =>
      pref.id === id ? { ...pref, value } : pref
    );
    setPreferences(updatedPreferences);

  }, [preferences]);

  const renderFamilyMember = ({ item }: { item: MembreFamille }) => (
    <TouchableOpacity
      style={styles.familyCard}
      onPress={() => navigation.navigate('FamilyMemberDetail', { memberId: item.id })}
    >
      <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.familyCardGradient}>
        {item.photoProfil ? (
          <Image source={{ uri: item.photoProfil }} style={styles.familyImage} />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={48} color="#fff" />
        )}
        <Text style={styles.familyName}>{item.nom}</Text>
        <Text style={styles.familyRole}>{item.role || 'Membre'}</Text>
        <View style={styles.familyStatus}>
          <MaterialCommunityIcons
            name={item.niveauAcces === 'admin' ? 'check-circle' : 'account-heart'}
            size={16}
            color={item.niveauAcces === 'admin' ? '#4CAF50' : '#FF5252'}
          />
          <Text style={styles.familyStatusText}>
            {item.niveauAcces ? 'Réel' : 'Fictif'}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPreference = ({ item }: { item: Preference }) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceInfo}>
        <MaterialCommunityIcons
          name={item.id === 'notifications' ? 'bell' : item.id === 'darkMode' ? 'theme-light-dark' : 'leaf'}
          size={20}
          color={theme.colors.textPrimary}
        />
        <Text style={styles.preferenceLabel}>{item.label}</Text>
      </View>
      {item.type === 'switch' && (
        <Switch
          value={!!item.value}
          onValueChange={value => handlePreferenceChange(item.id, value)}
          trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
          thumbColor="#FFFFFF"
        />
      )}
      {item.type === 'slider' && (
        <Text style={styles.preferenceValue}>{item.value}</Text>
      )}
    </View>
  );

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View style={styles.achievementCard}>
      <LinearGradient colors={['#FFB300', '#FFCA28']} style={styles.achievementGradient}>
        <MaterialCommunityIcons name={item.icon} size={36} color="#fff" />
      </LinearGradient>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, { width: `${item.progress * 100}%` }]}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity onPress={signOut} style={styles.headerButton}>
          <MaterialCommunityIcons name="logout" size= {28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          <View style={styles.profileSection}>
            <LinearGradient colors={['#FFFFFF', '#F5F5F5']} style={styles.profileCard}>
              <View style={styles.profileAvatarContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account" size={60} color="#fff" />
                  </LinearGradient>
                )}
              </View>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userId}</Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="food" size={24} color={theme.colors.primary} />
                  <Text style={styles.statText}>{familyMembers.length} Membres</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
                  <Text style={styles.statText}>{achievements.length} Réalisations</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <LinearGradient colors={['#FFB300', '#FFCA28']} style={styles.editButtonGradient}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Modifier</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ma Famille</Text>
            <FlatList
              data={familyMembers}
              renderItem={renderFamilyMember}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.familyList}
            />
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={() => navigation.navigate('AddFamilyMember')}
            >
              <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.addMemberGradient}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.addMemberText}>Ajouter un Membre</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Préférences</Text>
            <FlatList
              data={preferences}
              renderItem={renderPreference}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.preferenceList}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Réalisations</Text>
            <FlatList
              data={achievements}
              renderItem={renderAchievement}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.achievementList}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions Rapides</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.actionButtonGradient}>
                  <MaterialCommunityIcons name="cog" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Paramètres</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MealHistory')}
              >
                <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.actionButtonGradient}>
                  <MaterialCommunityIcons name="history" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Historique</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('BudgetOverview')}
              >
                <LinearGradient colors={['#0288D1', '#4FC3F7']} style={styles.actionButtonGradient}>
                  <MaterialCommunityIcons name="cash" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Budget</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
  },
  headerButton: {
    padding: 10,
    borderRadius: 12,
  },
  scrollViewContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  profileSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  profileCard: {
    width: screenWidth - 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileGradient: {
    padding: 20,
    alignItems: 'center',
  },
  profileAvatarContainer: {
    marginBottom: 16,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: theme.fonts.bold,
    marginBottom: 8,
  },
  profileEmail: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    marginTop: 4,
  },
  editButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    marginLeft: 8,
  },
  section: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    marginBottom: 12,
  },
  familyList: {
    paddingHorizontal: 4,
  },
  familyCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  familyCardGradient: {
    padding: 12,
    alignItems: 'center',
  },
  familyImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  familyName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    textAlign: 'center',
  },
  familyRole: {
    color: '#E0E0E0',
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
  },
  familyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  familyStatusText: {
    color: '#E0E0E0',
    fontSize: 10,
    fontFamily: theme.fonts.regular,
    marginLeft: 4,
  },
  addMemberButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addMemberGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addMemberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    marginLeft: 8,
  },
  preferenceList: {
    paddingHorizontal: 4,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    marginLeft: 8,
  },
  preferenceValue: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  achievementList: {
    paddingHorizontal: 4,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementGradient: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  achievementDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (screenWidth - 48) / 3,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ProfileScreen;
