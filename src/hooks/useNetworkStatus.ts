import { useState, useEffect } from 'react';
import { NetworkService } from '../services/NetworkService';
import { logger } from '../utils/logger';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await NetworkService.isConnected();
        setIsConnected(status);
        logger.info('Network status checked', { isConnected: status });
      } catch (err: any) {
        logger.error('Error checking network status', { error: err.message });
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();

    const unsubscribe = NetworkService.subscribe(status => {
      setIsConnected(status);
      logger.info('Network status updated', { isConnected: status });
    });
    return unsubscribe;
  }, []);

  return { isConnected, loading };
};
