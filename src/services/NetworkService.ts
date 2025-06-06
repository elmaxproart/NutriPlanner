import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

export class NetworkService {
  static async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected ?? false;
      logger.debug('Network status checked', { isConnected });
      return isConnected;
    } catch (error) {
      logger.error('Error checking network', { error });
      return false;
    }
  }

  static subscribe(callback: (isConnected: boolean) => void): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      logger.debug('Network status updated', { isConnected });
      callback(isConnected);
    });
    return unsubscribe;
  }

  static async fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const isConnected = await this.isConnected();
        if (!isConnected) {throw new Error('No internet connection');}
        const response = await fetch(url, options);
        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
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
