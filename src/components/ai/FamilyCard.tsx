import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as geminiStyles } from '../../styles/geminiStyle';

interface FamilyCardProps {
  member: {
    nom: string;
    prenom?: string;
    photoProfil?: string;
    preferencesAlimentaires: string[];
    restrictionsAlimentaires?: string[];
    age?: number;
  };
  onPress: () => void;
  onSendToAI?: (message: string) => void;
}

export const FamilyCard = ({ member, onPress, onSendToAI }: FamilyCardProps) => {
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.9);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const hasRestrictions = member.restrictionsAlimentaires && member.restrictionsAlimentaires.length > 0;

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[geminiStyles.suggestionCard, localStyles.cardContainer]}
    >
      <Animated.View style={animatedStyle}>
        <View style={localStyles.header}>
          <Image
            source={{
              uri: member.photoProfil || '../assets/images/default_profile.png',
            }}
            style={localStyles.profileImage}
          />
          {hasRestrictions && (
            <View style={localStyles.restrictionBadge}>
              <Icon name="alert-circle" size={16} color="#E74C3C" />
            </View>
          )}
        </View>
        <Text style={geminiStyles.cardTitle}>
          {member.prenom ? `${member.prenom} ${member.nom}` : member.nom}
        </Text>
        {member.age && (
          <Text style={localStyles.ageText}>
            Âge : {member.age} ans
          </Text>
        )}
        <View style={localStyles.preferencesContainer}>
          <Icon name="food-apple" size={16} color="#27AE60" style={localStyles.icon} />
          <Text style={geminiStyles.cardDescription}>
            Préférences : {member.preferencesAlimentaires.length > 0 ? member.preferencesAlimentaires.join(', ') : 'Aucune'}
          </Text>
        </View>
        {hasRestrictions && (
          <View style={localStyles.restrictionsContainer}>
            <Icon name="alert-circle-outline" size={16} color="#E74C3C" style={localStyles.icon} />
            <Text style={localStyles.restrictionsText}>
              Restrictions : {member.restrictionsAlimentaires?.join(', ')}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          onPress={() => onSendToAI?.(`Suggérer un repas pour ${member.nom}`)}
          style={localStyles.actionButton}
        >
          <Animated.View style={[localStyles.actionButtonInner, animatedButtonStyle]}>
            <Icon name="chef-hat" size={20} color="#ffffff" />
            <Text style={localStyles.actionButtonText}>Suggérer un repas</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  cardContainer: {
    padding: 20,
    marginVertical: 10,
    position: 'relative',
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2980b9',
  },
  restrictionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  ageText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginBottom: 8,
  },
  preferencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restrictionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restrictionsText: {
    color: '#E74C3C',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 8,
  },
  actionButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2980b9',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FamilyCard;
