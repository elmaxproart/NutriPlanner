import type { Ingredient, Recette, Menu, Budget } from '../constants/entities';
import type { Unit } from '../constants/units';

// Générer un ID unique avec un préfixe
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Formatter une date (jj/mm/aaaa)
export const formatDate = (date: string | number | Date): string => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Formatter une date pour Firestore (ISO string)
export const formatDateForFirestore = (date: string | number | Date): string => {
  return new Date(date).toISOString();
};

// Convertir les unités
export const convertUnit = (quantite: number, fromUnit: Unit, toUnit: Unit): number => {
  const conversionFactors: Record<string, number> = {
    'g-to-kg': 0.001,
    'kg-to-g': 1000,
    'ml-to-l': 0.001,
    'l-to-ml': 1000,
  };

  if (fromUnit === toUnit) {return quantite;}

  const key = `${fromUnit}-to-${toUnit}`;
  const factor = conversionFactors[key];
  if (!factor) {
    throw new Error(`Conversion d’unité non supportée de ${fromUnit} à ${toUnit}.`);
  }

  return quantite * factor;
};

// Calculer le coût d'une recette
export const calculateRecipeCost = (recette: Recette, ingredients: Ingredient[]): number => {
  let totalCost = 0;
  for (const item of recette.ingredients) {
    const ingredient = ingredients.find((ing) => ing.id === item.id);
    if (!ingredient || !ingredient.prixUnitaire) {continue;}

    const quantiteInBaseUnit = convertUnit(item.quantite, item.unite, ingredient.unite);
    totalCost += quantiteInBaseUnit * ingredient.prixUnitaire;
  }
  return Number(totalCost.toFixed(2));
};

// Calculer le coût d'un menu
export const calculateMenuCost = (menu: Menu, recettes: Recette[], ingredients: Ingredient[]): number => {
  let totalCost = 0;
  for (const item of menu.recettes) {
    const recette = recettes.find((rec) => rec.id === item.id);
    if (!recette) {continue;}
    const cost = calculateRecipeCost(recette, ingredients);
    totalCost += cost * (item.portions / recette.portions);
  }
  return Number(totalCost.toFixed(2));
};

// Vérifier si le budget est dépassé
export const isBudgetExceeded = (budget: Budget): boolean => {
  const totalDepenses = budget.depenses.reduce((sum, depense) => sum + depense.montant, 0);
  return totalDepenses > budget.plafond;
};

// Vérifier si une date est future
export const isFutureDate = (date: string): boolean => {
  return new Date(date) > new Date();
};

// Calculer l'âge à partir d'une date de naissance
export const calculateAge = (birthDate: string | number): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {age--;}
  return age;
};

// Vérifier si un email est valide
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

 export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {return error.message;}
   if (typeof error === 'string') {return error;}
   return 'An unknown error occurred';
}

 export const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };


const analytics = {
  track: (event: string, properties: Record<string, any>) => {
    console.log(`Analytics: ${event}`, properties);
  },
};

export default analytics;
