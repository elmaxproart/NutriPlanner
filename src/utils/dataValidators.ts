import type { Ingredient, Recette, MembreFamille, Budget, StoreItem, Menu, ListeCourses, Store, HistoriqueRepas } from '../constants/entities';
import type { Unit } from '../constants/units';

// Fonction générique pour vérifier les champs requis
const checkRequiredFields = <T>(obj: T, requiredFields: (keyof T)[]): string[] => {
  const errors: string[] = [];
  requiredFields.forEach((field) => {
    if (obj[field] === undefined || obj[field] === null || (typeof obj[field] === 'string' && (obj[field] as string).trim() === '')) {
      errors.push(`Le champ ${String(field)} est requis.`);
    }
  });
  return errors;
};

// Validation pour un membre de la famille
export const validateMembreFamille = (membre: Partial<MembreFamille>): string[] => {
  const requiredFields: (keyof MembreFamille)[] = ['nom', 'prenom', 'dateNaissance', 'role', 'userId', 'familyId', 'createurId'];
  const errors = checkRequiredFields(membre, requiredFields);

  // Validation de la date de naissance
  if (membre.dateNaissance) {
    const date = new Date(membre.dateNaissance);
    if (isNaN(date.getTime())) {
      errors.push('La date de naissance est invalide.');
    } else if (date > new Date()) {
      errors.push('La date de naissance ne peut pas être dans le futur.');
    }
  }

  // Validation du genre
  if (membre.genre && !['homme', 'femme', 'autre'].includes(membre.genre)) {
    errors.push('Le genre doit être "homme", "femme" ou "autre".');
  }

  // Validation du rôle
  if (membre.role && !['parent', 'enfant', 'conjoint', 'autre'].includes(membre.role)) {
    errors.push('Le rôle doit être "parent", "enfant", "conjoint" ou "autre".');
  }

  // Validation des préférences alimentaires et allergies (doivent être des tableaux)
  if (membre.preferencesAlimentaires && !Array.isArray(membre.preferencesAlimentaires)) {
    errors.push('Les préférences alimentaires doivent être un tableau.');
  }
  if (membre.allergies && !Array.isArray(membre.allergies)) {
    errors.push('Les allergies doivent être un tableau.');
  }
  if (membre.restrictionsMedicales && !Array.isArray(membre.restrictionsMedicales)) {
    errors.push('Les restrictions médicales doivent être un tableau.');
  }

  // Validation du niveau d'accès
  if (membre.niveauAcces && !['admin', 'membre'].includes(membre.niveauAcces)) {
    errors.push('Le niveau d’accès doit être "admin" ou "membre".');
  }

  // Validation des préférences IA
  if (membre.aiPreferences) {
    if (typeof membre.aiPreferences.niveauEpices !== 'number' || membre.aiPreferences.niveauEpices < 1 || membre.aiPreferences.niveauEpices > 5) {
      errors.push('Le niveau d’épices doit être un nombre entre 1 et 5.');
    }
    if (!Array.isArray(membre.aiPreferences.cuisinesPreferees)) {
      errors.push('Les cuisines préférées doivent être un tableau.');
    }
  }

  return errors;
};

// Validation pour un ingrédient
export const validateIngredient = (ingredient: Partial<Ingredient>): string[] => {
  const requiredFields: (keyof Ingredient)[] = ['nom', 'quantite', 'unite', 'familyId', 'createurId'];
  const errors = checkRequiredFields(ingredient, requiredFields);

  // Validation de la quantité
  if (ingredient.quantite !== undefined && (typeof ingredient.quantite !== 'number' || ingredient.quantite <= 0)) {
    errors.push('La quantité doit être un nombre supérieur à 0.');
  }

  // Validation de l'unité
  const validUnits: Unit[] = ['g', 'kg', 'ml', 'l', 'unité', 'cuillère à soupe', 'cuillère à café', 'pincée', 'tranche', 'boîte', 'paquet'];
  if (ingredient.unite && !validUnits.includes(ingredient.unite)) {
    errors.push(`L’unité doit être l’une des suivantes : ${validUnits.join(', ')}.`);
  }

  // Validation de la date de péremption
  if (ingredient.datePeremption) {
    const date = new Date(ingredient.datePeremption);
    if (isNaN(date.getTime())) {
      errors.push('La date de péremption est invalide.');
    }
  }

  // Validation du stock actuel
  if (ingredient.stockActuel !== undefined && (typeof ingredient.stockActuel !== 'number' || ingredient.stockActuel < 0)) {
    errors.push('Le stock actuel ne peut pas être négatif.');
  }

  // Validation du prix unitaire
  if (ingredient.prixUnitaire !== undefined && (typeof ingredient.prixUnitaire !== 'number' || ingredient.prixUnitaire < 0)) {
    errors.push('Le prix unitaire ne peut pas être négatif.');
  }

  return errors;
};

// Validation pour une recette
export const validateRecette = (recette: Partial<Recette>): string[] => {
  const requiredFields: (keyof Recette)[] = ['nom', 'ingredients', 'instructions', 'portions', 'categorie', 'familyId', 'createurId'];
  const errors = checkRequiredFields(recette, requiredFields);

  // Validation des portions
  if (recette.portions !== undefined && (typeof recette.portions !== 'number' || recette.portions <= 0)) {
    errors.push('Le nombre de portions doit être un nombre supérieur à 0.');
  }

  // Validation des ingrédients
  if (recette.ingredients && !recette.ingredients.length) {
    errors.push('La recette doit contenir au moins un ingrédient.');
  } else if (recette.ingredients) {
    recette.ingredients.forEach((item, index) => {
      if (!item.ingredientId) {
        errors.push(`L’ingrédient à l’index ${index} doit avoir un ID valide.`);
      }
      if (item.quantite <= 0) {
        errors.push(`La quantité de l’ingrédient à l’index ${index} doit être supérieure à 0.`);
      }
      if (!item.unite) {
        errors.push(`L’unité de l’ingrédient à l’index ${index} est requise.`);
      }
    });
  }

  // Validation du temps de préparation
  if (recette.tempsPreparation !== undefined && (typeof recette.tempsPreparation !== 'number' || recette.tempsPreparation < 0)) {
    errors.push('Le temps de préparation ne peut pas être négatif.');
  }

  // Validation du temps de cuisson
  if (recette.tempsCuisson !== undefined && (typeof recette.tempsCuisson !== 'number' || recette.tempsCuisson < 0)) {
    errors.push('Le temps de cuisson ne peut pas être négatif.');
  }

  // Validation de la difficulté
  if (recette.difficulte && !['facile', 'moyen', 'difficile'].includes(recette.difficulte)) {
    errors.push('La difficulté doit être "facile", "moyen" ou "difficile".');
  }

  // Validation de la catégorie
  if (recette.categorie && !['entrée', 'plat principal', 'dessert', 'accompagnement', 'boisson', 'snack'].includes(recette.categorie)) {
    errors.push('La catégorie doit être "entrée", "plat principal", "dessert", "accompagnement", "boisson" ou "snack".');
  }

  return errors;
};

// Validation pour un menu
export const validateMenu = (menu: Partial<Menu>): string[] => {
  const requiredFields: (keyof Menu)[] = ['date', 'typeRepas', 'recettes', 'familyId', 'createurId'];
  const errors = checkRequiredFields(menu, requiredFields);

  // Validation de la date
  if (menu.date) {
    const date = new Date(menu.date);
    if (isNaN(date.getTime())) {
      errors.push('La date est invalide.');
    }
  }

  // Validation du type de repas
  if (menu.typeRepas && !['petit-déjeuner', 'déjeuner', 'dîner', 'collation'].includes(menu.typeRepas)) {
    errors.push('Le type de repas doit être "petit-déjeuner", "déjeuner", "dîner" ou "collation".');
  }

  // Validation des recettes
  if (menu.recettes && !menu.recettes.length) {
    errors.push('Le menu doit contenir au moins une recette.');
  } else if (menu.recettes) {
    menu.recettes.forEach((item, index) => {
      if (!item.recetteId) {
        errors.push(`La recette à l’index ${index} doit avoir un ID valide.`);
      }
      if (item.portionsServies <= 0) {
        errors.push(`Les portions servies à l’index ${index} doivent être supérieures à 0.`);
      }
    });
  }

  // Validation du statut
  if (menu.statut && !['planifié', 'terminé', 'annulé'].includes(menu.statut)) {
    errors.push('Le statut doit être "planifié", "terminé" ou "annulé".');
  }

  return errors;
};

// Validation pour une liste de courses
export const validateListeCourses = (list: Partial<ListeCourses>): string[] => {
  const requiredFields: (keyof ListeCourses)[] = ['nom', 'items', 'familyId', 'createurId'];
  const errors = checkRequiredFields(list, requiredFields);

  // Validation des items
  if (list.items && !list.items.length) {
    errors.push('La liste de courses doit contenir au moins un item.');
  } else if (list.items) {
    list.items.forEach((item, index) => {
      if (!item.ingredientId) {
        errors.push(`L’item à l’index ${index} doit avoir un ID d’ingrédient valide.`);
      }
      if (item.quantite <= 0) {
        errors.push(`La quantité de l’item à l’index ${index} doit être supérieure à 0.`);
      }
      if (!item.unite) {
        errors.push(`L’unité de l’item à l’index ${index} est requise.`);
      }
    });
  }

  // Validation du statut
  if (list.statut && !['en cours', 'terminée'].includes(list.statut)) {
    errors.push('Le statut doit être "en cours" ou "terminée".');
  }

  return errors;
};

// Validation pour un budget
export const validateBudget = (budget: Partial<Budget>): string[] => {
  const requiredFields: (keyof Budget)[] = ['mois', 'plafond', 'devise', 'familyId', 'createurId'];
  const errors = checkRequiredFields(budget, requiredFields);

  // Validation du mois (format YYYY-MM)
  if (budget.mois && !/^\d{4}-\d{2}$/.test(budget.mois)) {
    errors.push('Le mois doit être au format YYYY-MM.');
  }

  // Validation du plafond
  if (budget.plafond !== undefined && (typeof budget.plafond !== 'number' || budget.plafond <= 0)) {
    errors.push('Le plafond du budget doit être un nombre supérieur à 0.');
  }

  // Validation de la devise
  if (budget.devise && !['EUR', 'USD', 'CFA'].includes(budget.devise)) {
    errors.push('La devise doit être "EUR", "USD" ou "CFA".');
  }

  // Validation des dépenses
  if (budget.depenses) {
    budget.depenses.forEach((depense, index) => {
      if (depense.montant <= 0) {
        errors.push(`La dépense à l’index ${index} doit avoir un montant supérieur à 0.`);
      }
      if (!depense.date) {
        errors.push(`La dépense à l’index ${index} doit avoir une date.`);
      }
      if (!depense.categorie || !['nourriture', 'autre'].includes(depense.categorie)) {
        errors.push(`La dépense à l’index ${index} doit avoir une catégorie "nourriture" ou "autre".`);
      }
    });
  }

  return errors;
};

// Validation pour un article de magasin
export const validateStoreItem = (item: Partial<StoreItem>): string[] => {
  const requiredFields: (keyof StoreItem)[] = ['nom', 'storeId', 'prixUnitaire', 'unite', 'stockDisponible'];
  const errors = checkRequiredFields(item, requiredFields);

  // Validation du prix unitaire
  if (item.prixUnitaire !== undefined && (typeof item.prixUnitaire !== 'number' || item.prixUnitaire <= 0)) {
    errors.push('Le prix unitaire doit être un nombre supérieur à 0.');
  }

  // Validation du stock disponible
  if (item.stockDisponible !== undefined && (typeof item.stockDisponible !== 'number' || item.stockDisponible < 0)) {
    errors.push('Le stock disponible ne peut pas être négatif.');
  }

  // Validation de l’unité
  const validUnits: Unit[] = ['g', 'kg', 'ml', 'l', 'unité', 'cuillère à soupe', 'cuillère à café', 'pincée', 'tranche', 'boîte', 'paquet'];
  if (item.unite && !validUnits.includes(item.unite)) {
    errors.push(`L’unité doit être l’une des suivantes : ${validUnits.join(', ')}.`);
  }

  return errors;
};

// Validation pour un magasin
export const validateStore = (store: Partial<Store>): string[] => {
  const requiredFields: (keyof Store)[] = ['nom', 'categorie'];
  const errors = checkRequiredFields(store, requiredFields);

  // Validation de la catégorie
  if (store.categorie && !['supermarché', 'épicerie', 'boucherie', 'poissonnerie', 'marché local', 'en ligne'].includes(store.categorie)) {
    errors.push('La catégorie doit être "supermarché", "épicerie", "boucherie", "poissonnerie", "marché local" ou "en ligne".');
  }

  // Validation de la localisation
  if (store.localisation) {
    if (typeof store.localisation.latitude !== 'number' || typeof store.localisation.longitude !== 'number') {
      errors.push('Les coordonnées de localisation doivent être des nombres.');
    }
    if (!store.localisation.adresse) {
      errors.push('L’adresse de localisation est requise.');
    }
  }

  return errors;
};

// Validation pour un historique de repas
export const validateHistoriqueRepas = (historique: Partial<HistoriqueRepas>): string[] => {
  const requiredFields: (keyof HistoriqueRepas)[] = ['menuId', 'date', 'typeRepas'];
  const errors = checkRequiredFields(historique, requiredFields);

  // Validation de la date
  if (historique.date) {
    const date = new Date(historique.date);
    if (isNaN(date.getTime())) {
      errors.push('La date est invalide.');
    }
  }

  // Validation du type de repas
  if (historique.typeRepas && !['petit-déjeuner', 'déjeuner', 'dîner', 'collation'].includes(historique.typeRepas)) {
    errors.push('Le type de repas doit être "petit-déjeuner", "déjeuner", "dîner" ou "collation".');
  }

  return errors;
};
