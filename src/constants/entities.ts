export interface MembreFamille {
  id: string;
  userId: string;
  familyId: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: 'homme' | 'femme' | 'autre';
  preferencesAlimentaires: string[];
  allergies: string[];
  restrictionsMedicales: string[];
  photoProfil?: string;
  repasFavoris?: string[];
  historiqueRepas: { repasId: string; date: string }[];
  contactUrgence?: {
    nom: string;
    telephone: string;
  };
  aiPreferences?: {
    niveauEpices: 'faible' | 'moyen' | 'élevé';
    apportCaloriqueCible: number;
    cuisinesPreferees: string[];
  };
}

export interface Ingredient {
  id: string;
  familyId: string;
  nom: string;
  quantite: number;
  unite: string;
  categorie?: string;
  prixUnitaire?: number;
  perissable: boolean;
  datePeremption?: string;
  stockActuel: number;
  marque?: string;
  valeurNutritionnelle?: {
    calories: number;
    proteines: number;
    glucides: number;
    lipides: number;
  };
  createurId: string;
  dateCreation: string;
  dateMiseAJour?: string;
}

export interface Recette {
  id: string;
  familyId: string;
  nom: string;
  ingredients: { ingredientId: string; quantite: number; unite: string }[];
  instructions: string;
  tempsPreparation: number;
  tempsCuisson?: number;
  portions: number;
  categorie: string;
  difficulte: 'facile' | 'moyen' | 'difficile';
  imageUrl?: string;
  etapesPreparation: { texte: string; ordre: number }[];
  tags?: string[];
  coutEstime?: number;
  createurId: string;
  dateCreation: string;
  dateMiseAJour?: string;
  aiAnalysis?: {
    caloriesTotales: number;
    niveauEpices: 'faible' | 'moyen' | 'élevé';
    adequationMembres: { [membreId: string]: 'adapté' | 'non adapté' };
  };
}

export interface Menu {
  id: string;
  familyId: string;
  date: string;
  typeRepas: 'petit-déjeuner' | 'déjeuner' | 'dîner';
  recettes: { recetteId: string; portionsServies: number }[];
  foodName?: string;
  foodPick?: string;
  description?: string;
  coutTotalEstime?: number;
  statut: 'planifié' | 'terminé' | 'annulé';
  notes?: string;
  createurId: string;
  dateCreation: string;
  dateMiseAJour?: string;
  aiSuggestions?: {
    recettesAlternatives: string[];
    ingredientsManquants: { nom: string; quantite: number; unite: string }[];
  };
}

export interface ListeCourses {
  id: string;
  familyId: string;
  nom: string;
  items: { ingredientId: string; quantite: number; unite: string; achete: boolean }[];
  budgetEstime?: number;
  createurId: string;
  dateCreation: string;
  dateMiseAJour?: string;
  statut: 'en cours' | 'terminée';
}
