import type { MembreFamille, Ingredient, Recette, Menu, HistoriqueRepas, Store } from './entities';
import { PromptType } from '../services/prompts';
import { ImageSourcePropType } from 'react-native';
import { MealType } from './categories';



export interface AITemplate {
  id: PromptType;
  title: string;
  description: string;
  iconName: string;
  backgroundColor: string;
  animationType: 'fade' | 'slide' | 'pop' | 'none';
}

export interface LearnMoreItem {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}


export const mockMeals: HistoriqueRepas[] = [
  {
    id: 'meal1',
    menuId: 'menu1',
    date: '2025-06-15',
    typeRepas: 'dîner',
    dateCreation: '2025-06-15T20:00:00Z',
    dateMiseAJour: '2025-06-15T20:30:00Z',
    notes: 'La soupe egusi était très appréciée',
    evaluation: {
      note: 5,
      commentaire: 'Délicieux et bien épicé !',
    },
  },
  {
    id: 'meal2',
    menuId: 'menu1',
    date: '2025-06-14',
    typeRepas: 'déjeuner',
    dateCreation: '2025-06-14T13:00:00Z',
    dateMiseAJour: '2025-06-14T13:20:00Z',
    notes: 'Jollof rice bien épicé',
    evaluation: {
      note: 4,
      commentaire: 'Un peu trop épicé pour les enfants',
    },
  },
  {
    id: 'meal3',
    menuId: 'menu1',
    date: '2025-06-13',
    typeRepas: 'petit-déjeuner',
    dateCreation: '2025-06-13T08:00:00Z',
    dateMiseAJour: '2025-06-13T08:10:00Z',
    notes: 'Plantains croustillants',
    evaluation: {
      note: 5,
      commentaire: 'Parfait pour le matin',
    },
  },
  {
    id: 'meal4',
    menuId: 'menu2',
    date: '2025-06-12',
    typeRepas: 'dîner',
    dateCreation: '2025-06-12T19:00:00Z',
    dateMiseAJour: '2025-06-12T19:30:00Z',
    notes: 'Yassa savoureux mais long à préparer',
    evaluation: {
      note: 4,
      commentaire: 'Très bon mais un peu long',
    },
  },
];

export const mockFamilyMembers: MembreFamille[] = [
  {
    id: 'fam1',
    userId: 'user1',
    nom: 'Adebayo',
    prenom: 'Amina',
    dateNaissance: '1985-03-12',
    genre: 'femme',
    role: 'parent',
    preferencesAlimentaires: ['Végétarien'],
    allergies: ['Poisson'],
    restrictionsMedicales: [],
    photoProfil: require('../assets/images/ai.jpg'),
    repasFavoris: ['rec1'],
    historiqueRepas: [mockMeals[1]],
    contactUrgence: {
      nom: 'Tunde Adebayo',
      telephone: '+234 123 456 789',
    },
    aiPreferences: {
      niveauEpices: 3,
      apportCaloriqueCible: 1800,
      cuisinesPreferees: ['Nigériane', 'Ghanéenne'],
    },
    historiqueSante: [],
    niveauAcces: 'admin',
    familyId: 'famGroup1',
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
  },
  {
    id: 'fam2',
    userId: 'user1',
    nom: 'Osei',
    prenom: 'Kwame',
    dateNaissance: '2010-07-25',
    genre: 'homme',
    role: 'enfant',
    preferencesAlimentaires: ['Sans gluten'],
    allergies: ['Arachides'],
    restrictionsMedicales: [],
    photoProfil: require('../assets/images/ai.jpg'),
    repasFavoris: ['rec2'],
    historiqueRepas: [mockMeals[2]],
    contactUrgence: {
      nom: 'Amina Adebayo',
      telephone: '+234 123 456 789',
    },
    aiPreferences: {
      niveauEpices: 2,
      apportCaloriqueCible: 1600,
      cuisinesPreferees: ['Ghanéenne'],
    },
    historiqueSante: [],
    niveauAcces: 'membre',
    familyId: 'famGroup1',
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
  },
  {
    id: 'fam3',
    userId: 'user1',
    nom: 'Diallo',
    prenom: 'Fatou',
    dateNaissance: '1990-11-05',
    genre: 'femme',
    role: 'parent',
    preferencesAlimentaires: [],
    allergies: [],
    restrictionsMedicales: ['Diabète'],
    photoProfil: require('../assets/images/ai.jpg'),
    repasFavoris: ['rec3'],
    historiqueRepas: [mockMeals[3]],
    contactUrgence: {
      nom: 'Mamadou Diallo',
      telephone: '+221 987 654 321',
    },
    aiPreferences: {
      niveauEpices: 4,
      apportCaloriqueCible: 2000,
      cuisinesPreferees: ['Sénégalaise', 'Camerounaise'],
    },
    historiqueSante: [
      {
        condition: 'Diabète type 2',
        dateDiagnostic: '2020-05-10',
        notesMedecin: 'Contrôle régulier de la glycémie',
      },
    ],
    niveauAcces: 'admin',
    familyId: 'famGroup1',
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
  },
  {
    id: 'fam4',
    userId: 'user1',
    nom: 'Diallo',
    prenom: 'Ibrahima',
    dateNaissance: '2015-04-18',
    genre: 'homme',
    role: 'enfant',
    preferencesAlimentaires: ['Végétarien'],
    allergies: [],
    restrictionsMedicales: [],
    photoProfil: require('../assets/images/ai.jpg'),
    repasFavoris: ['rec4'],
    historiqueRepas: [mockMeals[0]],
    contactUrgence: {
      nom: 'Fatou Diallo',
      telephone: '+221 987 654 321',
    },
    aiPreferences: {
      niveauEpices: 1,
      apportCaloriqueCible: 1400,
      cuisinesPreferees: ['Sénégalaise'],
    },
    historiqueSante: [],
    niveauAcces: 'membre',
    familyId: 'famGroup1',
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
  },
];

export const mockIngredients: Ingredient[] = [
  {
    id: 'ing1',
    nom: 'Feuilles d’Egusi',
    quantite: 200,
    unite: 'g',
    categorie: 'légume',
    perissable: true,
    stockActuel: 150,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    datePeremption: '2025-07-01',
    dateAchat: '2025-06-01',
    valeurNutritionnelle: {
      calories: 300,
      proteines: 15,
      glucides: 20,
      lipides: 18,
      fibres: 5,
    },
    fournisseur: [
      {
        storeId: 'store1',
        prixUnitaire: 3.0,
        dernierAchat: '2025-06-01',
      },
    ],
  },
  {
    id: 'ing2',
    nom: 'Riz Jollof',
    quantite: 1000,
    unite: 'g',
    categorie: 'céréale',
    perissable: false,
    stockActuel: 800,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    valeurNutritionnelle: {
      calories: 130,
      proteines: 2.5,
      glucides: 28,
      lipides: 0.5,
    },
    fournisseur: [
      {
        storeId: 'store1',
        prixUnitaire: 2.5,
        dernierAchat: '2025-06-01',
      },
    ],
  },
  {
    id: 'ing3',
    nom: 'Poulet',
    quantite: 1,
    unite: 'kg',
    categorie: 'viande',
    perissable: true,
    stockActuel: 0.5,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    datePeremption: '2025-06-20',
    dateAchat: '2025-06-15',
    valeurNutritionnelle: {
      calories: 165,
      proteines: 31,
      glucides: 0,
      lipides: 3.6,
    },
    fournisseur: [
      {
        storeId: 'store1',
        prixUnitaire: 8.0,
        dernierAchat: '2025-06-15',
      },
    ],
  },
  {
    id: 'ing4',
    nom: 'Huile de Palme',
    quantite: 500,
    unite: 'ml',
    categorie: 'autre',
    perissable: false,
    stockActuel: 400,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    valeurNutritionnelle: {
      calories: 900,
      proteines: 0,
      glucides: 0,
      lipides: 100,
    },
    fournisseur: [
      {
        storeId: 'store1',
        prixUnitaire: 4.0,
        dernierAchat: '2025-06-01',
      },
    ],
  },
  {
    id: 'ing5',
    nom: 'Plantain',
    quantite: 5,
    unite: 'tranche',
    categorie: 'fruit',
    perissable: true,
    stockActuel: 3,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    datePeremption: '2025-06-25',
    dateAchat: '2025-06-15',
    valeurNutritionnelle: {
      calories: 122,
      proteines: 1.3,
      glucides: 31,
      lipides: 0.4,
      fibres: 2.3,
    },
    fournisseur: [
      {
        storeId: 'store3',
        prixUnitaire: 2.0,
        dernierAchat: '2025-06-15',
      },
    ],
  },
];

export const mockRecipes: Recette[] = [
  {
    id: 'rec1',
    nom: 'Soupe Egusi',
    ingredients: [mockIngredients[0], mockIngredients[1], mockIngredients[3]],
    instructions: ['Moudre les feuilles d’egusi', 'Cuire avec du poulet et de l’huile de palme'],
    tempsPreparation: 45,
    portions: 4,
    categorie: 'plat principal',
    difficulte: 'moyen',
    etapesPreparation: [
      { texte: 'Moudre les feuilles d’egusi en poudre', ordre: 1 },
      { texte: 'Cuire le poulet avec l’huile de palme et ajouter l’egusi', ordre: 2 },
    ],
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    imageUrl:require('../assets/images/okok.jpg'),
    coutEstime: 15,
    aiAnalysis: {
      caloriesTotales: 800,
      niveauEpices: 3,
      adequationMembres: {
        'fam1': 'non adapté',
        'fam2': 'adapté',
        'fam3': 'adapté',
        'fam4': 'adapté',
      },
    },
  },
  {
    id: 'rec2',
    nom: 'Jollof Rice',
    ingredients: [mockIngredients[1], mockIngredients[3]],
    instructions: ['Cuire le riz avec de l’huile de palme et des épices'],
    tempsPreparation: 30,
    portions: 4,
    categorie: 'plat principal',
    difficulte: 'facile',
    etapesPreparation: [
      { texte: 'Faire revenir l’huile de palme avec des oignons', ordre: 1 },
      { texte: 'Ajouter le riz et cuire avec des épices', ordre: 2 },
    ],
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    imageUrl: require('../assets/images/koki.jpg'),
    coutEstime: 10,
    aiAnalysis: {
      caloriesTotales: 600,
      niveauEpices: 2,
      adequationMembres: {
        'fam1': 'adapté',
        'fam2': 'adapté',
        'fam3': 'adapté',
        'fam4': 'adapté',
      },
    },
  },
  {
    id: 'rec3',
    nom: 'Plantain Frit',
    ingredients: [mockIngredients[4], mockIngredients[3]],
    instructions: ['Couper les plantains', 'Frire dans l’huile de palme'],
    tempsPreparation: 20,
    portions: 4,
    categorie: 'accompagnement',
    difficulte: 'facile',
    etapesPreparation: [
      { texte: 'Couper les plantains en tranches', ordre: 1 },
      { texte: 'Frire dans l’huile de palme chaude', ordre: 2 },
    ],
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    imageUrl: require('../assets/images/hamburgeur.jpg'),
    coutEstime: 8,
    aiAnalysis: {
      caloriesTotales: 400,
      niveauEpices: 1,
      adequationMembres: {
        'fam1': 'adapté',
        'fam2': 'adapté',
        'fam3': 'adapté',
        'fam4': 'adapté',
      },
    },
  },
  {
    id: 'rec4',
    nom: 'Poulet Yassa',
    ingredients: [mockIngredients[2], mockIngredients[3]],
    instructions: ['Mariner le poulet', 'Cuire avec des oignons et de l’huile de palme'],
    tempsPreparation: 60,
    portions: 4,
    categorie: 'plat principal',
    difficulte: 'moyen',
    etapesPreparation: [
      { texte: 'Mariner le poulet avec des oignons et du citron', ordre: 1 },
      { texte: 'Cuire avec de l’huile de palme', ordre: 2 },
    ],
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    imageUrl: require('../assets/images/puree.jpg'),
    coutEstime: 20,
    aiAnalysis: {
      caloriesTotales: 900,
      niveauEpices: 4,
      adequationMembres: {
        'fam1': 'non adapté', // Allergie au poisson
        'fam2': 'adapté',
        'fam3': 'adapté',
        'fam4': 'modifié', // Niveau d’épices réduit
      },
    },
  },
];

export const mockMenus: Menu[] = [
  {
    id: 'menu1',
    date: '2025-06-16',
    typeRepas: 'dîner',
    image: require('../assets/images/eru.jpg'),
    recettes: [mockRecipes[0], mockRecipes[1], mockRecipes[2]],
    statut: 'planifié',
    coutTotalEstime: 33,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    aiSuggestions: {
      recettesAlternatives: ['rec4'],
      ingredientsManquants: [mockIngredients[3], mockIngredients[4]],
    },
  },
  {
    id: 'menu2',
    date: '2025-12-24',
    typeRepas: 'dîner',
    image: require('../assets/images/pizza.jpg'),
    recettes: [mockRecipes[3], mockRecipes[1]],
    statut: 'planifié',
    coutTotalEstime: 30,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    aiSuggestions: {
      recettesAlternatives: ['rec1'],
      ingredientsManquants: [],
    },
  },
  {
    id: 'menu3',
    date: '2025-12-24',
    typeRepas: 'dîner',
    image: require('../assets/images/pile-haricot.jpg'),
    recettes: [mockRecipes[3], mockRecipes[1]],
    statut: 'planifié',
    coutTotalEstime: 30,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    aiSuggestions: {
      recettesAlternatives: ['rec1'],
      ingredientsManquants: [],
    },
  },
  {
    id: 'menu4',
    date: '2025-12-24',
    typeRepas: 'dîner',
    image: require('../assets/images/noodle.jpg'),
    recettes: [mockRecipes[3], mockRecipes[1]],
    statut: 'planifié',
    coutTotalEstime: 30,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    aiSuggestions: {
      recettesAlternatives: ['rec1'],
      ingredientsManquants: [],
    },
  },
  {
    id: 'menu5',
    date: '2025-12-24',
    typeRepas: 'dîner',
    image: require('../assets/images/mbongo.jpg'),
    recettes: [mockRecipes[3], mockRecipes[1]],
    statut: 'planifié',
    coutTotalEstime: 30,
    createurId: 'user1',
    dateCreation: '2025-01-01T00:00:00Z',
    aiSuggestions: {
      recettesAlternatives: ['rec1'],
      ingredientsManquants: [],
    },
  },
];

export const mockLearnMoreItems: LearnMoreItem[] = [
  {
    id: 'learn1',
    title: 'Cuisine Nigériane',
    description: 'Découvrez des recettes comme l’egusi et le jollof rice.',
    image: require('../assets/images/Le-met-de-pistache1.jpg'),
  },
  {
    id: 'learn2',
    title: 'Plats Ghanéens',
    description: 'Explorez le banku et le shito pour vos repas.',
    image: require('../assets/images/mbongo.jpg'),
  },
  {
    id: 'learn3',
    title: 'Festins Sénégalais',
    description: 'Planifiez un thiéboudienne pour vos occasions spéciales.',
    image: require('../assets/images/okok.jpg'),
  },
];

export const mockStores: Store[] = [
  {
    id: 'store1',
    nom: 'SuperMart Dovv',
    categorie: 'supermarché',
    localisation: {
      latitude: 48.8566,
      longitude: 2.3522,
      adresse: '123 Rue de Paris',
      ville: 'Paris',
      codePostal: '75001',
      pays: 'France',
    },
    horaires: [
      { jour: 'Lundi', ouverture: '08:00', fermeture: '20:00' },
      { jour: 'Mardi', ouverture: '08:00', fermeture: '20:00' },
      { jour: 'Mercredi', ouverture: '08:00', fermeture: '20:00' },
      { jour: 'Jeudi', ouverture: '08:00', fermeture: '20:00' },
      { jour: 'Vendredi', ouverture: '08:00', fermeture: '20:00' },
      { jour: 'Samedi', ouverture: '09:00', fermeture: '19:00' },
      { jour: 'Dimanche', ouverture: '10:00', fermeture: '18:00' },
    ],
    contact: {
      telephone: '+33 1 23 45 67 89',
      email: 'contact@supermartparis.fr',
      siteWeb: 'https://supermartparis.fr',
    },
    articles: [
      {
        id: 'item1',
        storeId: 'store1',
        nom: 'Feuilles d’Egusi',
        categorie: 'légume',
        prixUnitaire: 3.0,
        unite: 'g',
        stockDisponible: 100,
        imageUrl: require('../assets/images/okok.jpg'),
        description: 'Feuilles d’egusi séchées pour soupes africaines.',
        marque: 'AfroMart',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item2',
        storeId: 'store1',
        nom: 'Poulet Fermier',
        categorie: 'viande',
        prixUnitaire: 8.0,
        unite: 'kg',
        stockDisponible: 50,
        imageUrl: require('../assets/images/puree.jpg'),
        description: 'Poulet fermier bio, idéal pour yassa ou egusi.',
        marque: 'FermeLocale',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item3',
        storeId: 'store1',
        nom: 'Riz Jollof',
        categorie: 'céréale',
        prixUnitaire: 2.5,
        unite: 'kg',
        stockDisponible: 200,
        imageUrl: require('../assets/images/R.jpg'),
        description: 'Riz long grain pour jollof rice.',
        marque: 'AfroGrain',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item4',
        storeId: 'store1',
        nom: 'Huile de Palme',
        categorie: 'autre',
        prixUnitaire: 4.0,
        unite: 'l',
        stockDisponible: 150,
        imageUrl: require('../assets/images/mbongo.jpg'),
        description: 'Huile de palme pure pour cuisine africaine.',
        marque: 'PalmPure',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [
      {
        articleId: 'item1',
        reduction: 10,
        dateDebut: '2025-06-01',
        dateFin: '2025-06-15',
        description: '10% de réduction sur les feuilles d’egusi',
      },
      {
        articleId: 'item3',
        reduction: 15,
        dateDebut: '2025-06-05',
        dateFin: '2025-06-20',
        description: '15% de réduction sur le riz jollof',
      },
    ],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },
  // store2 (fixed imageUrl with require)
  {
    id: 'store2',
    nom: 'Poissonnerie de la Mer',
    categorie: 'poissonnerie',
    localisation: {
      latitude: 48.8606,
      longitude: 2.3422,
      adresse: '45 Quai de Seine',
      ville: 'Paris',
      codePostal: '75004',
      pays: 'France',
    },
    horaires: [
      { jour: 'Lundi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Mardi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Mercredi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Jeudi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Vendredi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Samedi', ouverture: '09:00', fermeture: '17:00' },
      { jour: 'Dimanche', ouverture: 'fermé', fermeture: 'fermé' },
    ],
    contact: {
      telephone: '+33 1 98 76 54 32',
      email: 'info@poissonneriedelamer.fr',
    },
    articles: [
      {
        id: 'item5',
        storeId: 'store2',
        nom: 'Tilapia Frais',
        categorie: 'poisson',
        prixUnitaire: 10.0,
        unite: 'kg',
        stockDisponible: 30,
        imageUrl: require('../assets/images/hamburgeur.jpg'), // Fixed
        description: 'Tilapia frais pour soupes ou grillades africaines.',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item6',
        storeId: 'store2',
        nom: 'Poisson Fumé',
        categorie: 'poisson',
        prixUnitaire: 12.0,
        unite: 'kg',
        stockDisponible: 40,
        imageUrl: require('../assets/images/pizza.jpg'), // Fixed
        description: 'Poisson fumé pour sauces africaines.',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },
  // store3 (fixed imageUrl with require)
  {
    id: 'store3',
    nom: 'Épicerie Afro Local',
    categorie: 'épicerie',
    localisation: {
      latitude: 48.8656,
      longitude: 2.3622,
      adresse: '78 Rue Afro',
      ville: 'Paris',
      codePostal: '75003',
      pays: 'France',
    },
    horaires: [
      { jour: 'Lundi', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Mardi', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Mercredi', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Jeudi', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Vendredi', ouverture: '10:00', fermeture: '19:00' },
      { jour: 'Samedi', ouverture: '10:00', fermeture: '18:00' },
      { jour: 'Dimanche', ouverture: 'fermé', fermeture: 'fermé' },
    ],
    contact: {
      telephone: '+33 1 56 78 90 12',
      siteWeb: 'https://epicerieafrolocal.fr',
    },
    articles: [
      {
        id: 'item7',
        storeId: 'store3',
        nom: 'Plantain',
        categorie: 'fruit',
        prixUnitaire: 2.0,
        unite: 'kg',
        stockDisponible: 80,
        imageUrl: require('../assets/images/menu.jpg'), // Fixed
        description: 'Plantains mûrs pour friture ou bouillie.',
        marque: 'AfroVerger',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item8',
        storeId: 'store3',
        nom: 'Piment Scotch Bonnet',
        categorie: 'épice',
        prixUnitaire: 5.0,
        unite: 'g',
        stockDisponible: 100,
        imageUrl: require('../assets/images/wrap.jpg'), // Fixed
        description: 'Piment scotch bonnet pour sauces épicées.',
        marque: 'SpiceAfro',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item9',
        storeId: 'store3',
        nom: 'Farine de Manioc',
        categorie: 'céréale',
        prixUnitaire: 3.0,
        unite: 'kg',
        stockDisponible: 120,
        imageUrl: require('../assets/images/shopping.jpg'), // Fixed
        description: 'Farine de manioc pour fufu.',
        marque: 'AfroMoulin',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [
      {
        articleId: 'item7',
        reduction: 20,
        dateDebut: '2025-06-01',
        dateFin: '2025-06-10',
        description: '20% de réduction sur les plantains',
      },
    ],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },
  // store4 (fixed imageUrl with require)
  {
    id: 'store4',
    nom: 'Marché Local de Dakar',
    categorie: 'marché local',
    localisation: {
      latitude: 14.6928,
      longitude: -17.4467,
      adresse: 'Place du Marché',
      ville: 'Dakar',
      codePostal: '12345',
      pays: 'Sénégal',
    },
    horaires: [
      { jour: 'Lundi', ouverture: 'fermé', fermeture: 'fermé' },
      { jour: 'Mardi', ouverture: '07:00', fermeture: '13:00' },
      { jour: 'Mercredi', ouverture: '07:00', fermeture: '13:00' },
      { jour: 'Jeudi', ouverture: '07:00', fermeture: '13:00' },
      { jour: 'Vendredi', ouverture: '07:00', fermeture: '13:00' },
      { jour: 'Samedi', ouverture: '07:00', fermeture: '14:00' },
      { jour: 'Dimanche', ouverture: '07:00', fermeture: '14:00' },
    ],
    contact: {
      telephone: '+221 33 123 4567',
    },
    articles: [
      {
        id: 'item10',
        storeId: 'store4',
        nom: 'Oignons',
        categorie: 'légume',
        prixUnitaire: 1.5,
        unite: 'kg',
        stockDisponible: 60,
        imageUrl: require('../assets/images/puree.jpg'), // Fixed
        description: 'Oignons frais pour yassa ou thiéboudienne.',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item11',
        storeId: 'store4',
        nom: 'Poisson Séché',
        categorie: 'poisson',
        prixUnitaire: 6.0,
        unite: 'kg',
        stockDisponible: 25,
        imageUrl: require('../assets/images/taro-sauce-jaune.jpg'), // Fixed
        description: 'Poisson séché pour sauces traditionnelles.',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },
  // store5 (unchanged, already correct)
  {
    id: 'store5',
    nom: 'Boucherie Afro',
    categorie: 'boucherie',
    localisation: {
      latitude: 48.8706,
      longitude: 2.3322,
      adresse: '15 Rue Afro',
      ville: 'Paris',
      codePostal: '75005',
      pays: 'France',
    },
    horaires: [
      { jour: 'Lundi', ouverture: '08:00', fermeture: '19:00' },
      { jour: 'Mardi', ouverture: '08:00', fermeture: '19:00' },
      { jour: 'Mercredi', ouverture: '08:00', fermeture: '19:00' },
      { jour: 'Jeudi', ouverture: '08:00', fermeture: '19:00' },
      { jour: 'Vendredi', ouverture: '08:00', fermeture: '19:00' },
      { jour: 'Samedi', ouverture: '08:00', fermeture: '18:00' },
      { jour: 'Dimanche', ouverture: 'fermé', fermeture: 'fermé' },
    ],
    contact: {
      telephone: '+33 1 45 67 89 01',
      email: 'boucherie@afro.fr',
    },
    articles: [
      {
        id: 'item12',
        storeId: 'store5',
        nom: 'Chèvre',
        categorie: 'viande',
        prixUnitaire: 12.0,
        unite: 'kg',
        stockDisponible: 40,
        imageUrl: require('../assets/images/noodle.jpg'),
        description: 'Viande de chèvre pour plats africains.',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item13',
        storeId: 'store5',
        nom: 'Boeuf',
        categorie: 'viande',
        prixUnitaire: 10.0,
        unite: 'kg',
        stockDisponible: 35,
        imageUrl: require('../assets/images/eru.jpg'),
        description: 'Boeuf frais pour soupes ou ragoûts.',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [
      {
        articleId: 'item12',
        reduction: 5,
        dateDebut: '2025-06-01',
        dateFin: '2025-06-07',
        description: '5% de réduction sur la chèvre',
      },
    ],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },

  {
    id: 'store6',
    nom: 'AfroShopOnline',
    categorie: 'en ligne',
    localisation: {
      latitude: 0,
      longitude: 0,
      adresse: 'Plateforme en ligne',
      ville: '',
      codePostal: '',
      pays: '',
    },
    contact: {
      telephone: '+33 1 11 22 33 44',
      email: 'support@afroshoponline.fr',
      siteWeb: 'https://afroshoponline.fr',
    },
    articles: [
      {
        id: 'item14',
        storeId: 'store6',
        nom: 'Fufu en Poudre',
        categorie: 'céréale',
        prixUnitaire: 4.0,
        unite: 'kg',
        stockDisponible: 500,
        imageUrl: require('../assets/images/pile-haricot.jpg'), // Fixed
        description: 'Poudre de fufu pour accompagnement.',
        marque: 'AfroMoulin',
        dateMiseAJour: '2025-06-01',
      },
      {
        id: 'item15',
        storeId: 'store6',
        nom: 'Épices Soupe',
        categorie: 'épice',
        prixUnitaire: 3.5,
        unite: 'g',
        stockDisponible: 300,
        imageUrl: require('../assets/images/mbongo.jpg'),
        description: 'Mélange d’épices pour soupes africaines.',
        marque: 'SpiceAfro',
        dateMiseAJour: '2025-06-01',
      },
    ],
    promotions: [],
    dateCreation: '2025-06-01T00:00:00Z',
    dateMiseAJour: '2025-06-05T00:00:00Z',
  },
];


export type IconFamily = 'MaterialCommunityIcons' | 'FontAwesome' | 'AntDesign' | 'Ionicons';

export interface IconSpec {
  name: string;
  family: IconFamily;
}

export interface Occasion {
  id: string;
  name: string;
  category: string;
  icon?: IconSpec;
}

export interface Preference {
  id: string;
  name: string;
  category: string;
  icon?: IconSpec;
}

export interface Diet {
  id: string;
  name: string;
  category: string;
  icon?: IconSpec;
}

export interface Meal {
  id: string;
  name: MealType;
  icon?: IconSpec;
}

export const mockMealTypes: Meal[] = [
  { id: '1', name: 'petit-déjeuner', icon: { name: 'md-sunny-outline', family: 'Ionicons' } },
  { id: '2', name: 'déjeuner', icon: { name: 'lunch-dining', family: 'MaterialCommunityIcons' } },
  { id: '3', name: 'dîner', icon: { name: 'food-steak', family: 'MaterialCommunityIcons' } },
  { id: '4', name: 'collation', icon: { name: 'apple-whole', family: 'MaterialCommunityIcons' } },
];

export const mockDiets: Diet[] = [
  { id: '1', name: 'Sans arachides', category: 'Allergie', icon: { name: 'peanut-off', family: 'MaterialCommunityIcons' } },
  { id: '2', name: 'Diabétique', category: 'Médical', icon: { name: 'insulin', family: 'MaterialCommunityIcons' } },
  { id: '3', name: 'Sans lactose', category: 'Allergie', icon: { name: 'milk-off', family: 'MaterialCommunityIcons' } },
  { id: '4', name: 'Cétogène', category: 'Diététique', icon: { name: 'food-drumstick-off', family: 'MaterialCommunityIcons' } },
  { id: '5', name: 'Végétalien', category: 'Diététique', icon: { name: 'leaf', family: 'FontAwesome' } },
  { id: '6', name: 'Faible en sel', category: 'Santé', icon: { name: 'salt-shaker-off', family: 'MaterialCommunityIcons' } },
  { id: '7', name: 'Sans gluten', category: 'Allergie', icon: { name: 'grain', family: 'MaterialCommunityIcons' } },
  { id: '8', name: 'Végétarien', category: 'Diététique', icon: { name: 'carrot', family: 'MaterialCommunityIcons' } },
  { id: '9', name: 'Paléo', category: 'Diététique', icon: { name: 'bone', family: 'FontAwesome' } },
  { id: '10', name: 'Faible en FODMAP', category: 'Médical', icon: { name: 'stomach', family: 'MaterialCommunityIcons' } },
  { id: '11', name: 'Sans noix', category: 'Allergie', icon: { name: 'nut', family: 'MaterialCommunityIcons' } },
  { id: '12', name: 'Sans œufs', category: 'Allergie', icon: { name: 'egg-off', family: 'MaterialCommunityIcons' } },
  { id: '13', name: 'Casher', category: 'Religieux', icon: { name: 'star-of-david', family: 'FontAwesome' } },
  { id: '14', name: 'Faible en glucides', category: 'Diététique', icon: { name: 'barbell', family: 'Ionicons' } },
  { id: '15', name: 'Sans soja', category: 'Allergie', icon: { name: 'seed', family: 'MaterialCommunityIcons' } },
  { id: '16', name: 'Régime méditerranéen', category: 'Diététique', icon: { name: 'medkit', family: 'Ionicons' } },
];

export const mockPreferences: Preference[] = [
  { id: '1', name: 'Halal', category: 'Religieux', icon: { name: 'mosque', family: 'MaterialCommunityIcons' } },
  { id: '2', name: 'Végétarien', category: 'Diététique', icon: { name: 'leaf', family: 'FontAwesome' } },
  { id: '3', name: 'Sans gluten', category: 'Diététique', icon: { name: 'bread-slice-outline', family: 'MaterialCommunityIcons' } },
  { id: '4', name: 'Cuisine africaine', category: 'Culinaire', icon: { name: 'earth', family: 'MaterialCommunityIcons' } },
  { id: '5', name: 'Épicé', category: 'Saveur', icon: { name: 'chili-hot', family: 'MaterialCommunityIcons' } },
  { id: '6', name: 'Faible en gras', category: 'Diététique', icon: { name: 'weight-low', family: 'MaterialCommunityIcons' } },
  { id: '7', name: 'Faible en sucre', category: 'Diététique', icon: { name: 'sugar-cube-outline', family: 'MaterialCommunityIcons' } },
  { id: '8', name: 'Fruits de mer', category: 'Aliment', icon: { name: 'fish', family: 'MaterialCommunityIcons' } },
  { id: '9', name: 'Végétalien', category: 'Diététique', icon: { name: 'flower', family: 'MaterialCommunityIcons' } },
  { id: '10', name: 'Pescétarien', category: 'Diététique', icon: { name: 'fish-outline', family: 'MaterialCommunityIcons' } },
  { id: '11', name: 'Sans lactose', category: 'Diététique', icon: { name: 'milk-off-outline', family: 'MaterialCommunityIcons' } },
  { id: '12', name: 'Bio', category: 'Qualité', icon: { name: 'organic', family: 'MaterialCommunityIcons' } },
  { id: '13', name: 'Fait maison', category: 'Qualité', icon: { name: 'home-heart', family: 'MaterialCommunityIcons' } },
  { id: '14', name: 'Rapide à préparer', category: 'Préparation', icon: { name: 'run-fast', family: 'MaterialCommunityIcons' } },
];

export const mockOccasions: Occasion[] = [
  { id: '1', name: 'Fête de Tabaski', category: 'Religieux', icon: { name: 'mosque', family: 'MaterialCommunityIcons' } },
  { id: '2', name: 'Fête de Ramadan', category: 'Religieux', icon: { name: 'moon-waning-crescent', family: 'MaterialCommunityIcons' } },
  { id: '3', name: 'Noël', category: 'Religieux', icon: { name: 'church', family: 'MaterialCommunityIcons' } },
  { id: '4', name: 'Pâques', category: 'Religieux', icon: { name: 'cross', family: 'MaterialCommunityIcons' } },
  { id: '5', name: 'Assomption', category: 'Religieux', icon: { name: 'church', family: 'MaterialCommunityIcons' } },
  { id: '6', name: 'Ascension', category: 'Religieux', icon: { name: 'church', family: 'MaterialCommunityIcons' } },
  { id: '7', name: 'Pentecôte', category: 'Religieux', icon: { name: 'church', family: 'MaterialCommunityIcons' } },
  { id: '8', name: 'Toussaint', category: 'Religieux', icon: { name: 'church', family: 'MaterialCommunityIcons' } },
  { id: '9', name: 'Fête de la Jeunesse', category: 'Nationale', icon: { name: 'flag', family: 'MaterialCommunityIcons' } },
  { id: '10', name: 'Fête du Travail', category: 'Nationale', icon: { name: 'briefcase', family: 'MaterialCommunityIcons' } },
  { id: '11', name: 'Fête Nationale', category: 'Nationale', icon: { name: 'flag-variant', family: 'MaterialCommunityIcons' } },
  { id: '12', name: 'Fête de l’Unité', category: 'Nationale', icon: { name: 'account-group', family: 'MaterialCommunityIcons' } },
  { id: '13', name: 'Anniversaire', category: 'Familiale', icon: { name: 'cake-variant', family: 'MaterialCommunityIcons' } },
  { id: '14', name: 'Mariage', category: 'Familiale', icon: { name: 'ring', family: 'MaterialCommunityIcons' } },
  { id: '15', name: 'Baptême', category: 'Familiale', icon: { name: 'baby-face-outline', family: 'MaterialCommunityIcons' } },
  { id: '16', name: 'Fiançailles', category: 'Familiale', icon: { name: 'heart', family: 'MaterialCommunityIcons' } },
  { id: '17', name: 'Réunion de famille', category: 'Familiale', icon: { name: 'account-multiple', family: 'MaterialCommunityIcons' } },
  { id: '18', name: 'Séminaire', category: 'Professionnelle', icon: { name: 'presentation', family: 'MaterialCommunityIcons' } },
  { id: '19', name: 'Réunion', category: 'Professionnelle', icon: { name: 'account-group', family: 'MaterialCommunityIcons' } },
  { id: '20', name: 'Pot de départ', category: 'Professionnelle', icon: { name: 'glass-cocktail', family: 'MaterialCommunityIcons' } },
  { id: '21', name: 'Déjeuner d’affaires', category: 'Professionnelle', icon: { name: 'briefcase', family: 'MaterialCommunityIcons' } },
  { id: '22', name: 'Soirée entre amis', category: 'Autre', icon: { name: 'account-group', family: 'MaterialCommunityIcons' } },
  { id: '23', name: 'Pique-nique', category: 'Autre', icon: { name: 'basket', family: 'MaterialCommunityIcons' } },
  { id: '24', name: 'Barbecue', category: 'Autre', icon: { name: 'grill', family: 'MaterialCommunityIcons' } },
  { id: '25', name: 'Baby shower', category: 'Autre', icon: { name: 'baby-bottle', family: 'MaterialCommunityIcons' } },
  { id: '26', name: 'Autre', category: 'Autre', icon: { name: 'dots-horizontal', family: 'MaterialCommunityIcons' } },
];

