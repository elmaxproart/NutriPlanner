import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MembreFamille } from '../../../constants/entities';
import { mockFamilyMembers } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface MemberCardProps {
  member: MembreFamille;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onSelect }) => {
  const cardScale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(member.id)}
      accessibilityLabel={`Sélectionner ${member.prenom} ${member.nom}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`member-card-${member.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          <MaterialCommunityIcons
            name="account-circle"
            size={40}
            color={theme.colors.primary}
            style={styles.avatarIcon}
          />
          <View style={styles.memberInfo}>
            <Text style={commonStyles.cardTitle}>{`${member.prenom} ${member.nom}`}</Text>
            <Text style={commonStyles.cardDescription}>{member.role}</Text>
          </View>
          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={theme.colors.primary}
              style={styles.checkIcon}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface SelectFamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: MembreFamille, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  members?: MembreFamille[];
  loading?: boolean;
  initialSelectedMemberId?: string;
  isFinalStep?: boolean;
}

const SelectFamilyMemberModal: React.FC<SelectFamilyMemberModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un membre de la famille',
  members = [],
  loading = false,
  initialSelectedMemberId = '',
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<MembreFamille[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialSelectedMemberId);
  const [isLoading, setIsLoading] = useState(loading);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const dataToUse = useMemo(() => (members.length > 0 ? members : mockFamilyMembers), [members]);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de membre ouvert');
      setSelectedMemberId(initialSelectedMemberId);
      setFilteredMembers(dataToUse);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedMemberId(null);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialSelectedMemberId, dataToUse]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const filterMembers = useCallback(() => {
    const filtered = dataToUse.filter((member) =>
      `${member.prenom} ${member.nom}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, dataToUse]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, filterMembers]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleConfirm = useCallback(async () => {
    if (selectedMemberId) {
      const member = dataToUse.find((m) => m.id === selectedMemberId);
      if (member) {
        await onSelect(member, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`${member.prenom} ${member.nom} sélectionné`);
      }
    }
  }, [selectedMemberId, dataToUse, onSelect, isFinalStep, onClose]);

  const renderMember = ({ item }: { item: MembreFamille }) => (
    <MemberCard
      member={item}
      isSelected={item.id === selectedMemberId}
      onSelect={setSelectedMemberId}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de membre"
      testID="select-family-member-modal"
    >
      <View style={commonStyles.modalOverlay}>
        <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
          <TouchableOpacity
            style={commonStyles.closeModalButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
            testID="close-button"
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
            {title}
          </Text>

          <TextInput
            style={commonStyles.searchInput}
            placeholder="Rechercher un membre..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher un membre de la famille"
            testID="search-input"
          />

          {isLoading ? (
            <View style={commonStyles.centeredContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={commonStyles.textSecondary}>Chargement...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={commonStyles.centeredContainer}>
              <Text style={commonStyles.textSecondary}>Aucun membre trouvé.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              contentContainerStyle={commonStyles.verticalListContent}
              showsVerticalScrollIndicator={false}
              accessibilityLabel="Liste des membres de la famille"
              testID="members-list"
            />
          )}

          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleConfirm}
            disabled={!selectedMemberId}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedMemberId
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : ['#666', '#666']
              }
              style={commonStyles.buttonGradient}
            >
              <Text style={commonStyles.buttonText}>
                {isFinalStep ? 'Terminer' : 'Confirmer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarIcon: {
    marginRight: theme.spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
});

export default SelectFamilyMemberModal;
