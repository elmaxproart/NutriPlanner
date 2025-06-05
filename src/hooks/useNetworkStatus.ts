import { useState, useEffect } from 'react';
import { NetworkService } from '../services/NetworkService';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetworkService.subscribe(setIsConnected);
    return () => unsubscribe();
  }, []);

  return isConnected;
};
