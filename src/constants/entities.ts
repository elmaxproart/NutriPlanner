import type {
  IngredientCategory,
  RecipeCategory,
  MealType,
  UserRole,
  StoreCategory,
  Genre,
} from './categories';
import type { Currency } from './config';
import { ImageSourcePropType } from 'react-native';
import {
  TextContent,
  JsonContent,
  ImageContent,
  MenuSuggestionContent,
  ShoppingListSuggestionContent,
  RecipeAnalysisContent,
  RecipeSuggestionContent,
  RecipePersonnalizedContent,
  ToolUseContent,
  ToolResponseContent,
  ErrorContent,
  RecipeContent,
  MenuContent,
  ShoppingListContent,
  BudgetContent,
  IngredientAvailabilityContent,
  FoodTrendsContent,
  NutritionalInfoContent,
  TroubleshootProblemContent,
  CreativeIdeasContent,
  StoreSuggestionContent,
  RecipeCompatibilityContent,
  AudioContent,
} from '../types/messageTypes';
import { Unit } from './units';
import { VideoProps } from 'expo-av';

/**
 * Base interface for all entities in the system.
 * Ensures common fields for consistency across entities.
 */
interface BaseEntity {
  id: string; // Unique identifier (e.g., UUID or Firestore document ID)
  createurId: string; // ID of the user who created the entity
  dateCreation: string; // Creation timestamp (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)
  dateMiseAJour?: string; // Optional: Last update timestamp (ISO 8601)
}

/**
 * Represents geographic and address information for a physical location.
 * Primarily used for stores.
 */
export interface Localisation {
  latitude: number; // Latitude coordinate
  longitude: number; // Longitude coordinate
  adresse: string; // Street address (e.g., '123 Rue de Paris')
  ville?: string; // Optional: City (e.g., 'Paris')
  codePostal?: string; // Optional: Postal code (e.g., '75001')
  pays?: string; // Optional: Country (e.g., 'France')
}

/**
 * Defines opening and closing hours for a specific day.
 * Used for store schedules.
 */
export interface Horaire {
  jour: string; // Day of the week (e.g., 'Lundi')
  ouverture: string; // Opening time (e.g., '09:00')
  fermeture: string; // Closing time (e.g., '18:00')
}

/**
 * Contains contact details for an entity, typically a store.
 */
export interface Contact {
  telephone: string; // Phone number
  email?: string; // Optional email address
  siteWeb?: string; // Optional website URL
}

/**
 * Describes a promotional offer or discount for a store item.
 */
export interface Promotion {
  articleId: string; // ID of the promoted item
  reduction: number;
  dateDebut: string;
  dateFin?: string;
  description?: string; // Optional: Promotion details (e.g., 'Buy 2, get 1 free')
}

/**
 * Represents a product available in a store.
 */
export interface StoreItem {
  id: string; // Unique ID for the store item
  storeId: string; // Reference to the store ID
  nom: string; // Product name (e.g., 'Tomates')
  categorie?: IngredientCategory; // Product category (e.g., 'vegetable')
  prixUnitaire: number; // Unit price
  unite: Unit; // Unit of measurement (e.g., 'kg', 'unit')
  stockDisponible: number; // Available stock quantity
  imageUrl?: ImageSourcePropType; // Optional image URL
  description?: string; // Optional description
  marque?: string; // Optional brand
  dateMiseAJour: string; // Last update date (YYYY-MM-DD)
}

/**
 * Represents a physical or online store.
 */
export interface Store {
  id: string; // Unique store ID
  nom: string; // Store name
  categorie: StoreCategory; // Store type (e.g., 'supermarket', 'online')
  localisation?: Localisation; // Optional: Physical location details
  horaires?: Horaire[]; // Optional: Array of opening hours
  contact?: Contact; // Optional: Contact information
  articles: StoreItem[]; // Available products
  promotions?: Promotion[]; // Optional: Current promotions
  dateCreation: string; // Creation timestamp (ISO 8601)
  dateMiseAJour?: string; // Optional: Last update timestamp (ISO 8601)
}

/**
 * Represents a family member’s profile.
 */
export interface MembreFamille extends BaseEntity {
  userId: string; // User ID
  nom: string; // Last name
  prenom: string; // First name
  dateNaissance: string; // Birth date (YYYY-MM-DD)
  genre: Genre; // Gender
  familyId?: string; // Optional: Family ID
  role: UserRole; // Role (e.g., 'parent', 'child')
  preferencesAlimentaires: string[]; // Dietary preferences (e.g., 'vegetarian')
  allergies: string[]; // Allergies (e.g., 'peanuts')
  restrictionsMedicales: string[]; // Medical restrictions (e.g., 'diabetes')
  photoProfil?: string; // Optional: Profile picture URL
  repasFavoris?: string[]; // Optional: Favorite recipe IDs
  historiqueRepas: HistoriqueRepas[]; // Meal history
  contactUrgence: {
    nom: string; // Emergency contact name
    telephone: string; // Emergency contact phone
  };
  aiPreferences: {
    niveauEpices: number; // Spice level preference (1-5)
    apportCaloriqueCible: number; // Target daily calorie intake (kcal)
    cuisinesPreferees: string[]; // Preferred cuisines (e.g., 'Italian')
  };
  historiqueSante?: {
    condition: string; // Health condition
    dateDiagnostic: string; // Diagnosis date (YYYY-MM-DD)
    notesMedecin?: string; // Optional: Doctor’s notes
  }[];
  niveauAcces: 'admin' | 'membre'; // Access level
}

/**
 * Represents an ingredient in the family’s inventory.
 */
export interface Ingredient extends BaseEntity {
  nom: string; // Ingredient name
  quantite: number; // Current quantity in stock
  unite: Unit; // Unit of measurement (e.g., 'kg')
  categorie?: IngredientCategory; // Optional: Category (e.g., 'vegetable')
  prixUnitaire?: number; // Optional: Unit price
  description?: string; // Optional: Description
  perissable: boolean; // Whether the ingredient is perishable
  datePeremption?: string; // Optional: Expiry date (YYYY-MM-DD)
  dateAchat?: string; // Optional: Purchase date (YYYY-MM-DD)
  stockActuel: number; // Physical stock quantity
  marque?: string; // Optional: Brand
  fournisseur?: {
    storeId: string; // Store ID
    prixUnitaire: number; // Price at this store
    dernierAchat?: string; // Last purchase date (YYYY-MM-DD)
  }[];
  valeurNutritionnelle?: {
    calories: number; // Calories per 100g/ml or unit
    proteines: number; // Proteins
    glucides: number; // Carbohydrates
    lipides: number; // Fats
    fibres?: number; // Optional: Fibers
  };
}

/**
 * Represents a recipe with ingredients and instructions.
 */
export interface Recette extends BaseEntity {
  nom: string; // Recipe name
  ingredients: Ingredient[]; // Required ingredients
  instructions: string[]; // Cooking instructions
  tempsPreparation: number; // Preparation time (minutes)
  tempsCuisson?: number; // Optional: Cooking time (minutes)
  portions: number; // Number of servings
  categorie: RecipeCategory; // Category (e.g., 'main dish')
  difficulte: 'facile' | 'moyen' | 'difficile'; // Difficulty level
  imageUrl?: ImageSourcePropType; // Optional: Recipe image URL
  etapesPreparation: { texte: string; ordre: number }[]; // Preparation steps
  tags?: string[]; // Optional: Tags (e.g., 'quick', 'healthy')
  coutEstime?: number; // Optional: Estimated cost
  variantes?: {
    nom: string; // Variant name
    modifications: string; // Description of modifications
  }[];
  tutorielVideo?: VideoProps;
  commentaires?: {
    userId: string; // Commenter’s user ID
    texte: string; // Comment text
    date: string; // Comment date (ISO 8601)
  }[];
  aiAnalysis?: {
    caloriesTotales: number; // Total calories
    niveauEpices: number; // Spice level (1-5)
    adequationMembres: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' }; // Member suitability
  };
}

/**
 * Represents a single interaction (message or response) in an AI conversation.
 */
export interface AiInteraction {
  id: string; // Unique interaction ID
  content: AiInteractionContent; // Content of the interaction
  isUser: boolean; // True if from user, false if from AI
  timestamp: string; // Timestamp (ISO 8601, e.g., '2025-06-16T08:12:00.000Z')
  type: AiInteractionType; // Interaction type
  dateCreation: string; // Creation timestamp (Firestore format)
  dateMiseAJour: string; // Last update timestamp (Firestore format)
  conversationId: string;
}

/**
 * Types of AI interactions, defining the content structure.
 */
export type AiInteractionType =
  | 'text'
  | 'json'
  | 'image'
  | 'menu_suggestion'
  | 'shopping_list_suggestion'
  | 'recipe_analysis' // Recipe analysis
  | 'recipe_suggestion' // Recipe suggestion
  | 'tool_use' // Tool usage
  | 'tool_response' // Tool response
  | 'error' // Error message
  | 'recipe' // Recipe entity
  | 'menu' // Menu entity
  | 'shopping' // Shopping list entity
  | 'budget' // Budget entity
  | 'ingredient_availability' // Ingredient availability
  | 'food_trends' // Food trends
  | 'nutritional_info' // Nutritional information
  | 'troubleshoot_problem' // Troubleshooting
  | 'creative_ideas' // Creative ideas
  | 'stores' // Store suggestions
  | 'recipe_compatibility'
  | 'audio'
  | 'recipe_personalized';

/**
 * Union type for all possible AI interaction content.
 */
export type AiInteractionContent =
  | TextContent
  | JsonContent
  | ImageContent
  | MenuSuggestionContent
  | ShoppingListSuggestionContent
  | RecipeAnalysisContent
  | RecipeSuggestionContent
  | ToolUseContent
  | ToolResponseContent
  | ErrorContent
  | RecipeContent
  | MenuContent
  | ShoppingListContent
  | BudgetContent
  | IngredientAvailabilityContent
  | FoodTrendsContent
  | NutritionalInfoContent
  | TroubleshootProblemContent
  | CreativeIdeasContent
  | StoreSuggestionContent
  | RecipeCompatibilityContent
  | AudioContent
  | RecipePersonnalizedContent;


/**
 * Represents a conversation thread with the AI assistant.
 */
export interface Conversation {
  id?: string; // Optional: Conversation ID
  userId: string; // User ID
  messages: AiInteraction[]; // Array of interactions
  date: string; // Conversation date
  title: string; // Conversation title
  dateCreation?: string; // Creation timestamp
  dateMiseAJour?: string; // Last update timestamp
}

/**
 * Records details of a meal consumed by a family member.
 */
export interface HistoriqueRepas {
  id: string; // Unique ID
  menuId: string; // Reference to Menu ID
  date: string; // Consumption date (YYYY-MM-DD)
  typeRepas: MealType; // Meal type (e.g., 'Dinner')
  dateCreation: string; // Creation timestamp (ISO 8601)
  dateMiseAJour: string; // Last update timestamp (ISO 8601)
  notes?: string; // Optional: Personal notes
  evaluation?: {
    note: number; // Rating (1-5)
    commentaire: string; // Comment
  };
}

/**
 * Represents a planned or consumed meal.
 */
export interface Menu extends BaseEntity {
  date: string; // Meal date (YYYY-MM-DD)
  typeRepas: MealType;
  recettes: Recette[]; // Array of recipes
  foodName?: string; // Optional: Generic food name
  foodPick?: string; // Optional: Specific food choice (e.g., 'Ordered pizza')
  description?: string; // Optional: Additional notes
  coutTotalEstime?: number; // Optional: Estimated cost
  image?: ImageSourcePropType; // Optional: Image
  coutReel?: number; // Optional: Actual cost
  statut: 'planifié' | 'terminé' | 'annulé'; // Status
  notes?: string; // Optional: Notes
  feedback?: {
    userId: string; // User ID
    note: number; // Rating
    date: string; // Feedback date (ISO 8601)
    commentaire: string; // Comment
  }[];
  aiSuggestions?: {
    recettesAlternatives: string[];
    ingredientsManquants: Ingredient[];
  };
}

/**
 * Represents a shopping list for the family.
 */
export interface ListeCourses extends BaseEntity {
  nom: string; // List name
  items: Ingredient[]; // Items to purchase
  budgetEstime?: number; // Optional: Estimated budget
  budgetReel?: number; // Optional: Actual budget
  statut: 'en cours' | 'terminée' | 'archivée'; // Status
  notes?: string; // Optional: Notes
}

/**
 * Tracks family expenses related to food and groceries.
 */
export interface Budget extends BaseEntity {
  mois: string; // Month (e.g., '2025-06')
  plafond: number; // Monthly budget ceiling
  depenses: {
    date: string; // Expense date (YYYY-MM-DD)
    montant: number; // Amount
    description: string;
    categorie: 'nourriture' | 'hygiène' | 'entretien' | 'autre';
    preuveAchatUrl?: string;
  }[];
  devise: Currency; // Currency (e.g., 'EUR')
  alertes?: {
    seuil: number; // Threshold percentage (e.g., 80 for 80%)
    message: string; // Alert message
    date: string; // Alert date (ISO 8601)
  }[];
}
