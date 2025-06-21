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
  onToggle: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onToggle }) => {
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
      onPress={() => onToggle(member.id)}
      accessibilityLabel={`Sélectionner ${member.prenom} ${member.nom}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
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
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={theme.colors.primary}
            style={styles.checkIcon}
          />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface SelectFamilyMembersModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (members: MembreFamille[], isFinalStep?: boolean) => Promise<void>;
  title?: string;
  members?: MembreFamille[];
  loading?: boolean;
  initialSelectedMemberIds?: string[];
  isFinalStep?: boolean;
}

const SelectFamilyMembersModal: React.FC<SelectFamilyMembersModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner des membres de la famille',
  members = [],
  loading = false,
  initialSelectedMemberIds = [],
  isFinalStep = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<MembreFamille[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialSelectedMemberIds);
  const [isLoading, setIsLoading] = useState(loading);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const dataToUse = useMemo(() => (members.length > 0 ? members : mockFamilyMembers), [members]);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de membres ouvert');
      setSelectedMemberIds(initialSelectedMemberIds);
      setFilteredMembers(dataToUse);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSearchQuery('');
        setSelectedMemberIds([]);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialSelectedMemberIds, dataToUse]);

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

  const toggleMember = useCallback((id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedMemberIds.length > 0) {
      const selectedMembers = dataToUse.filter((m) => selectedMemberIds.includes(m.id));
      await onSelect(selectedMembers, isFinalStep);
      onClose();
      AccessibilityInfo.announceForAccessibility(`${selectedMemberIds.length} membre(s) sélectionné(s)`);
    }
  }, [selectedMemberIds, dataToUse, onSelect, isFinalStep, onClose]);

  const renderMember = ({ item }: { item: MembreFamille }) => (
    <MemberCard
      member={item}
      isSelected={selectedMemberIds.includes(item.id)}
      onToggle={toggleMember}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de membres"
      testID="select-family-members-modal"
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
            placeholder="Rechercher des membres..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Rechercher des membres de la famille"
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
            disabled={selectedMemberIds.length === 0}
            accessibilityLabel="Confirmer la sélection"
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedMemberIds.length > 0
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

export default SelectFamilyMembersModal;
