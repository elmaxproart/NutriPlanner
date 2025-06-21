// useNetworkStatus.ts
import { useState, useEffect, useRef } from 'react';
import { NetworkService, NetworkMetrics } from '../services/NetworkService';
import { logger } from '../utils/logger';

export const useNetworkStatus = () => {
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    isConnected: false,
    hasData: false,
    speed: 0,
    latency: 0,
    connectionType: 'unknown',
    strength: 0,
    isWifi: false,
    isCellular: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const mountedRef = useRef(true);
  const initialCheckRef = useRef(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let initialCheckTimer: NodeJS.Timeout | null = null;

    const initializeNetworkMonitoring = async () => {
      try {
        // Vérification initiale immédiate
        const initialMetrics = await NetworkService.getCurrentMetrics();

        if (!mountedRef.current) {return;}

        // Attendre un minimum de temps pour éviter le scintillement
        const minLoadingTime = new Promise(resolve => {
          initialCheckTimer = setTimeout(resolve, 1000); // 1 seconde minimum
        });

        // Démarrer le monitoring continu
        await NetworkService.startContinuousMonitoring(1500);

        // S'abonner aux mises à jour
        unsubscribe = NetworkService.subscribe((newMetrics) => {
          if (!mountedRef.current) {return;}

          // Pour la première mise à jour, attendre que le délai minimum soit écoulé
          if (!initialCheckRef.current) {
            minLoadingTime.then(() => {
              if (!mountedRef.current) {return;}
              setMetrics(newMetrics);
              setIsLoading(false);
              initialCheckRef.current = true;
              logger.info('Initial network metrics loaded', newMetrics);
            });
          } else {
            // Mises à jour suivantes
            setMetrics(newMetrics);
          }

          // Maintenir un historique des vitesses (dernières 10 mesures)
          if (newMetrics.speed > 0) {
            setSpeedHistory(prev => {
              const updated = [...prev, newMetrics.speed];
              return updated.slice(-10);
            });
          }

          // Maintenir un historique des latences (dernières 10 mesures)
          if (newMetrics.latency > 0) {
            setLatencyHistory(prev => {
              const updated = [...prev, newMetrics.latency];
              return updated.slice(-10);
            });
          }

          if (initialCheckRef.current) {
            logger.info('Network metrics updated', newMetrics);
          }
        });

        // Si aucune mise à jour n'arrive dans les 3 secondes, forcer l'arrêt du loading
        setTimeout(() => {
          if (!mountedRef.current || initialCheckRef.current) {return;}

          setMetrics(initialMetrics);
          setIsLoading(false);
          initialCheckRef.current = true;
          logger.warn('Network monitoring timeout - using initial metrics');
        }, 3000);

      } catch (error) {
        logger.error('Error initializing network monitoring', { error });
        if (mountedRef.current) {
          setIsLoading(false);
          initialCheckRef.current = true;
        }
      }
    };

    initializeNetworkMonitoring();

    return () => {
      mountedRef.current = false;
      initialCheckRef.current = false;

      if (initialCheckTimer) {
        clearTimeout(initialCheckTimer);
      }

      if (unsubscribe) {
        unsubscribe();
      }

      NetworkService.stopContinuousMonitoring();
    };
  }, []);

  const getAverageSpeed = () => {
    if (speedHistory.length === 0) {return 0;}
    return speedHistory.reduce((sum, speed) => sum + speed, 0) / speedHistory.length;
  };

  const getAverageLatency = () => {
    if (latencyHistory.length === 0) {return 0;}
    return latencyHistory.reduce((sum, latency) => sum + latency, 0) / latencyHistory.length;
  };

  const getConnectionQuality = () => {
    const avgSpeed = getAverageSpeed();
    const avgLatency = getAverageLatency();

    if (!metrics.isConnected || !metrics.hasData) {return 'disconnected';}
    if (avgSpeed > 10 && avgLatency < 100) {return 'excellent';}
    if (avgSpeed > 5 && avgLatency < 200) {return 'good';}
    if (avgSpeed > 1 && avgLatency < 500) {return 'fair';}
    return 'poor';
  };

  return {
    ...metrics,
    isLoading, // Changé de 'loading' à 'isLoading' pour la cohérence
    speedHistory,
    latencyHistory,
    averageSpeed: getAverageSpeed(),
    averageLatency: getAverageLatency(),
    connectionQuality: getConnectionQuality(),
  };
};
