// NetworkService.ts
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

export interface NetworkMetrics {
  isConnected: boolean;
  hasData: boolean;
  speed: number; // Mbps
  latency: number; // ms
  connectionType: string;
  strength: number; // 0-100%
  isWifi: boolean;
  isCellular: boolean;
  carrier?: string;
}

export class NetworkService {
  private static listeners: ((metrics: NetworkMetrics) => void)[] = [];
  private static currentMetrics: NetworkMetrics = {
    isConnected: false,
    hasData: false,
    speed: 0,
    latency: 0,
    connectionType: 'unknown',
    strength: 0,
    isWifi: false,
    isCellular: false,
  };
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static speedTestInterval: NodeJS.Timeout | null = null;

  static async startContinuousMonitoring(intervalMs: number = 2000) {
    // Arrêter le monitoring précédent s'il existe
    this.stopContinuousMonitoring();

    // Première vérification immédiate
    await this.updateNetworkMetrics();

    // Monitoring continu
    this.monitoringInterval = setInterval(async () => {
      await this.updateNetworkMetrics();
    }, intervalMs);

    // Test de vitesse toutes les 10 secondes
    this.speedTestInterval = setInterval(async () => {
      if (this.currentMetrics.isConnected && this.currentMetrics.hasData) {
        await this.measureSpeed();
      }
    }, 10000);

    logger.info('Continuous network monitoring started');
  }

  static stopContinuousMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.speedTestInterval) {
      clearInterval(this.speedTestInterval);
      this.speedTestInterval = null;
    }
    logger.info('Continuous network monitoring stopped');
  }

  private static async updateNetworkMetrics() {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected ?? false;

      // Tester la disponibilité des données
      let hasData = false;
      let latency = 0;

      if (isConnected) {
        const { hasData: dataAvailable, latency: measuredLatency } = await this.testDataConnection();
        hasData = dataAvailable;
        latency = measuredLatency;
      }

      const newMetrics: NetworkMetrics = {
        isConnected,
        hasData,
        speed: this.currentMetrics.speed,
        latency,
        connectionType: state.type || 'unknown',
        strength: this.calculateSignalStrength(state),
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        carrier: state.type,
      };

      this.currentMetrics = newMetrics;
      this.notifyListeners(newMetrics);
    } catch (error) {
      logger.error('Error updating network metrics', { error });
    }
  }

  private static async testDataConnection(): Promise<{ hasData: boolean; latency: number }> {
    const testUrls = [
      'https://www.google.com',
      'https://www.cloudflare.com',
      'https://httpbin.org/get',
    ];

    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (response.ok) {
          return { hasData: true, latency };
        }
      } catch (error) {
        // Continuer avec l'URL suivante
      }
    }

    return { hasData: false, latency: 0 };
  }

  private static async measureSpeed(): Promise<number> {
    try {
      const testSizes = [
        { url: 'https://httpbin.org/bytes/100000', size: 100000 }, // 100KB
        { url: 'https://httpbin.org/bytes/500000', size: 500000 }, // 500KB
        { url: 'https://httpbin.org/bytes/1000000', size: 1000000 }, // 1MB
      ];

      let totalSpeed = 0;
      let validTests = 0;

      for (const test of testSizes) {
        try {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(test.url, {
            signal: controller.signal,
          });

          if (response.ok) {
            await response.blob(); // Consommer la réponse
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // en secondes
            const speedMbps = (test.size * 8) / (duration * 1000000); // Mbps

            totalSpeed += speedMbps;
            validTests++;
          }

          clearTimeout(timeoutId);
        } catch (error) {
          // Ignorer ce test
        }
      }

      const averageSpeed = validTests > 0 ? totalSpeed / validTests : 0;
      this.currentMetrics.speed = Math.round(averageSpeed * 100) / 100;
      this.notifyListeners(this.currentMetrics);

      return averageSpeed;
    } catch (error) {
      logger.error('Error measuring speed', { error });
      return 0;
    }
  }

  private static calculateSignalStrength(state: any): number {
    if (state.type === 'wifi' && state.details?.strength) {
      return Math.max(0, Math.min(100, state.details.strength));
    }
    if (state.type === 'cellular' && state.details?.cellularGeneration) {
      const generation = state.details.cellularGeneration;
      if (generation === '5g') {return 90;}
      if (generation === '4g') {return 75;}
      if (generation === '3g') {return 50;}
      if (generation === '2g') {return 25;}
    }
    return state.isConnected ? 70 : 0; // Valeur par défaut
  }

  static subscribe(callback: (metrics: NetworkMetrics) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentMetrics); // Appel initial

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(metrics: NetworkMetrics) {
    this.listeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        logger.error('Error notifying network listener', { error });
      }
    });
  }

  static getCurrentMetrics(): NetworkMetrics {
    return { ...this.currentMetrics };
  }

  static async isConnected(): Promise<boolean> {
    return this.currentMetrics.isConnected;
  }

  static async fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const isConnected = await this.isConnected();
        if (!isConnected) {
          throw new Error('No internet connection');
        }

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        logger.debug('Network request successful', { url, attempt });
        return response;
      } catch (error) {
        logger.warn(`Network request failed, attempt ${attempt}/${maxRetries}`, { error });
        if (attempt === maxRetries) {
          logger.error('Max retries reached for network request', { url, error });
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Max retries reached');
  }
}
