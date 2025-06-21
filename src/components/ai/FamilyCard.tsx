/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, Image, TouchableOpacity, AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useColorScheme } from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { calculateAge, generateUniqueId } from '../../utils/helpers';
import { theme } from '../../styles/theme';
import { PromptType } from '../../services/prompts';
import { useNavigation } from '@react-navigation/native';
import { AiInteraction, AiInteractionContent, AiInteractionType, MembreFamille } from '../../constants/entities';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

interface FamilyCardProps {
  member: MembreFamille;
  onPress: () => void;
}

const roleIcons: Record<string, { name: string; color: string }> = {
  parent: { name: 'account-tie', color: theme.colors.primary },
  enfant: { name: 'baby-face-outline', color: theme.colors.surface },
  'grand-parent': { name: 'account-heart', color: theme.colors.secondary },
  autre: { name: 'account', color: theme.colors.textSecondary },
};

function getRoleIcon(role: string) {
  return roleIcons[role.toLowerCase()] || roleIcons.autre;
}

// Navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatAiInteraction = (
  content: AiInteractionContent,
  type: AiInteractionType,
  conversationId: string = generateUniqueId()
): AiInteraction => {
  const timestamp = new Date().toISOString();
  return {
    id: generateUniqueId(),
    content,
    isUser: true,
    timestamp,
    type,
    dateCreation: timestamp,
    dateMiseAJour: timestamp,
    conversationId,
  };
};

export const FamilyCard = React.memo(({ member, onPress }: FamilyCardProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.4);
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const navigation = useNavigation<NavigationProp>();

  // Animation d'apparition simple (plus d'effet de survol/touch)
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 500 });
    shadowOpacity.value = withTiming(0.4, { duration: 500 });
  }, [scale, opacity, shadowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
    elevation: shadowOpacity.value * 10,
  }));

  // Suppression de l'effet d'opacité au survol/touch
  // Pour cela, on ajoute activeOpacity={1} sur TouchableOpacity
  // et on ne modifie pas l'opacité dans les handlers (aucun effet visuel au touch)

  // Navigation vers GeminiChat
  const navigateToChat = React.useCallback(
    (interaction: AiInteraction, promptType: PromptType) => {
      navigation.navigate('GeminiChat', { initialInteraction: interaction, promptType });
      AccessibilityInfo.announceForAccessibility(`Navigation vers le chat pour ${promptType}`);
    },
    [navigation],
  );

  const handleSuggestMeal = React.useCallback(() => {
    const description = `Repas personnalisé pour ${member.prenom || member.nom || 'ce membre'}. Préférences alimentaires: ${member.preferencesAlimentaires?.length > 0 ? member.preferencesAlimentaires.join(', ') : 'aucune'}. Restrictions: ${[...(member.restrictionsMedicales || []), ...(member.allergies || [])].length > 0 ? [...(member.restrictionsMedicales || []), ...(member.allergies || [])].join(', ') : 'aucune'}.`;
    const content: AiInteractionContent = {
      type: 'recipe_personalized',
      recipeId: generateUniqueId(),
      name: `Repas pour ${member.prenom || member.nom || 'ce membre'}`,
      description,
      membre: member,
    };
    const interaction = formatAiInteraction(content, 'recipe_personalized');
    navigateToChat(interaction, PromptType.RECIPE_PERSONALIZED);
  }, [navigateToChat, member]);

  const hasRestrictions = member.restrictionsMedicales?.length > 0 || member.allergies?.length > 0;
  const role = member.role || 'autre';
  const roleIcon = getRoleIcon(role);

  return (
    <Animated.View style={[commonStyles.carouselCard, animatedStyle, styles.cardContainer]}>
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={`Voir les détails de ${member.prenom || member.nom}`}
        accessibilityRole="button"
        style={styles.touchable}
        activeOpacity={1} // <--- Empêche l'effet d'opacité au touch/survol
      >
        <LinearGradient
          colors={isDarkMode ? ['#3A3A3C', '#1F1F21'] : ['#F9FAFB', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.header}>
            <Image
              source={member.photoProfil || require('../../assets/images/ia.jpg')}
              style={styles.profileImage}
            />
            {hasRestrictions && (
              <View style={styles.restrictionBadge}>
                <Icon name="alert-circle" size={16} color={theme.colors.error} />
              </View>
            )}
          </View>
          <Text style={[commonStyles.cardTitle, styles.nameText]}>
            {member.prenom ? `${member.prenom} ${member.nom}` : member.nom || 'N/A'}
          </Text>
          <View style={styles.roleContainer}>
            <Icon name={roleIcon.name} size={14} color={roleIcon.color} style={styles.roleIcon} />
            <Text style={[styles.roleText, { color: isDarkMode ? '#D1D1D6' : '#4B5563' }]}>
              {role.charAt(0).toUpperCase() + role.slice(1)} • {calculateAge(member.dateNaissance) || 'N/A'} ans
            </Text>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="food-apple" size={16} color={theme.colors.success} style={styles.icon} />
              <Text style={[commonStyles.cardDescription, styles.infoText]}>
                {member.preferencesAlimentaires?.length > 0 ? member.preferencesAlimentaires.join(', ') : 'Aucune'}
              </Text>
            </View>
            {hasRestrictions && (
              <View style={styles.infoRow}>
                <Icon name="allergy" size={16} color={theme.colors.error} style={styles.icon} />
                <Text style={[commonStyles.cardDescription, styles.restrictionText]}>
                  {[...(member.restrictionsMedicales || []), ...(member.allergies || [])].join(', ')}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSuggestMeal}
            style={[commonStyles.button, styles.actionButton]}
            accessibilityLabel={`Suggérer un repas pour ${member.prenom || member.nom}`}
            accessibilityRole="button"
            activeOpacity={1}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.disabled]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[commonStyles.buttonGradient, styles.buttonGradient]}
            >
              <Icon name="robot-happy-outline" size={18} color={theme.colors.textPrimary} style={styles.buttonIcon} />
              <Text style={[commonStyles.buttonText, styles.buttonText]}>Suggérer un repas</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    width: 220,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.xlarge,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  touchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xlarge,
    justifyContent: 'space-between',
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  restrictionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  roleIcon: {
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  nameText: {
    textAlign: 'center',
    fontSize: theme.fonts.sizes.xs,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  infoContainer: {
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: theme.fonts.regular,
    flex: 1,
  },
  restrictionText: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.error,
    fontFamily: theme.fonts.regular,
    flex: 1,
  },
  actionButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
  },
});

export default FamilyCard;
