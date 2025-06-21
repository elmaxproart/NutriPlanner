import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles } from '../../styles/commonStyles';
import { mockFamilyMembers } from '../../constants/mockData';
import FamilyCard from './FamilyCard';
import { theme } from '../../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useNavigation } from '@react-navigation/native';
import { MembreFamille } from '../../constants/entities';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FamilySection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleCardPress = useCallback((member: MembreFamille) => {
    navigation.navigate('FamilyMemberDetail', { memberId: member.id });
  }, [navigation]);

  const handleSeeAll = useCallback(() => {
    navigation.navigate('FamilyList');
  }, [navigation]);

  const renderFamilyCard = ({ item }: { item: MembreFamille }) => (
    <FamilyCard
      member={item}
      onPress={() => handleCardPress(item)}
    />
  );

  return (
    <Animated.View style={[commonStyles.sectionContainer, animatedStyle, styles.container]}>
      <LinearGradient
        colors={isDarkMode ? ['#2C2C2E', '#1C1C1E'] : ['#F8F9FA', '#E9ECEF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={commonStyles.sectionHeader}>
          <Text style={[commonStyles.sectionHeaderTitle, styles.headerTitle]}>
            Membres de la famille
          </Text>
          <TouchableOpacity
            onPress={handleSeeAll}
            style={styles.seeMoreButton}
            accessibilityLabel="Voir tous les membres de la famille"
            accessibilityRole="button"
          >
            <Text style={[commonStyles.seeMoreText, styles.seeMoreText]}>Voir tous</Text>
            <Icon name="arrow-right" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <FlatList
        data={mockFamilyMembers}
        renderItem={renderFamilyCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={commonStyles.horizontalListContent}
        snapToAlignment="center"
        decelerationRate="fast"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerGradient: {
    padding: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.small,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  seeMoreText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.small,
    marginRight: theme.spacing.xs,
    color: theme.colors.primary,
  },
});

export default FamilySection;
