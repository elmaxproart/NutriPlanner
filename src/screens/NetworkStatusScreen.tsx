/* eslint-disable react-native/no-inline-styles */
// NetworkStatusScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

const { width} = Dimensions.get('window');

type NetworkStatusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NetworkStatus'>;

interface NetworkStatusScreenProps {
  navigation: NetworkStatusScreenNavigationProp;
}

const NetworkStatusScreen: React.FC<NetworkStatusScreenProps> = ({ navigation }) => {
  const {
    isConnected,
    hasData,
    loading,
    speed,
    latency,
    connectionType,
    strength,
    isWifi,
    isCellular,
    carrier,
    speedHistory,
    averageSpeed,
    averageLatency,
    connectionQuality,
  } = useNetworkStatus();

  const [showDetails, setShowDetails] = useState(false);

  // Animations
  const lottieScale = useSharedValue(0.8);
  const lottieOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const metricsOpacity = useSharedValue(0);
  const speedGaugeRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const strengthBar = useSharedValue(0);

  useEffect(() => {
    // Animations d'entrée
    lottieScale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    lottieOpacity.value = withTiming(1, { duration: 500 });
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    textOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    metricsOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));

    // Animation de la jauge de vitesse
    speedGaugeRotation.value = withTiming(
      interpolate(speed, [0, 100], [0, 180], 'clamp'),
      { duration: 1000, easing: Easing.out(Easing.ease) }
    );

    // Animation de la barre de signal
    strengthBar.value = withTiming(strength / 100, { duration: 1000 });

    // Pulsation si connecté
    if (isConnected && hasData) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.ease }),
          withTiming(1, { duration: 1000, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isConnected, hasData, loading, speed, strength, lottieScale, lottieOpacity, textTranslateY, textOpacity, metricsOpacity, speedGaugeRotation, strengthBar, pulseScale]);

  const animatedLottieStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lottieScale.value * pulseScale.value }],
    opacity: lottieOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const animatedMetricsStyle = useAnimatedStyle(() => ({
    opacity: metricsOpacity.value,
  }));

  const animatedSpeedGaugeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${speedGaugeRotation.value}deg` }],
  }));

  const animatedStrengthBarStyle = useAnimatedStyle(() => ({
    width: `${strengthBar.value * 100}%`,
  }));

  const getStatusMessage = () => {
    if (loading) {return 'Analyse du réseau en cours...';}
    if (!isConnected) {return 'Aucune connexion réseau';}
    if (!hasData) {return "Connexion limitée - Pas d'accès aux données";}

    const qualityMessages = {
      excellent: 'Connexion excellente ! 🚀',
      good: 'Bonne connexion 👍',
      fair: 'Connexion correcte ⚡',
      poor: 'Connexion lente 🐌',
      disconnected: 'Déconnecté ❌',
    };

    return qualityMessages[connectionQuality as keyof typeof qualityMessages] || 'Connexion établie';
  };

  const getQualityColor = () => {
    const colors = {
      'excellent': '#00ff88',
      'good': '#00cc66',
      'fair': '#ffaa00',
      'poor': '#ff6666',
      'disconnected': '#ff3333',
    };
    return colors[connectionQuality as keyof typeof colors] || '#666';
  };


  const lottieSource = isConnected
    ? hasData
      ? require('../assets/animations/connected.json')
      : require('../assets/animations/no-data.json')
    : require('../assets/animations/disconnected.json');

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />

      {/* Animation Lottie principale */}
      <Animated.View style={[styles.lottieContainer, animatedLottieStyle]}>
        <LottieView source={lottieSource} autoPlay loop style={styles.lottie} />
      </Animated.View>

      {/* Message de statut */}
      <Animated.Text style={[styles.statusText, animatedTextStyle, { color: getQualityColor() }]}>
        {getStatusMessage()}
      </Animated.Text>

      {/* Métriques en temps réel */}
      {!loading && (
        <Animated.View style={[styles.metricsContainer, animatedMetricsStyle]}>
          {/* Vitesse actuelle */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Vitesse</Text>
            <View style={styles.speedGauge}>
              <Animated.View style={[styles.speedNeedle, animatedSpeedGaugeStyle]} />
              <Text style={styles.speedValue}>{speed.toFixed(1)} Mbps</Text>
            </View>
          </View>

          {/* Latence */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Latence</Text>
            <Text style={[styles.metricValue, { color: latency < 100 ? '#00ff88' : latency < 300 ? '#ffaa00' : '#ff6666' }]}>
              {latency} ms
            </Text>
          </View>

          {/* Force du signal */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Signal</Text>
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <Animated.View style={[styles.strengthFill, animatedStrengthBarStyle]} />
              </View>
              <Text style={styles.strengthValue}>{strength}%</Text>
            </View>
          </View>

          {/* Type de connexion */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Type</Text>
            <Text style={styles.metricValue}>
              {isWifi ? '📶 WiFi' : isCellular ? '📱 Mobile' : connectionType}
              {carrier && ` (${carrier})`}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Bouton pour plus de détails */}
      {!loading && isConnected && hasData && (
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsButtonText}>
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Détails avancés */}
      {showDetails && (
        <Animated.View style={[styles.detailsContainer, animatedMetricsStyle]}>
          <Text style={styles.detailsTitle}>Statistiques avancées</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vitesse moyenne:</Text>
            <Text style={styles.detailValue}>{averageSpeed.toFixed(1)} Mbps</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Latence moyenne:</Text>
            <Text style={styles.detailValue}>{averageLatency.toFixed(0)} ms</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Historique vitesses:</Text>
            <Text style={styles.detailValue}>
              {speedHistory.slice(-3).map(s => s.toFixed(1)).join(', ')} Mbps
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Qualité globale:</Text>
            <Text style={[styles.detailValue, { color: getQualityColor() }]}>
              {connectionQuality.toUpperCase()}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Actions selon le statut */}
      {!loading && (!isConnected || !hasData) && (
        <Animated.View style={[styles.actionContainer, animatedTextStyle]}>
          <Text style={styles.reconnectText}>
            {!isConnected
              ? 'Vérifiez votre connexion Wi-Fi ou données mobiles'
              : 'Connexion limitée - Vérifiez vos paramètres réseau'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Indicateur de monitoring actif */}
      <View style={styles.monitoringIndicator}>
        <View style={styles.pulsingDot} />
        <Text style={styles.monitoringText}>Monitoring en temps réel</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lottieContainer: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    minWidth: width * 0.4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  speedGauge: {
    alignItems: 'center',
    position: 'relative',
  },
  speedNeedle: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: '#00ff88',
    transformOrigin: 'bottom',
    borderRadius: 1,
  },
  speedValue: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 35,
  },
  strengthContainer: {
    alignItems: 'center',
  },
  strengthBar: {
    width: 60,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  strengthValue: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  detailsButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#333',
  },
  reconnectText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f7b733',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#f7b733',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  monitoringIndicator: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginRight: 8,
  },
  monitoringText: {
    color: '#666',
    fontSize: 12,
  },
});

export default NetworkStatusScreen;
