import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { ModalComponent } from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { MembreFamille } from '../constants/entities';
import { RootStackParamList } from '../App';
import { calculateAge } from '../utils/helpers';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Configuration Constants
const COLORS = {
  primary: '#E95221',
  secondary: '#F2A03D',
  backgroundDark: '#0D0D0D',
  backgroundLight: '#1A1A1A',
  inputBg: '#282828',
  inputBorder: '#444',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  error: '#FF6B6B',
  buttonText: '#FFFFFF',
  cardBg: '#2C2C2C',
  shadow: '#000',
  editProfile: '#26A69A',
};

const FONTS = {
  title: 22,
  sectionTitle: 18,
  profileName: 20,
  detailLabel: 8,
  detailValue: 12,
  button: 16,
  headerInfo: 12,
};

const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
};

type FamilyMemberDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FamilyMemberDetail'>;
type FamilyMemberDetailScreenRouteProp = RouteProp<RootStackParamList, 'FamilyMemberDetail'>;

interface FamilyMemberDetailScreenProps {
  navigation: FamilyMemberDetailScreenNavigationProp;
  route: FamilyMemberDetailScreenRouteProp;
}

const FamilyMemberDetailScreen: React.FC<FamilyMemberDetailScreenProps> = ({ navigation, route }) => {
  const { memberId } = route.params;
  const { userId } = useAuth();
  const { familyMembers, loading: familyDataLoading, error: familyDataError, fetchFamilyMembers } = useFamilyData();

  const [member, setMember] = useState<MembreFamille | null>(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    nutrition: false,
    ai: false,
  });

  // Fetch family members
  useEffect(() => {
    if (userId) {
      fetchFamilyMembers();
    }
  }, [userId, fetchFamilyMembers]);

  // Find member by ID
  useEffect(() => {
    if (familyMembers && memberId) {
      const foundMember = familyMembers.find((m) => m.id === memberId);
      if (foundMember) {
        setMember(foundMember);
      } else {
        setErrorMessage('Membre de la famille non trouvé.');
        setIsErrorModalVisible(true);
      }
    }
  }, [familyMembers, memberId]);

  // Handle data errors
  useEffect(() => {
    if (familyDataError) {
      setErrorMessage(familyDataError);
      setIsErrorModalVisible(true);
    }
  }, [familyDataError]);

  // Navigate to EditFamilyMember
  const handleEditMember = useCallback(() => {
    if (member) {
      navigation.navigate('EditFamilyMember', { memberId: member.id });
    }
  }, [navigation, member]);

  // Toggle collapsible section
  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Render detail item
  const renderDetailItem = (
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
    label: string,
    value: string | number,
  ) => {
    if (!value || value === 'N/A' || value === '') {
      return null;
    }
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    return (
      <View style={styles.detailGridItem}>
        <IconComponent name={iconName} size={18} color={COLORS.secondary} style={styles.itemIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemLabel}>{label}:</Text>
          <Text style={styles.itemValue}>{value}</Text>
        </View>
      </View>
    );
  };

  // Render list items (for arrays like preferences, allergies)
  const renderListItems = (
    items: string[],
    label: string,
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
  ) => {
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    if (!items || items.length === 0 || (items.length === 1 && items[0] === '')) {
      return (
        <View style={styles.detailGridItem}>
          <IconComponent name="close" size={18} color={COLORS.secondary} style={styles.itemIcon} />
          <Text style={styles.itemValue}>Aucun {label.toLowerCase()}</Text>
        </View>
      );
    }
    return items.map((item, index) => (
      <View key={index} style={styles.detailGridItem}>
        <IconComponent name={iconName} size={18} color={COLORS.secondary} style={styles.itemIcon} />
        <Text style={styles.itemValue}>{item}</Text>
      </View>
    ));
  };

  // Render header info
  const renderInfo = (
    iconName: string,
    iconLib: 'AntDesign' | 'FontAwesome',
    label: string,
    value: string | number,
  ) => {
    if (!value || value === 'N/A' || value === '') {
      return null;
    }
    const IconComponent = iconLib === 'AntDesign' ? AntDesign : FontAwesome;
    return (
      <View style={styles.headerDetailItem}>
        <IconComponent name={iconName} size={14} color={COLORS.secondary} style={styles.headerItemIcon} />
        <Text style={styles.headerItemValue}>{value}</Text>
      </View>
    );
  };

  // Get image source
  const getImageSource = () => {
    try {
      if (member?.photoProfil && (member.photoProfil.startsWith('http') || member.photoProfil.startsWith('file://'))) {
        return { uri: member.photoProfil };
      }
      return require('../assets/images/okok.jpg');
    } catch (e) {
      console.error('Failed to load profile image:', e);
      return require('../assets/images/okok.jpg');
    }
  };

  // Loading state
  if (familyDataLoading || !userId) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.backgroundDark, COLORS.backgroundLight]} style={styles.backgroundGradient} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Chargement des détails du membre...</Text>
          {!userId && <Text style={styles.errorText}>Identifiant utilisateur manquant.</Text>}
        </View>
      </View>
    );
  }

  // Empty state
  if (!member) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.backgroundDark, COLORS.backgroundLight]} style={styles.backgroundGradient} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Détails du membre non disponibles.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.prevButton}>
            <AntDesign name="arrowleft" size={24} color={COLORS.text} />
            <Text style={styles.prevButtonText}>Retour</Text>
          </TouchableOpacity>
          <ModalComponent
            visible={isErrorModalVisible}
            onClose={() => setIsErrorModalVisible(false)}
            title="Erreur"
          >
            <Text style={styles.modalMessageText}>{errorMessage}</Text>
          </ModalComponent>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.backgroundDark, COLORS.backgroundLight]} style={styles.backgroundGradient} />
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Image source={getImageSource()} style={styles.profileImage} resizeMode="cover" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{`${member.prenom} ${member.nom}`}</Text>
              <View style={styles.personalDetailsColumn}>
                {renderInfo(
                  'calendar',
                  'AntDesign',
                  'Âge',
                  member.dateNaissance && calculateAge(member.dateNaissance)
                    ? `${calculateAge(member.dateNaissance)} ans`
                    : 'N/A',
                )}
                {renderInfo('user', 'FontAwesome', 'Rôle', member.role || 'N/A')}
                {renderInfo('phone', 'FontAwesome', 'Téléphone Urgence', member.contactUrgence?.telephone || 'N/A')}
                {renderInfo('user-o', 'FontAwesome', 'Nom Contact', member.contactUrgence?.nom || 'N/A')}
              </View>
              <TouchableOpacity onPress={handleEditMember} style={styles.editProfileButton}>
                <FontAwesome name="edit" size={16} color={COLORS.editProfile} style={styles.editIcon} />
                <Text style={[styles.editText, { color: COLORS.editProfile }]}>Modifier Profil</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Collapsible Sections */}
          <View style={styles.sectionsContainer}>
            {/* Personal & Contact Info */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('personal')}>
              <AntDesign name="user" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Informations Personnelles & Contact</Text>
              <AntDesign name={expandedSections.personal ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.personal && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderDetailItem(
                    'calendar',
                    'AntDesign',
                    'Âge',
                    member.dateNaissance && calculateAge(member.dateNaissance)
                      ? `${calculateAge(member.dateNaissance)} ans`
                      : 'N/A',
                  )}
                  {renderDetailItem('user', 'FontAwesome', 'Rôle', member.role || 'N/A')}
                  {renderDetailItem(
                    'phone',
                    'FontAwesome',
                    'Téléphone Urgence',
                    member.contactUrgence?.telephone || 'N/A',
                  )}
                  {renderDetailItem('user-o', 'FontAwesome', 'Nom Contact', member.contactUrgence?.nom || 'N/A')}
                </View>
              </View>
            )}

            {/* Nutritional Preferences */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('nutrition')}>
              <FontAwesome name="cutlery" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Préférences Nutritionnelles</Text>
              <AntDesign name={expandedSections.nutrition ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.nutrition && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderListItems(
                    member.preferencesAlimentaires || [],
                    'Préférences alimentaires',
                    'leaf',
                    'FontAwesome',
                  )}
                  {renderListItems(member.allergies || [], 'Allergies alimentaires', 'exclamation-triangle', 'FontAwesome')}
                  {renderListItems(
                    member.restrictionsMedicales || [],
                    'Restrictions médicales',
                    'medkit',
                    'FontAwesome',
                  )}
                </View>
              </View>
            )}

            {/* AI Preferences */}
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('ai')}>
              <AntDesign name="setting" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Paramètres IA</Text>
              <AntDesign name={expandedSections.ai ? 'up' : 'down'} size={18} color={COLORS.text} />
            </TouchableOpacity>
            {expandedSections.ai && (
              <View style={styles.sectionContent}>
                <View style={styles.detailsGrid}>
                  {renderDetailItem(
                    'fire',
                    'FontAwesome',
                    'Niveau d’Épices',
                    member.aiPreferences?.niveauEpices || '1',
                  )}
                  {renderDetailItem(
                    'fire',
                    'FontAwesome',
                    'Calories Cibles',
                    member.aiPreferences?.apportCaloriqueCible
                      ? `${member.aiPreferences.apportCaloriqueCible} kcal`
                      : '2000 kcal',
                  )}
                  {renderListItems(
                    member.aiPreferences?.cuisinesPreferees || [],
                    'Cuisines préférées',
                    'cutlery',
                    'FontAwesome',
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.prevButton}>
            <AntDesign name="arrowleft" size={24} color={COLORS.text} />
            <Text style={styles.prevButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditMember} style={styles.nextButtonOuter} disabled={!member}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Modifier</Text>
              <AntDesign name="edit" size={24} color={COLORS.buttonText} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
    backgroundColor: COLORS.backgroundDark,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl * 2,
    paddingHorizontal: SPACING.m,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    marginBottom: SPACING.l,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    marginRight: SPACING.m,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: FONTS.profileName,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
  },
  personalDetailsColumn: {
    flexDirection: 'column',
    marginBottom: SPACING.s,
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerItemIcon: {
    marginRight: SPACING.s,
  },
  headerItemValue: {
    color: COLORS.textSecondary,
    fontSize: FONTS.headerInfo,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 166, 154, 0.2)',
  },
  editIcon: {
    marginRight: SPACING.s,
  },
  editText: {
    fontSize: FONTS.detailValue,
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginBottom: SPACING.s,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionTitle: {
    color: COLORS.secondary,
    fontSize: FONTS.sectionTitle,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING.s,
  },
  sectionContent: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.m,
    padding: SPACING.s,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  itemIcon: {
    marginRight: SPACING.s,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.detailLabel,
    textTransform: 'uppercase',
  },
  itemValue: {
    color: COLORS.text,
    fontSize: FONTS.detailValue,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.inputBg,
    borderRadius: 15,
  },
  prevButtonText: {
    color: COLORS.text,
    fontSize: FONTS.button,
    marginLeft: SPACING.s,
  },
  nextButtonOuter: {
    flex: 1,
    marginLeft: SPACING.m,
    borderRadius: 15,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  nextButtonText: {
    color: COLORS.buttonText,
    fontSize: FONTS.button,
    fontWeight: 'bold',
    marginRight: SPACING.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: SPACING.m,
    fontSize: FONTS.detailValue,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    marginTop: SPACING.s,
    fontSize: FONTS.detailValue,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.text,
    fontSize: FONTS.title,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  modalMessageText: {
    color: COLORS.text,
    fontSize: FONTS.detailValue,
    textAlign: 'center',
  },
});

export default FamilyMemberDetailScreen;
