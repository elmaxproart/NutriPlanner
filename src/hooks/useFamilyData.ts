import { useState, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { MembreFamille } from '../constants/entities';

export const useFamilyData = () => {
  const { familyMembers, fetchFamilyMembers, loading, error } = useFirestore();
  const [filteredMembers, setFilteredMembers] = useState<MembreFamille[]>([]);

  useEffect(() => {
    setFilteredMembers(familyMembers.filter(member => member.aiPreferences));
  }, [familyMembers]);

  return { familyMembers: filteredMembers, fetchFamilyMembers, loading, error };
};
