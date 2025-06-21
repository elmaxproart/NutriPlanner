/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useCallback, useMemo, useState } from 'react';
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
  withSpring,
  Easing,
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
  const [isDetailedView, setIsDetailedView] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const headerShimmer = useSharedValue(0);

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

  const nutrientConfig = useMemo(
    () => ({
      ...defaultNutrientConfig,
      ...customNutrientConfig,
    }),
    [defaultNutrientConfig, customNutrientConfig],
  );

  const defaultBarColors = useMemo(
    () => ({
      low: [theme.colors.success, theme.colors.info],
      medium: [theme.colors.warning, theme.colors.warning],
      high: [theme.colors.error, theme.colors.error],
    }),
    [],
  );

  const colors = barColors || defaultBarColors;

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 600 });
    headerShimmer.value = withSequence(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    );
  }, [opacity, translateY, headerShimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const headerShimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + headerShimmer.value * 0.2,
  }));

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

  const toggleView = () => {
    setIsDetailedView(!isDetailedView);
  };

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
          isDetailedView={isDetailedView}
        />
      );
    },
    [nutrientConfig, getBarColor, t, isDarkMode, isDetailedView],
  );

  if (!isConnected) {
    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <LinearGradient
          colors={
            isDarkMode
              ? [theme.colors.dark, theme.colors.secondary]
              : [theme.colors.primary, theme.colors.primary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.shimmerOverlay, headerShimmerStyle]} />
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
          colors={
            isDarkMode
              ? [theme.colors.dark, theme.colors.dark]
              : [theme.colors.primary, theme.colors.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.shimmerOverlay, headerShimmerStyle]} />
          <Text style={styles.title}>{t('nutrition.title')}</Text>
        </LinearGradient>
        <Text style={styles.errorText}>{t('nutrition.errors.invalidData')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [theme.colors.dark, theme.colors.dark]
            : [theme.colors.primary, theme.colors.primary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.shimmerOverlay, headerShimmerStyle]} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('nutrition.title')}</Text>
          <TouchableOpacity
            onPress={toggleView}
            style={styles.toggleButton}
            accessibilityLabel={t('nutrition.toggle_view', {
              view: isDetailedView ? 'compact' : 'detailed',
            })}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isDetailedView ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        </View>
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
  isDetailedView: boolean;
}

const NutrientBar: React.FC<NutrientBarProps> = React.memo(
  ({ item, config, getBarColor, index, isDarkMode, isDetailedView }) => {
    const { t } = useTranslation();
    const [showTooltip, setShowTooltip] = React.useState(false);
    const progress = Math.min((item.value / config.maxValue) * 100, 100);
    const barWidth = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const tooltipOpacity = useSharedValue(0);

    useEffect(() => {
      barWidth.value = withSequence(
        withDelay(index * 100, withTiming(progress, { duration: 800, easing: Easing.out(Easing.exp) })),
      );
      if (isDetailedView) {
        setShowTooltip(true);
      } else {
        setShowTooltip(false);
      }
    }, [barWidth, progress, index, isDetailedView]);

    useEffect(() => {
      tooltipOpacity.value = withTiming(showTooltip ? 1 : 0, { duration: 300 });
    }, [showTooltip, tooltipOpacity]);

    const barAnimatedStyle = useAnimatedStyle(() => ({
      width: `${barWidth.value}%`,
    }));

    const animatedPressStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const tooltipAnimatedStyle = useAnimatedStyle(() => ({
      opacity: tooltipOpacity.value,
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0.9, { duration: 200 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    };

    const handlePress = () => {
      if (!isDetailedView) {
        setShowTooltip(!showTooltip);
      }
    };

    const percentage = ((item.value / config.maxValue) * 100).toFixed(1);

    return (
      <View style={styles.nutrientContainer}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={t('nutrition.barLabel', {
            nutrient: item.name,
            value: item.value,
            unit: config.unit,
            percentage,
          })}
          accessibilityRole="button"
          activeOpacity={1}
        >
          <Animated.View style={[animatedPressStyle]}>
            <View style={styles.nutrientHeader}>
              <View
                style={[
                  styles.nutrientIconWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? theme.colors.dark
                      : '#fff',
                    borderColor: isDarkMode ? theme.colors.primary : theme.colors.dark,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={20}
                  color={isDarkMode ? theme.colors.primary : theme.colors.dark}
                />
              </View>
              <View style={styles.nutrientTextContainer}>
                <Text
                  style={[
                    styles.nutrientName,
                    { color: isDarkMode ? theme.colors.primary : theme.colors.textPrimary },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.nutrientValue,
                    { color: isDarkMode ? theme.colors.secondary : theme.colors.textSecondary },
                  ]}
                >
                  {item.value} {config.unit} ({percentage}%)
                </Text>
              </View>
              <View style={styles.circularProgress}>
                <LinearGradient
                  colors={getBarColor(item.value, config.maxValue)}
                  style={styles.circularProgressBackground}
                >
                  <Text style={styles.circularProgressText}>{percentage}%</Text>
                </LinearGradient>
              </View>
            </View>
            <View style={styles.barContainer}>
              <Animated.View style={[styles.bar, barAnimatedStyle]}>
                <LinearGradient
                  colors={getBarColor(item.value, config.maxValue)}
                  style={styles.barGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </TouchableOpacity>
        {showTooltip && (
          <Animated.View
            style={[
              styles.tooltip,
              tooltipAnimatedStyle,
              {
                backgroundColor: isDarkMode
                  ? theme.colors.dark
                  : theme.colors.dark,
              },
            ]}
          >
            <Text
              style={[
                styles.tooltipText,
                { color: isDarkMode ? theme.colors.primary : theme.colors.textPrimary },
              ]}
            >
              {config.tooltip || t('nutrition.tooltips.default')}
              {'\n'}
              <Text style={styles.tooltipHighlight}>
                {t('nutrition.percentage', { percentage })}
              </Text>
            </Text>
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: theme.colors.surface,
    width: width > 400 ? 380 : width - theme.spacing.lg * 2,
    maxWidth: 420,
  },
  headerGradient: {
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
    position: 'relative',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    color: theme.colors.white,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  toggleButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nutrientList: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  nutrientContainer: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    backgroundColor: theme.colors.dark,
    padding: theme.spacing.sm,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  nutrientIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
  },
  nutrientTextContainer: {
    flex: 1,
  },
  nutrientName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    letterSpacing: 0.2,
  },
  nutrientValue: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    marginTop: theme.spacing.xs,
  },
  circularProgress: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: theme.spacing.sm,
  },
  circularProgressBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fonts.sizes.small,
    color: theme.colors.white,
  },
  barContainer: {
    height: 12,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    width: '100%',
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
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  tooltip: {
    position: 'absolute',
    top: -70,
    left: 20,
    right: 20,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
    alignItems: 'center',
  },
  tooltipText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    textAlign: 'center',
  },
  tooltipHighlight: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
});

export default React.memo(NutritionChart);
