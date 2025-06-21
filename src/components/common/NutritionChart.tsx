/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { theme } from '../../styles/theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { NutritionData } from '../../types/messageTypes';



interface NutrientConfig {
  icon: string;
  maxValue: number;
  unit: string;
  tooltip?: string;
}

interface NutritionChartProps {
  data: NutritionData[];
  style?: any;
  customNutrientConfig?: Partial<Record<string, NutrientConfig>>;
  barColors?: {
    low: string[];
    medium: string[];
    high: string[];
  };
}

const { width } = Dimensions.get('window');

const NutritionChart: React.FC<NutritionChartProps> = ({
  data,
  style,
  customNutrientConfig,
  barColors,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useColorScheme() === 'dark';
  const { isConnected } = useNetworkStatus();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const defaultNutrientConfig = useMemo(
    () => ({
      [t('nutrition.calories')]: {
        icon: 'fire',
        maxValue: 2500,
        unit: 'kcal',
        tooltip: t('nutrition.tooltips.calories'),
      },
      [t('nutrition.protein')]: {
        icon: 'food-steak',
        maxValue: 100,
        unit: 'g',
        tooltip: t('nutrition.tooltips.protein'),
      },
      [t('nutrition.carbs')]: {
        icon: 'barley',
        maxValue: 300,
        unit: 'g',
        tooltip: t('nutrition.tooltips.carbs'),
      },
      [t('nutrition.fat')]: {
        icon: 'oil',
        maxValue: 100,
        unit: 'g',
        tooltip: t('nutrition.tooltips.fat'),
      },
    }),
    [t],
  );

  // Fusionner la configuration par défaut avec la configuration personnalisée
  const nutrientConfig = useMemo(
    () => ({
      ...defaultNutrientConfig,
      ...customNutrientConfig,
    }),
    [defaultNutrientConfig, customNutrientConfig],
  );

  // Couleurs par défaut des barres
  const defaultBarColors = useMemo(
    () => ({
      low: ['#26A69A', '#4DB6AC'], // Vert
      medium: ['#FFB300', '#FFD700'], // Jaune
      high: ['#FF4F00', '#FF7F3F'], // Rouge-orange
    }),
    [],
  );

  const colors = barColors || defaultBarColors;

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Validation des données
  const isValidData = useMemo(() => {
    return (
      Array.isArray(data) &&
      data.every(
        (item) =>
          item.id &&
          item.name &&
          typeof item.value === 'number' &&
          item.unit &&
          nutrientConfig[item.name],
      )
    );
  }, [data, nutrientConfig]);

  const getBarColor = useCallback(
    (value: number, maxValue: number) => {
      const percentage = (value / maxValue) * 100;
      if (percentage > 80) {
        return colors.high;
      } else if (percentage > 50) {
        return colors.medium;
      } else {
        return colors.low;
      }
    },
    [colors],
  );

  const renderNutrientBar = useCallback(
    ({ item, index }: { item: NutritionData; index: number }) => {
      const config = nutrientConfig[item.name] || {
        icon: 'food',
        maxValue: 100,
        unit: item.unit,
        tooltip: t('nutrition.tooltips.default'),
      };
      return (
        <NutrientBar
          item={item}
          config={config}
          getBarColor={getBarColor}
          index={index}
          isDarkMode={isDarkMode}
        />
      );
    },
    [nutrientConfig, getBarColor, t, isDarkMode],
  );

  if (!isConnected) {
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <LinearGradient
          colors={isDarkMode ? ['#2C2C2E', '#1C1C1E'] : ['#F5F5F5', '#E0E0E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>{t('nutrition.title')}</Text>
        </LinearGradient>
        <Text style={styles.errorText}>{t('nutrition.errors.noConnection')}</Text>
      </Animated.View>
    );
  }

  if (!isValidData) {
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <LinearGradient
          colors={isDarkMode ? ['#2C2C2E', '#1C1C1E'] : ['#F5F5F5', '#E0E0E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>{t('nutrition.title')}</Text>
        </LinearGradient>
        <Text style={styles.errorText}>{t('nutrition.errors.invalidData')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <LinearGradient
        colors={isDarkMode ? ['#2C2C2E', '#1C1C1E'] : ['#F5F5F5', '#E0E0E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>{t('nutrition.title')}</Text>
      </LinearGradient>
      <View style={styles.nutrientList}>
        {data.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderNutrientBar({ item, index })}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
};

interface NutrientBarProps {
  item: NutritionData;
  config: NutrientConfig;
  getBarColor: (value: number, maxValue: number) => string[];
  index: number;
  isDarkMode: boolean;
}

const NutrientBar: React.FC<NutrientBarProps> = React.memo(
  ({ item, config, getBarColor, index, isDarkMode }) => {
    const { t } = useTranslation();
    const [showTooltip, setShowTooltip] = React.useState(false);
    const progress = Math.min((item.value / config.maxValue) * 100, 100);
    const barWidth = useSharedValue(0);

    useEffect(() => {
      barWidth.value = withSequence(
        withDelay(index * 100, withTiming(progress, { duration: 800 })),
      );
    }, [barWidth, progress, index]);

    const barAnimatedStyle = useAnimatedStyle(() => ({
      width: `${barWidth.value}%`,
    }));

    const handlePress = () => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    };

    const percentage = ((item.value / config.maxValue) * 100).toFixed(1);

    return (
      <View style={styles.nutrientContainer}>
        <TouchableOpacity
          onPress={handlePress}
          accessibilityLabel={t('nutrition.barLabel', {
            nutrient: item.name,
            value: item.value,
            unit: config.unit,
            percentage,
          })}
          accessibilityRole="button"
        >
          <View style={styles.nutrientHeader}>
            <MaterialCommunityIcons
              name={config.icon}
              size={24}
              color={theme.colors.textPrimary}
              style={styles.nutrientIcon}
            />
            <Text style={styles.nutrientName}>{item.name}</Text>
            <Text style={styles.nutrientValue}>
              {item.value} {config.unit}
            </Text>
          </View>
          <View style={styles.barContainer}>
            <Animated.View style={[styles.bar, barAnimatedStyle]}>
              <LinearGradient
                colors={getBarColor(item.value, config.maxValue)}
                style={styles.barGradient}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>
        {showTooltip && (
          <Animated.View
            style={[
              styles.tooltip,
              { backgroundColor: isDarkMode ? '#333' : '#FFF' },
            ]}
          >
            <Text style={[styles.tooltipText, { color: isDarkMode ? '#FFF' : '#333' }]}>
              {config.tooltip || t('nutrition.tooltips.default')}
              {'\n'}
              {t('nutrition.percentage', { percentage })}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    width: width - theme.spacing.lg * 2,
  },
  headerGradient: {
    padding: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large, // Augmenté pour meilleure lisibilité
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  nutrientList: {
    padding: theme.spacing.md,
  },
  nutrientContainer: {
    marginBottom: theme.spacing.lg, // Plus d'espace entre les barres
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nutrientIcon: {
    marginRight: theme.spacing.sm,
  },
  nutrientName: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    color: theme.colors.textPrimary,
  },
  nutrientValue: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.textSecondary,
  },
  barContainer: {
    height: 12, // Légèrement plus épais
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: theme.borderRadius.medium,
  },
  barGradient: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.medium,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    left: 50,
    right: 10,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  tooltipText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    textAlign: 'center',
  },
});

export default React.memo(NutritionChart);
