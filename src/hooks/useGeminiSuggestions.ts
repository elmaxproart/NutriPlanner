import { useState, useEffect } from 'react';
import { GeminiService } from '../services/GeminiService';
import { Ingredient, Menu, MembreFamille } from '../constants/entities';
import { useNetworkStatus } from './useNetworkStatus';
import { GEMINI_API_KEY } from '../constants/config';

export const useGeminiSuggestions = (ingredients: Ingredient[], familyData: MembreFamille[]) => {
  const [suggestions, setSuggestions] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnected = useNetworkStatus();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isConnected) {
        setError('Connexion internet requise pour les suggestions Gemini');
        return;
      }

      if (ingredients.length === 0 || familyData.length === 0) {
        setError('Données insuffisantes pour les suggestions');
        return;
      }

      setLoading(true);
      try {
        const service = new GeminiService(GEMINI_API_KEY);
        const result = await service.getMenuSuggestions(ingredients, familyData);
        setSuggestions(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue lors de la récupération des suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [ingredients, familyData, isConnected]);

  return { suggestions, loading, error };
};
