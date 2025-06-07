// types/entities.ts

// Importation des types énumérés et des catégories depuis d'autres fichiers
import type { IngredientCategory, RecipeCategory, MealType, UserRole, StoreCategory } from './categories';
import type { Unit } from './units';
import type { Currency } from './config';
import { ImageSourcePropType } from 'react-native';


/**
 * @interface BaseEntity
 * @description Définit les champs communs à toutes les entités du système.
 * Chaque entité dans la base de données partagera ces propriétés fondamentales.
 */
interface BaseEntity {
  id: string; // Identifiant unique de l'entité (ex: UUID ou ID de document Firestore).
  familyId: string; // L'ID de la famille à laquelle cette entité appartient, permettant le support multi-familles.
  createurId: string; // L'ID de l'utilisateur qui a créé cette entité.
  dateCreation: string; // Date et heure de création de l'entité (format ISO 8601: AAAA-MM-DDTHH:mm:ssZ).
  dateMiseAJour?: string; // Optionnel: Date et heure de la dernière mise à jour de l'entité (format ISO 8601).
}


/**
 * @interface Localisation
 * @description Représente les informations géographiques et d'adresse pour un lieu physique.
 * Principalement utilisé pour les magasins.
 */
export interface Localisation {
  latitude: number; // Coordonnée géographique de latitude.
  longitude: number; // Coordonnée géographique de longitude.
  adresse: string; // Adresse civique (ex: '123 Rue de Paris').
  ville?: string; // Optionnel: La ville (ex: 'Paris').
  codePostal?: string; // Optionnel: Le code postal (ex: '75001').
  pays?: string; // Optionnel: Le pays (ex: 'France').
}

/**
 * @interface Horaire
 * @description Définit les heures d'ouverture et de fermeture pour un jour spécifique.
 * Utilisé pour les horaires d'ouverture des magasins.
 */
export interface Horaire {
  jour: string;
  ouverture: string;
  fermeture: string;
}

/**
 * @interface Contact
 * @description Contient diverses coordonnées pour une entité, généralement un magasin.
 */
export interface Contact {
  telephone: string;
  email?: string;
  siteWeb?: string;
}


/**
 * @interface Promotion
 * @description Décrit une offre spéciale ou une réduction sur un article, associée à un magasin.
 */
export interface Promotion {
  articleId: string; // L'ID de l'article (StoreItem) en promotion.
  reduction: number; // Le pourcentage de réduction (ex: 10 pour 10% de réduction).
  dateDebut: string; // Date de début de la promotion (format AAAA-MM-DD).
  dateFin: string; // Date de fin de la promotion (format AAAA-MM-DD).
  description?: string; // Optionnel: Une description plus détaillée de la promotion (ex: "Achetez-en 2, le 3ème offert").
}

/**
 * @interface StoreItem
 * @description Représente un produit spécifique vendu dans un magasin.
 */
export interface StoreItem {
  id: string; // ID unique de cet article de magasin (peut être le même que Ingredient.id si directement lié).
  storeId: string; // Référence à l'ID du magasin.
  nom: string; // Nom du produit (ex: "Tomates").
  categorie: IngredientCategory | undefined; // Catégorie de l'article, s'aligne avec IngredientCategory.
  prixUnitaire: number;
  unite: Unit; // ex: 'kg', 'unité', 'paquet'.
  stockDisponible: number; // Quantité actuellement en stock dans le magasin.
  imageUrl?: string; // URL de l'image du produit.
  description?: string;
  marque?: string;
  dateMiseAJour: string; // AAAA-MM-DD: Dernière mise à jour des données de cet article pour ce magasin.
}


/**
 * @interface Store
 * @description Représente un magasin physique ou en ligne où des produits peuvent être achetés.
 * Inclut des informations détaillées sur l'emplacement, les horaires, les contacts et les articles.
 */
export interface Store {
  id: string;
  nom: string;
  categorie: StoreCategory; // ex: 'supermarché', 'poissonnerie', 'en ligne'.
  localisation?: Localisation; // Optionnel: Détails de localisation physique.
  horaires?: Horaire[]; // Optionnel: Tableau des horaires d'ouverture pour chaque jour.
  contact?: Contact; // Optionnel: Informations de contact du magasin.
  articles: StoreItem[]; // Tableau des produits disponibles dans ce magasin.
  promotions?: Promotion[]; // Optionnel: Tableau des promotions actuelles.
  dateCreation: string; // Date de création de l'entrée du magasin (format ISO 8601).
  dateMiseAJour?: string; // Optionnel: Date de la dernière mise à jour de l'entrée du magasin (format ISO 8601).
}

/**
 * @interface MembreFamille
 * @augments BaseEntity
 * @description Représente le profil d'un membre de la famille.
 * Contient des informations personnelles, des préférences et des historiques.
 */
export interface MembreFamille extends BaseEntity {
  userId: string; // L'ID d'authentification utilisateur associé à ce membre de la famille.
  nom: string;
  prenom: string;
  dateNaissance: string; // AAAA-MM-DD.
  genre: 'homme' | 'femme' | 'autre';
  role: UserRole; // ex: 'parent', 'enfant', 'grand-parent'.
  preferencesAlimentaires: string[]; // ex: 'végétarien', 'sans gluten', 'bio'.
  allergies: string[]; // ex: 'arachides', 'lactose'.
  restrictionsMedicales: string[]; // ex: 'diabète', 'hypertension'.
  photoProfil?: string; // URL vers l'image de profil.
  repasFavoris?: string[]; // Tableau des IDs de Recettes favorites.
  historiqueRepas: HistoriqueRepas[]; // Historique des repas consommés par ce membre.
  contactUrgence: {
    nom: string;
    telephone: string;
  };
  aiPreferences: {
    niveauEpices: number; // Échelle de 1 à 5 pour le niveau d'épices préféré.
    apportCaloriqueCible: number; // Apport calorique quotidien cible en kcal.
    cuisinesPreferees: string[]; // ex: 'Italienne', 'Asiatique'.
  };
  historiqueSante?: {
    condition: string;
    dateDiagnostic: string; // AAAA-MM-DD.
    notesMedecin?: string;
  }[];
  niveauAcces: 'admin' | 'membre'; // Niveau d'accès dans l'application pour ce membre.
}


/**
 * @interface Ingredient
 * @augments BaseEntity
 * @description Représente un ingrédient disponible dans l'inventaire de la famille.
 * Contient des informations sur la quantité, l'unité, la catégorie et les valeurs nutritionnelles.
 */
export interface Ingredient extends BaseEntity {
  nom: string;
  quantite: number; // Quantité actuelle en stock.
  unite: Unit; // ex: 'kg', 'l', 'unité'.
  categorie?: IngredientCategory; // ex: 'légume', 'viande', 'fruit'.
  prixUnitaire?: number; // Prix par unité à l'achat.
  description?: string;
  perissable: boolean; // Indique si l'ingrédient est périssable.
  datePeremption?: string; // AAAA-MM-DD.
  dateAchat?: string; // AAAA-MM-DD: Date du dernier achat de l'ingrédient.
  stockActuel: number; // Représente la quantité physique en stock.
  marque?: string;
  fournisseur?: { // Tableau des magasins où cet ingrédient peut être acheté.
    storeId: string; // Référence à l'ID du magasin.
    prixUnitaire: number; // Prix à ce magasin spécifique.
    dernierAchat?: string; // AAAA-MM-DD: Dernière fois acheté dans ce magasin.
  }[];
  valeurNutritionnelle?: {
    calories: number; // par 100g/ml ou par unité.
    proteines: number;
    glucides: number;
    lipides: number;
    fibres?: number;
  };
}


/**
 * @interface Recette
 * @augments BaseEntity
 * @description Représente une recette avec ses ingrédients, instructions et métadonnées.
 */
export interface Recette extends BaseEntity {
  nom: string;
  ingredients: Ingredient[];
  instructions: string; // Texte complet des instructions.
  tempsPreparation: number; // En minutes.
  tempsCuisson?: number; // En minutes.
  portions: number; // Nombre de portions.
  categorie: RecipeCategory; // ex: 'plat principal', 'dessert', 'apéritif'.
  difficulte: 'facile' | 'moyen' | 'difficile';
  imageUrl?: string; // URL vers l'image de la recette.
  etapesPreparation: { texte: string; ordre: number }[]; // Étapes ordonnées pour les recettes complexes.
  tags?: string[]; // ex: 'rapide', 'sain', 'enfant'.
  coutEstime?: number; // Coût estimé pour réaliser la recette.
  variantes?: {
    nom: string;
    modifications: string; // Description des modifications pour cette variante.
  }[];
  tutorielVideo?: string; // URL vers un tutoriel vidéo.
  commentaires?: {
    userId: string; // Référence à MembreFamille.userId.
    texte: string;
    date: string; // Format ISO 8601.
  }[];
  aiAnalysis?: {
    caloriesTotales: number; // Calories totales pour la recette.
    niveauEpices: number; // Échelle de 1 à 5.
    adequationMembres: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' }; // Adéquation pour chaque membre de la famille.
  };
}



/**
 * @interface AiInteraction
 * @description Représente une seule interaction (message/réponse) au sein d'une conversation AI.
 * Le contenu peut être du texte, des données structurées (JSON), ou des références d'image.
 */
export interface AiInteraction {
  id?: string; // Optionnel: sera généré par Firestore lors de l'ajout
  content: string | object | { type: 'image', uri: string, mimeType: string, data: string }; // Texte, JSON structuré, ou données d'image.
  isUser: boolean; // Vrai si le message vient de l'utilisateur, Faux si de l'IA.
  timestamp: string; // Date et heure de l'interaction (format ISO 8601).
  type: 'text' | 'json' | 'image' | 'menu_suggestion' | 'shopping_list_suggestion' | 'recipe_analysis' | 'recipe_suggestion' | 'tool_use' | 'tool_response' | 'error'; // Catégorise le contenu.
  dateCreation?: string; // Auto-généré par FirestoreService.
  dateMiseAJour?: string; // Auto-généré par FirestoreService.
  conversationId?: string; // Ajouté pour faciliter la recherche si AiInteraction n'est pas une sous-collection.
}


/**
 * @interface Conversation
 * @description Représente un fil de conversation complet avec l'assistant IA.
 * Elle contient l'historique des messages sous forme d'un tableau d'AiInteraction.
 */
export interface Conversation {
  id?: string;
  userId: string; // L'ID de l'utilisateur propriétaire de cette conversation.
  familyId: string; // L'ID de la famille à laquelle cette conversation est associée.
  messages: AiInteraction[]; // Tableau des messages dans cette conversation, ordonnés chronologiquement.
  date: string; // Chaîne ISO 8601 représentant la date de début / dernière activité de la conversation.
  title: string; // Un titre court pour la conversation (ex: "Menu semaine prochaine", "Liste de courses pour le dîner").
  dateCreation?: string;
  dateMiseAJour?: string;
}


/**
 * @interface HistoriqueRepas
 * @description Enregistre les détails d'un repas consommé pour un membre de la famille.
 * Cette interface est imbriquée dans MembreFamille pour un accès direct à l'historique personnel.
 */
export interface HistoriqueRepas {
  id: string; // ID unique pour cet enregistrement historique.
  menuId: string; // Référence à Menu.id si ce repas faisait partie d'un menu planifié.
  date: string; // AAAA-MM-DD: Date de consommation.
  typeRepas: MealType;
  dateCreation: string; // Format ISO 8601.
  dateMiseAJour: string; // Format ISO 8601.
  notes?: string; // Notes personnelles sur le repas.
  evaluation?: {
    note: number; // Note de 1 à 5 étoiles.
    commentaire: string;
  };
}



/**
 * @interface Menu
 * @augments BaseEntity
 * @description Représente un repas planifié ou un repas qui a été consommé.
 * Inclut les recettes, le type de repas, les coûts et le statut.
 */
export interface Menu extends BaseEntity {
  date: string; // AAAA-MM-DD: La date à laquelle ce repas est planifié ou a été consommé.
  typeRepas: MealType; // ex: 'Petit déjeuner', 'Déjeuner', 'Dîner', 'Collation'.
  recettes: Omit<Recette[] , 'id'>; // Références aux IDs de Recettes.
  foodName?: string; // Optionnel: Un nom générique pour l'aliment si aucune recette spécifique n'est utilisée.
  foodPick?: string; // Optionnel: Un choix spécifique pour le repas (ex: "Pizza commandée").
  description?: string; // Notes additionnelles sur le repas.
  coutTotalEstime?: number;
  image?: ImageSourcePropType;
  coutReel?: number;
  statut: 'planifié' | 'terminé' | 'annulé';
  notes?: string;
  feedback?: {
    userId: string;
    note: number;
    date: string;
    commentaire: string;
  }[];
  aiSuggestions?: {
    recettesAlternatives: string[];
    ingredientsManquants: { nom: string; quantite: number; unite: Unit }[]; // Ingrédients manquants pour ce menu.
  };
}



/**
 * @interface ListeCourses
 * @augments BaseEntity
 * @description Représente une liste de courses pour la famille.
 * Permet de suivre les articles à acheter, leur quantité et leur statut d'achat.
 */
export interface ListeCourses extends BaseEntity {
  nom: string; // Nom de la liste de courses (ex: "Courses du week-end").
  items: {
    ingredientId: string; // Référence à Ingredient.id.
    quantite: number;
    unite: Unit;
    achete: boolean; // Vrai si l'article a été acheté.
    magasinSuggeré?: string; // Optionnel: ID du magasin recommandé.
  }[];
  budgetEstime?: number;
  budgetReel?: number;
  statut: 'en cours' | 'terminée' | 'archivée';
  notes?: string;
}



/**
 * @interface Budget
 * @augments BaseEntity
 * @description Suit les dépenses de la famille liées à la nourriture et aux courses.
 * Permet de définir un plafond mensuel et d'enregistrer les dépenses.
 */
export interface Budget extends BaseEntity {
  mois: string; // Format: "AAAA-MM".
  plafond: number; // Budget maximal pour le mois.
  depenses: {
    date: string; // AAAA-MM-DD.
    montant: number;
    description: string;
    categorie: 'nourriture' | 'hygiène' | 'entretien' | 'autre';
    preuveAchatUrl?: string; // Optionnel: URL vers l'image d'un reçu.
  }[];
  devise: Currency;
  alertes?: {
    seuil: number; // Pourcentage du plafond (ex: 80 pour 80%).
    message: string;
    date: string; // Format ISO 8601.
  }[];
}


