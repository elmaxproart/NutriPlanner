import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { IconFamily, IconSpec } from '../../../constants/mockData';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface Month {
  id: string;
  shortName: string;
  fullName: string;
  value: string;
  icon?: IconSpec;
}

interface SelectMonthModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (monthValue: string, isFinalStep?: boolean) => Promise<void>;
  title?: string;
  initialDate?: string;
  isFinalStep?: boolean;
}

interface MonthCardProps {
  month: Month;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const getThemedIcon = (family: IconFamily, name: string, size: number, color: string) => {
  switch (family) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={name} size={size} color={color} />;
    case 'FontAwesome':
      return <FontAwesome name={name} size={size} color={color} />;
    case 'AntDesign':
      return <AntDesign name={name} size={size} color={color} />;
    case 'Ionicons':
      return <Ionicons name={name} size={size} color={color} />;
    default:
      return <MaterialCommunityIcons name="calendar-month" size={size} color={color} />;
  }
};

const MonthCard: React.FC<MonthCardProps> = ({ month, isSelected, onSelect }) => {
  const cardScale = useSharedValue(1);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1, { damping: 10, stiffness: 100 });
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, styles.cardSpacing, isSelected && styles.selectedCard]}
      onPress={() => onSelect(month.id)}
      accessibilityLabel={`Sélectionner le mois ${month.fullName}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`month-card-${month.id}`}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {getThemedIcon(
            month.icon?.family || 'MaterialCommunityIcons',
            month.icon?.name || 'calendar-month',
            40,
            theme.colors.primary,
          )}
          <View style={styles.monthInfo}>
            <Text style={commonStyles.cardTitle}>{month.shortName}</Text>
            <Text style={commonStyles.cardDescription}>{month.fullName}</Text>
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

const SelectMonthModal: React.FC<SelectMonthModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner un mois',
  initialDate,
  isFinalStep = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const monthsInYear = useMemo(() => {
    const months: Month[] = [];
    const monthNames = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    const shortMonthNames = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    for (let i = 0; i < 12; i++) {
      const monthNumber = (i + 1).toString().padStart(2, '0');
      const id = `${selectedYear}-${monthNumber}`;
      months.push({
        id,
        shortName: shortMonthNames[i],
        fullName: `${monthNames[i]} ${selectedYear}`,
        value: id,
        icon: { name: 'calendar-month', family: 'MaterialCommunityIcons' },
      });
    }
    return months;
  }, [selectedYear]);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      modalTranslateY.value = withTiming(0, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      AccessibilityInfo.announceForAccessibility('Modal de sélection de mois ouvert');
      if (initialDate) {
        setSelectedYear(parseInt(initialDate.substring(0, 4), 10));
        setSelectedMonthId(initialDate);
      } else {
        const today = new Date();
        const defaultMonthId = `${today.getFullYear()}-${(today.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        setSelectedYear(today.getFullYear());
        setSelectedMonthId(defaultMonthId);
      }
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setSelectedMonthId(null);
        setSelectedYear(currentYear);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialDate, currentYear]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const renderMonth = ({ item }: { item: Month }) => (
    <MonthCard
      month={item}
      isSelected={item.id === selectedMonthId}
      onSelect={setSelectedMonthId}
    />
  );

  const handleConfirm = useCallback(async () => {
    if (selectedMonthId) {
      const month = monthsInYear.find((m) => m.id === selectedMonthId);
      if (month) {
        await onSelect(month.value, isFinalStep);
        onClose();
        AccessibilityInfo.announceForAccessibility(`Mois ${month.fullName} sélectionné`);
      }
    }
  }, [selectedMonthId, onSelect, onClose, monthsInYear, isFinalStep]);

  const handleYearChange = useCallback((increment: number) => {
    setSelectedYear((prevYear) => prevYear + increment);
    setSelectedMonthId(null);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection de mois"
      testID="select-month-modal"
    >
      <View style={commonStyles.modalOverlay}>
        <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
          <TouchableOpacity
            style={commonStyles.closeModalButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
            testID="close-button"
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
            {title}
          </Text>
          <View style={styles.yearSelectorContainer}>
            <TouchableOpacity
              style={styles.yearChangeButton}
              onPress={() => handleYearChange(-1)}
              accessibilityLabel="Année précédente"
              testID="prev-year-button"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={30}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.selectedYearText} accessibilityLiveRegion="polite">
              {selectedYear}
            </Text>
            <TouchableOpacity
              style={styles.yearChangeButton}
              onPress={() => handleYearChange(1)}
              accessibilityLabel="Année suivante"
              testID="next-year-button"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={30}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={monthsInYear}
            renderItem={renderMonth}
            keyExtractor={(item) => item.id}
            contentContainerStyle={commonStyles.verticalListContent}
            showsVerticalScrollIndicator={false}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={commonStyles.centeredContainer}>
                <Text style={commonStyles.textSecondary}>
                  Aucun mois disponible pour cette année.
                </Text>
              </View>
            }
            accessibilityLabel="Liste des mois"
            testID="months-list"
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={!selectedMonthId}
            accessibilityLabel={isFinalStep ? 'Finaliser la sélection' : 'Confirmer la sélection'}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                selectedMonthId
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : [theme.colors.disabled, theme.colors.disabled]
              }
              style={commonStyles.buttonGradient}
            >
              <Text style={commonStyles.buttonText}>
                {isFinalStep ? 'Finaliser' : 'Confirmer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardSpacing: {
    margin: theme.spacing.xs,
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  monthInfo: {
    alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.sm,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.xs,
  },
  yearChangeButton: {
    padding: theme.spacing.sm,
  },
  selectedYearText: {
    fontSize: theme.fonts.sizes.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginHorizontal: theme.spacing.md,
  },
});

export default SelectMonthModal;
