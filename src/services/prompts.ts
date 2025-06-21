// src/constants/prompts.ts
import { HistoriqueRepas, MembreFamille, Recette, Ingredient, Menu, Store } from '../constants/entities';
import { calculateAge } from '../utils/helpers';

const getCurrentDate = () => new Date().toISOString().split('T')[0];

export enum PromptType {
  WEEKLY_MENU = 'weekly_menu',
  SHOPPING_LIST = 'shopping_list',
  RECIPE_NUTRITION_ANALYSIS = 'recipe_nutrition_analysis',
  RECIPE_SUGGESTION = 'recipe_suggestion',
  INGREDIENT_AVAILABILITY = 'ingredient_availability',
  NUTRITIONAL_INFO = 'nutritional_info',
  TROUBLESHOOT_PROBLEM = 'troubleshoot_problem',
  CREATIVE_IDEAS = 'creative_ideas',
  RECIPE_PERSONALIZED = 'recipe_personalized',
  QUICK_RECIPE = 'quick_recipe',
  BUDGET_PLANNING = 'budget_planning',
  STORE_SUGGESTION = 'store_suggestion',
  MEAL_ANALYSIS = 'meal_analysis',
  KIDS_RECIPE = 'kids_recipe',
  SPECIAL_OCCASION_MENU = 'special_occasion_menu',
  INVENTORY_OPTIMIZATION = 'inventory_optimization',
  INGREDIENT_BASED_RECIPE = 'ingredient_based_recipe',
  BUDGET_MENU = 'budget_menu',
  RECIPE_COMPATIBILITY = 'recipe_compatibility',
  SPECIFIC_DIET_RECIPE = 'specific_diet_recipe',
  BALANCED_DAILY_MENU = 'balanced_daily_menu',
  RECIPE_FROM_IMAGE = 'recipe_from_image',
  LEFTOVER_RECIPE = 'leftover_recipe',
  GUEST_RECIPE = 'guest_recipe',
  FOOD_TREND_ANALYSIS = 'food_trend_analysis',
}

export interface PromptTemplate {
  id: PromptType;
  name: string;
  description: string;
  generate: (params: any) => string;
}

export const prompts: PromptTemplate[] = [
  {
    id: PromptType.RECIPE_PERSONALIZED,
    name: 'Recette Personnalisée pour un Membre',
    description: 'Génère une recette adaptée aux préférences, allergies et besoins nutritionnels d’un membre de la famille.',
    generate: (params: { member: MembreFamille }) => {
      const { member } = params;
      return JSON.stringify({
        prompt: `🍽️ **Génération de Recette Personnalisée pour un Membre de la Famille** 🍽️\n\n
          Vous êtes un assistant culinaire IA avancé, chargé de créer une recette sur mesure pour un membre de la famille, en respectant ses préférences, restrictions et besoins nutritionnels. La réponse doit être au format JSON strict, conforme aux interfaces TypeScript \`Ingredient\` et \`Recette\`. La recette doit être délicieuse, réalisable en moins de 60 minutes, et optimisée pour les goûts et la santé du membre. Si des ingrédients manquent dans l'inventaire, proposez un plan d'achat avec des fournisseurs. Fournissez une analyse détaillée pour garantir l'adéquation de la recette.\n\n
          🌟 **Profil du Membre de la Famille** 🌟\n
          - **Nom**: ${member.prenom ? member.prenom + ' ' : ''}${member.nom}\n
          - **Âge**: ${calculateAge(member.dateNaissance) || 'Non spécifié'} ans\n
          - **Genre**: ${member.genre}\n
          - **Rôle**: ${member.role}\n
          - **Préférences Alimentaires**: ${member.preferencesAlimentaires.length > 0 ? member.preferencesAlimentaires.join(', ') : 'Aucune'}\n
          - **Allergies**: ${member.allergies.length > 0 ? member.allergies.join(', ') : 'Aucune'}\n
          - **Restrictions Médicales**: ${member.restrictionsMedicales.length > 0 ? member.restrictionsMedicales.join(', ') : 'Aucune'}\n
          - **Cuisines Préférées**: ${member.aiPreferences.cuisinesPreferees.length > 0 ? member.aiPreferences.cuisinesPreferees.join(', ') : 'Non spécifiées'}\n
          - **Niveau d'Épices Préféré**: ${member.aiPreferences.niveauEpices}/5\n
          - **Apport Calorique Cible**: ${member.aiPreferences.apportCaloriqueCible} kcal/jour\n
          - **Repas Favoris**: ${member.repasFavoris?.length ? member.repasFavoris.join(', ') : 'Aucun'}\n
          - **Conditions de Santé**: ${member.historiqueSante?.length ? member.historiqueSante.map(h => `${h.condition} (${h.dateDiagnostic})`).join(', ') : 'Aucune'}\n
          - **Contact d'Urgence**: ${member.contactUrgence.nom} (${member.contactUrgence.telephone})\n
          - **Niveau d'Accès**: ${member.niveauAcces}\n\n
          📋 **Interfaces TypeScript** 📋\n
          interface Ingredient {
            id: string;
            nom: string;
            quantite: number;
            unite: 'kg' | 'g' | 'l' | 'ml' | 'unité' | 'pincée' | 'cuillère à soupe' | 'cuillère à café';
            categorie?: 'légume' | 'viande' | 'poisson' | 'fruit' | 'céréale' | 'produit laitier' | 'épice' | 'autre';
            prixUnitaire?: number;
            description?: string;
            perissable: boolean;
            datePeremption?: string;
            dateAchat?: string;
            stockActuel: number;
            marque?: string;
            fournisseur?: { storeId: string; prixUnitaire: number; dernierAchat?: string }[];
            valeurNutritionnelle?: { calories: number; proteines: number; glucides: number; lipides: number; fibres?: number };
          }
          interface Recette {
            id: string;
            nom: string;
            ingredients: Ingredient[];
            instructions: string[];
            tempsPreparation: number;
            tempsCuisson?: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson' | 'petit-déjeuner';
            difficulte: 'facile' | 'moyen' | 'difficile';
            imageUrl?: string;
            etapesPreparation: { texte: string; ordre: number }[];
            tags?: string[];
            coutEstime?: number;
            variantes?: { nom: string; modifications: string }[];
            tutorielVideo?: string;
            commentaires?: { userId: string; texte: string; date: string }[];
            aiAnalysis?: { caloriesTotales: number; niveauEpices: number; adequationMembres: { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' } };
          }
          🔧 **Instructions pour l'IA** 🔧\n
          1. **Validation Rigoureuse**:
             - Exclure tout ingrédient correspondant aux allergies ou restrictions médicales (ex. éviter le lactose si intolérance).
             - Si une préférence alimentaire (ex. végane) est présente, substituer les ingrédients incompatibles (ex. lait d’amande pour lait de vache).
             - Maintenir l’apport calorique total dans ±10% de l’objectif (${member.aiPreferences.apportCaloriqueCible} kcal).
             - Ajuster le niveau d’épices pour correspondre à ${member.aiPreferences.niveauEpices}/5.
          2. **Ingrédients**:
             - Lister tous les ingrédients nécessaires avec des valeurs réalistes pour \`quantite\`, \`unite\`, \`prixUnitaire\`, \`perissable\`, et \`valeurNutritionnelle\`.
             - Supposer un inventaire partiel (50% des ingrédients disponibles) et indiquer \`stockActuel\`.
             - Pour les ingrédients manquants, fournir un \`fournisseur\` avec \`storeId\` générique (ex. 'magasin1') et \`prixUnitaire\` estimé.
             - Pour les ingrédients périssables, inclure une \`datePeremption\` dans les 7 à 14 jours à partir du ${getCurrentDate()}.
          3. **Recette**:
             - Créer un nom de recette attrayant reflétant les cuisines préférées (ex. 'Curry Végétarien Thaï' pour une préférence asiatique).
             - Fournir des \`instructions\` claires (max. 10 étapes) et des \`etapesPreparation\` numérotées.
             - Inclure des \`tags\` pertinents (ex. 'rapide', 'sain', 'familial').
             - Calculer le \`coutEstime\` en multipliant \`quantite\` par \`prixUnitaire\`.
             - Proposer une \`variante\` (ex. version sans gluten ou faible en sel).
             - Fournir une \`imageUrl\` fictive (ex. 'https://example.com/recipe.jpg').
             - Inclure un \`tutorielVideo\` fictif (ex. 'https://youtube.com/video123').
             - Ajouter un \`commentaire\` fictif d’un utilisateur (ex. 'Super recette, facile à faire !').
          4. **Analyse AI**:
             - Calculer \`caloriesTotales\` en sommant les calories des ingrédients, ajustées aux quantités.
             - Vérifier \`niveauEpices\` par rapport aux ingrédients (ex. curry = niveau 3).
             - Déterminer \`adequationMembres\` pour ${member.id} (ex. 'adapté' si conforme, 'modifié' si substitutions).
          5. **Gestion d'Inventaire**:
             - Identifier les ingrédients avec \`stockActuel\` insuffisant.
             - Proposer un tableau \`inventaireAjouts\` avec les ingrédients à acheter, incluant \`fournisseur\` et \`quantite\`.
          6. **Sortie JSON**:
             - Retourner un objet avec deux clés:
               - \`recette\`: Objet conforme à l’interface \`Recette\`.
               - \`inventaireAjouts\`: Tableau d’objets \`Ingredient\` à ajouter.
             - Assurer un JSON valide, sans texte ou commentaires externes.
          📊 **Exemple de Réponse Attendue** 📊\n
          {
            "recette": {
              "id": "recette123",
              "nom": "Salade Niçoise Végétarienne",
              "ingredients": [
                {
                  "id": "ing1",
                  "nom": "Tomates",
                  "quantite": 0.4,
                  "unite": "kg",
                  "categorie": "légume",
                  "prixUnitaire": 3.0,
                  "perissable": true,
                  "datePeremption": "${new Date(new Date(getCurrentDate()).setDate(new Date(getCurrentDate()).getDate() + 7)).toISOString().split('T')[0]}",
                  "stockActuel": 0.1,
                  "valeurNutritionnelle": { "calories": 18, "proteines": 0.9, "glucides": 3.9, "lipides": 0.2 }
                }
              ],
              "instructions": ["Couper les tomates", "Assembler la salade"],
              "etapesPreparation": [{ "texte": "Couper les tomates en quartiers", "ordre": 1 }],
              "tempsPreparation": 20,
              "portions": 2,
              "categorie": "entrée",
              "difficulte": "facile",
              "imageUrl": "https://example.com/salade.jpg",
              "tags": ["sain", "rapide", "végétarien"],
              "coutEstime": 7.5,
              "variantes": [{ "nom": "Sans œuf", "modifications": "Omettre les œufs durs" }],
              "tutorielVideo": "https://youtube.com/video456",
              "commentaires": [{ "userId": "user123", "texte": "Délicieux et frais !", "date": "${getCurrentDate()}T10:00:00Z" }],
              "aiAnalysis": { "caloriesTotales": 180, "niveauEpices": 1, "adequationMembres": { "${member.id}": "adapté" } }
            },
            "inventaireAjouts": [
              {
                "id": "ing1",
                "nom": "Tomates",
                "quantite": 0.3,
                "unite": "kg",
                "fournisseur": [{ "storeId": "magasin1", "prixUnitaire": 3.0 }]
              }
            ]
          }\n
          ⚠️ **Contraintes Additionnelles** ⚠️\n
          - Utiliser exclusivement le français pour tous les textes (noms, instructions, commentaires).
          - Respecter le format de date AAAA-MM-DD pour \`datePeremption\` et \`dateAchat\`.
          - Fournir des valeurs nutritionnelles réalistes basées sur des standards (ex. tomates: 18 kcal/100g).
          - Éviter toute incohérence, comme inclure un ingrédient allergène.
          - Si les cuisines préférées ne sont pas spécifiées, choisir une cuisine universelle (ex. méditerranéenne).
          - Générer une recette adaptée à l’âge et aux conditions de santé (ex. faible en sucre pour diabète).
          🎉 **Objectif**: Créer une expérience culinaire délicieuse et personnalisée pour ${member.prenom || member.nom} ! 🎉`,
      });
    },
  },
  {
    id: PromptType.WEEKLY_MENU,
    name: 'Menu Hebdomadaire pour la Famille',
    description: 'Génère un menu hebdomadaire pour tous les membres de la famille, en respectant leurs préférences et restrictions.',
    generate: (params: { members: MembreFamille[]; dateStart: string }) => {
      const { members, dateStart } = params;
      return JSON.stringify({
        prompt: `📅 **Génération d’un Menu Hebdomadaire pour la Famille** 📅\n\n
          Vous êtes un assistant culinaire IA chargé de créer un menu pour une semaine complète (7 jours à partir du ${dateStart}) pour une famille. Le menu doit inclure des repas pour le petit-déjeuner, le déjeuner, le dîner et une collation quotidienne, en respectant les préférences alimentaires, allergies et restrictions médicales de chaque membre. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Menu\`.\n\n
          👨‍👩‍👧‍👦 **Membres de la Famille** 👨‍👩‍👧‍👦\n
          ${members
            .map(
              (m) => `
          - **${m.prenom} ${m.nom}**:\n
            - Âge: ${calculateAge(m.dateNaissance) || 'Non spécifié'} ans\n
            - Préférences: ${m.preferencesAlimentaires.join(', ') || 'Aucune'}\n
            - Allergies: ${m.allergies.join(', ') || 'Aucune'}\n
            - Restrictions: ${m.restrictionsMedicales.join(', ') || 'Aucune'}\n
            - Cuisines préférées: ${m.aiPreferences.cuisinesPreferees.join(', ') || 'Non spécifiées'}\n
            - Niveau d'épices: ${m.aiPreferences.niveauEpices}/5\n
            - Calories cible: ${m.aiPreferences.apportCaloriqueCible} kcal/jour\n`
            )
            .join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface Menu {
            id: string;
            date: string;
            typeRepas: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
            recettes: { id: string; nom: string; ingredients: { nom: string; quantite: number; unite: string }[] }[];
            coutTotalEstime?: number;
            statut: 'planifié' | 'terminé' | 'annulé';
            aiSuggestions?: { recettesAlternatives: string[]; ingredientsManquants: { nom: string; quantite: number; unite: string }[] };
          }\n
          🔧 **Instructions** 🔧\n
          - Générer 28 menus (4 repas/jour × 7 jours).\n
          - Assurer que chaque repas est adapté à tous les membres (ex. substituer les allergènes).\n
          - Inclure des recettes variées basées sur les cuisines préférées.\n
          - Fournir une liste d’ingrédients manquants pour la semaine.\n
          - Calculer le \`coutTotalEstime\` pour chaque menu.\n
          - Retourner un objet avec deux clés: \`menus\` (tableau de \`Menu\`) et \`ingredientsManquants\` (tableau d'ingrédients).\n
          📊 **Exemple de Réponse** 📊\n
          {
            "menus": [{
              "id": "menu1",
              "date": "${dateStart}",
              "typeRepas": "petit-déjeuner",
              "recettes": [{ "id": "rec1", "nom": "Smoothie aux fruits", "ingredients": [{ "nom": "Banane", "quantite": 2, "unite": "unité" }] }],
              "coutTotalEstime": 5.0,
              "statut": "planifié"
            }],
            "ingredientsManquants": [{ "nom": "Banane", "quantite": 14, "unite": "unité" }]
          }\n`,
      });
    },
  },
  {
    id: PromptType.SHOPPING_LIST,
    name: 'Liste de Courses Optimisée',
    description: 'Génère une liste de courses basée sur un menu, avec suggestions de magasins et promotions.',
    generate: (params: { menu: Menu; stores: Store[] }) => {
      const { menu, stores } = params;
      return JSON.stringify({
        prompt: `🛒 **Génération d’une Liste de Courses Optimisée** 🛒\n\n
          Vous êtes un assistant IA chargé de créer une liste de courses pour un menu donné, en tenant compte des stocks actuels et des promotions disponibles dans les magasins. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`ListeCourses\`.\n\n
          📋 **Menu** 📋\n
          - Date: ${menu.date}\n
          - Type: ${menu.typeRepas}\n
          - Recettes: ${menu.recettes.map((r) => r.nom).join(', ')}\n
          - Ingrédients requis: ${menu.recettes
            .flatMap((r) => r.ingredients.map((i) => `${i.nom} (${i.quantite} ${i.unite})`))
            .join(', ')}\n\n
          🏬 **Magasins Disponibles** 🏬\n
          ${stores
            .map(
              (s) => `
          - ${s.nom} (${s.categorie}):\n
            - Articles: ${s.articles.map((a) => `${a.nom} (${a.prixUnitaire} €/${a.unite})`).join(', ')}\n
            - Promotions: ${s.promotions?.map((p) => `${p.articleId} (-${p.reduction}%)`).join(', ') || 'Aucune'}\n`
            )
            .join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface ListeCourses {
            id: string;
            nom: string;
            items: { ingredientId: string; nom: string; quantite: number; unite: string; achete: boolean; magasinSuggeré?: string }[];
            budgetEstime?: number;
            statut: 'en cours' | 'terminée' | 'archivée';
          }\n
          🔧 **Instructions** 🔧\n
          - Lister les ingrédients manquants pour le menu.\n
          - Suggérer des magasins en fonction des prix et des promotions.\n
          - Calculer le \`budgetEstime\`.\n
          - Marquer tous les articles comme non-achetés (\`achete: false\`).\n
          - Retourner un objet conforme à l’interface \`ListeCourses\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "liste1",
            "nom": "Courses pour dîner",
            "items": [{ "ingredientId": "ing1", "nom": "Tomates", "quantite": 2, "unite": "kg", "achete": false, "magasinSuggeré": "Supermarché X" }],
            "budgetEstime": 15.0,
            "statut": "en cours"
          }\n`,
      });
    },
  },
  {
    id: PromptType.RECIPE_NUTRITION_ANALYSIS,
    name: 'Analyse Nutritionnelle d’une Recette',
    description: 'Analyse nutritionnelle et adéquation d’une recette pour une famille.',
    generate: (params: { recipe: Recette }) => {
      const { recipe } = params;
      return JSON.stringify({
        prompt: `🔍 **Analyse Nutritionnelle d’une Recette** 🔍\n\n
          Vous êtes un expert en nutrition IA chargé d’analyser une recette pour fournir des informations détaillées sur ses valeurs nutritionnelles et son adéquation aux membres de la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`RecipeAnalysisContent\`.\n\n
          🍴 **Recette** 🍴\n
          - Nom: ${recipe.nom}\n
          - Ingrédients: ${recipe.ingredients.map((i) => `${i.nom} (${i.quantite} ${i.unite})`).join(', ')}\n
          - Portions: ${recipe.portions}\n\n
          📋 **Interface TypeScript** 📋\n
          interface RecipeAnalysisContent {
            type: 'recipe_analysis';
            recipeId: string;
            analysis: { calories: number; nutrients: { name: string; value: number; unit: string }[]; dietaryFit: string };
          }\n
          🔧 **Instructions** 🔧\n
          - Calculer les calories totales et par portion.\n
          - Lister les nutriments principaux (protéines, glucides, lipides, fibres).\n
          - Indiquer si la recette convient aux régimes spécifiques (ex. végane, sans gluten).\n
          - Retourner un objet conforme à l’interface \`RecipeAnalysisContent\`.\n
          📊 **Exemple** 📊\n
          {
            "type": "recipe_analysis",
            "recipeId": "${recipe.id}",
            "analysis": {
              "calories": 500,
              "nutrients": [{ "name": "Protéines", "value": 20, "unit": "g" }],
              "dietaryFit": "Convient aux végétariens"
            }
          }\n`,
      });
    },
  },
  {
    id: PromptType.RECIPE_SUGGESTION,
    name: 'Suggestion de Recette',
    description: 'Suggère des recettes basées sur les ingrédients et préférences.',
    generate: (params: { ingredients: Ingredient[]; preferences: any }) => {
      const { ingredients, preferences } = params;
      return JSON.stringify({
        prompt: `🍴 **Suggestion de Recette** 🍴\n\n
          Proposez 3 recettes basées sur les ingrédients et préférences suivantes :
          Ingrédients : ${ingredients.map((i) => `${i.nom} (${i.quantite} ${i.unite})`).join(', ')}
          Préférences : Niveau d'épices ${preferences.niveauEpices}, Cuisines ${preferences.cuisinesPreferees.join(
            ', '
          )}${preferences.mealType ? `, Type de repas ${preferences.mealType}` : ''}.
          Répondez en JSON avec un tableau d'objets Recette conformes à l'interface TypeScript \`Recette\`.\n\n
          📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson' | 'petit-déjeuner';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Assurer que les recettes utilisent principalement les ingrédients fournis.\n
          - Respecter les préférences alimentaires et le niveau d’épices.\n
          - Retourner un tableau de 3 objets \`Recette\`.\n
          📊 **Exemple** 📊\n
          [{
            "id": "rec1",
            "nom": "Salade de quinoa",
            "ingredients": [{ "nom": "Quinoa", "quantite": 200, "unite": "g" }],
            "instructions": ["Cuire le quinoa", "Mélanger avec les légumes"],
            "tempsPreparation": 20,
            "portions": 4,
            "categorie": "plat principal",
            "difficulte": "facile"
          }]\n`,
      });
    },
  },
  {
    id: PromptType.QUICK_RECIPE,
    name: 'Recette Rapide',
    description: 'Génère une recette réalisable en moins de 30 minutes, adaptée à un membre.',
    generate: (params: { member: MembreFamille }) => {
      const { member } = params;
      return JSON.stringify({
        prompt: `⏩ **Génération d’une Recette Rapide** ⏩\n\n
          Génère une recette réalisable en moins de 30 minutes, adaptée aux préférences et restrictions d’un membre de la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🌟 **Membre** 🌟\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Préférences: ${member.preferencesAlimentaires.join(', ') || 'Aucune'}\n
          - Allergies: ${member.allergies.join(', ') || 'Aucune'}\n
          📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Temps total (préparation + cuisson) < 30 minutes.\n
          - Utiliser des ingrédients simples et courants.\n
          - Respecter les préférences et restrictions du membre.\n
          - Retourner un objet conforme à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Omelette aux légumes",
            "ingredients": [{ "nom": "Œufs", "quantite": 4, "unite": "unité" }],
            "instructions": ["Battre les œufs", "Cuire 5 min"],
            "tempsPreparation": 10,
            "portions": 2,
            "categorie": "plat principal",
            "difficulte": "facile"
          }\n`,
      });
    },
  },
  {
    id: PromptType.BUDGET_PLANNING,
    name: 'Planification de Budget Alimentaire',
    description: 'Génère un plan budgétaire mensuel pour les dépenses alimentaires.',
    generate: (params: { budgetLimit: number; month: string }) => {
      const { budgetLimit, month } = params;
      return JSON.stringify({
        prompt: `💰 **Planification de Budget Alimentaire Mensuel** 💰\n\n
          Vous êtes un assistant IA chargé de créer un plan budgétaire pour les dépenses alimentaires d’un mois (${month}). La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Budget\`.\n\n
          📋 **Détails** 📅\n
          - Plafond: ${budgetLimit} EUR\n
          - Mois: ${month}\n
          📋 **Interface TypeScript** 📋\n
          interface Budget {
            mois: string;
            plafond: number;
            depenses: [{ date: string; montant: number; description: string; categorie: string }];
          }\n
          🔧 **Instructions** 🔧\n
          - Proposer une répartition hebdomadaire du budget.\n
          - Inclure des catégories (nourriture, hygiène, etc.).\n
          - Retourner un objet conforme à l’interface \`Budget\`.\n
          📊 **Exemple** 📊\n
          {
            "mois": "${month}",
            "plafond": ${budgetLimit},
            "depenses": [{ "date": "${month}-01", "montant": 100, "description": "Courses hebdo", "categorie": "nourriture" }]
          }\n`,
      });
    },
  },
  {
    id: PromptType.STORE_SUGGESTION,
    name: 'Suggestion de Magasin',
    description: 'Suggère le meilleur magasin pour acheter un ingrédient spécifique.',
    generate: (params: { ingredient: Ingredient; stores: Store[] }) => {
      const { ingredient, stores } = params;
      return JSON.stringify({
        prompt: `🏬 **Suggestion de Magasin pour un Ingrédient** 🏬\n\n
          Vous êtes un assistant IA chargé de suggérer le meilleur magasin pour acheter un ingrédient spécifique, en tenant compte du prix, de la disponibilité et des promotions. La réponse doit être au format JSON strict.\n\n
          🥕 **Ingrédient** 🥕\n
          - Nom: ${ingredient.nom}\n
          - Quantité: ${ingredient.quantite} ${ingredient.unite}\n
          🏪 **Magasins** 🏪\n
          ${stores
            .map(
              (s) =>
                `- ${s.nom}: ${
                  s.articles.find((a) => a.nom === ingredient.nom)?.prixUnitaire || 'Non disponible'
                } €/${ingredient.unite}`
            )
            .join('\n')}
          \n📋 **Sortie** 📋\n
          {
            "ingredientId": string,
            "storeId": string,
            "storeName": string,
            "prixUnitaire": number,
            "promotion"?: { reduction: number; dateFin: string }
          }\n
          🔧 **Instructions** 🔧\n
          - Choisir le magasin avec le prix le plus bas ou une promotion active.\n
          - Retourner un objet avec les détails du magasin suggéré.\n
          📊 **Exemple** 📊\n
          {
            "ingredientId": "${ingredient.id}",
            "storeId": "store1",
            "storeName": "Supermarché X",
            "prixUnitaire": 2.5,
            "promotion": { "reduction": 10, "dateFin": "${getCurrentDate()}" }
          }\n`,
      });
    },
  },
  {
    id: PromptType.MEAL_ANALYSIS,
    name: 'Analyse de Repas Consommé',
    description: 'Analyse un repas consommé pour évaluer sa valeur nutritionnelle et son impact.',
    generate: (params: { historiqueRepas: HistoriqueRepas; member: MembreFamille }) => {
      const { historiqueRepas, member } = params;
      return JSON.stringify({
        prompt: `🍽️ **Analyse d’un Repas Consommé** 🍽️\n\n
          Vous êtes un expert en nutrition IA chargé d’analyser un repas consommé par un membre de la famille pour évaluer ses valeurs nutritionnelles et son adéquation avec ses besoins. La réponse doit être au format JSON strict.\n\n
          📋 **Repas** 📋\n
          - Date: ${historiqueRepas.date}\n
          - Type: ${historiqueRepas.typeRepas}\n
          - Notes: ${historiqueRepas.notes || 'Aucune'}\n
          👤 **Membre** 👤\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Calories cible: ${member.aiPreferences.apportCaloriqueCible} kcal\n
          📋 **Sortie** 📋\n
          {
            "calories": number,
            "nutrients": [{ name: string; value: number; unit: string }],
            "adequation": string
          }\n
          🔧 **Instructions** 🔧\n
          - Estimer les calories et nutriments basés sur le type de repas.\n
          - Comparer avec les besoins du membre.\n
          - Retourner un objet avec les détails nutritionnels.\n
          📊 **Exemple** 📊\n
          {
            "calories": 600,
            "nutrients": [{ "name": "Protéines", "value": 25, "unit": "g" }],
            "adequation": "Adapté aux besoins caloriques"
          }\n`,
      });
    },
  },
  {
    id: PromptType.KIDS_RECIPE,
    name: 'Recette pour Enfants',
    description: 'Génère une recette amusante et saine adaptée aux enfants.',
    generate: (params: { member: MembreFamille }) => {
      const { member } = params;
      return JSON.stringify({
        prompt: `👧 **Recette pour Enfants** 👧\n\n
          Génère une recette amusante, saine et adaptée aux enfants, en respectant les préférences et restrictions d’un membre de la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🌟 **Membre** 🌟\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Âge: ${calculateAge(member.dateNaissance) || 'Non spécifié'} ans\n
          - Préférences: ${member.preferencesAlimentaires.join(', ') || 'Aucune'}\n
          📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Créer une recette visuellement attrayante pour les enfants.\n
          - Utiliser des ingrédients sains et simples.\n
          - Retourner un objet conforme à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Pizza arc-en-ciel",
            "ingredients": [{ "nom": "Poivrons", "quantite": 2, "unite": "unité" }],
            "instructions": ["Couper les légumes", "Assembler la pizza"],
            "tempsPreparation": 15,
            "portions": 4,
            "categorie": "plat principal",
            "difficulte": "facile"
          }\n`,
      });
    },
  },
  {
    id: PromptType.SPECIAL_OCCASION_MENU,
    name: 'Menu pour Occasion Spéciale',
    description: 'Génère un menu pour une occasion spéciale (ex. anniversaire, fête).',
    generate: (params: { members: MembreFamille[]; occasion: string; date: string }) => {
      const { members, occasion, date } = params;
      return JSON.stringify({
        prompt: `🎉 **Menu pour Occasion Spéciale** 🎉\n\n
          Génère un menu pour une occasion spéciale (${occasion}) à la date ${date}, adapté aux préférences de la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Menu\`.\n\n
          👨‍👩‍👧‍👦 **Membres** 👨‍👩‍👧‍👦\n
          ${members.map((m) => `- ${m.prenom} ${m.nom}: ${m.preferencesAlimentaires.join(', ') || 'Aucune'}`).join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface Menu {
            id: string;
            date: string;
            typeRepas: 'déjeuner' | 'dîner';
            recettes: { id: string; nom: string; ingredients: { nom: string; quantite: number; unite: string }[] }[];
            coutTotalEstime?: number;
            statut: 'planifié' | 'terminé' | 'annulé';
          }\n
          🔧 **Instructions** 🔧\n
          - Inclure entrée, plat principal, dessert.\n
          - Proposer des recettes festives.\n
          - Retourner un objet conforme à l’interface \`Menu\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "menu1",
            "date": "${date}",
            "typeRepas": "dîner",
            "recettes": [{ "id": "rec1", "nom": "Foie gras", "ingredients": [] }],
            "coutTotalEstime": 50,
            "statut": "planifié"
          }\n`,
      });
    },
  },
  {
    id: PromptType.INVENTORY_OPTIMIZATION,
    name: 'Optimisation de l’Inventaire',
    description: 'Suggère des recettes utilisant les ingrédients proches de la péremption.',
    generate: (params: { ingredients: Ingredient[] }) => {
      const { ingredients } = params;
      return JSON.stringify({
        prompt: `📦 **Optimisation de l’Inventaire** 📦\n\n
          Génère des recettes utilisant des ingrédients proches de leur date de péremption pour minimiser le gaspillage. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🥕 **Ingrédients** 🥕\n
          ${ingredients
            .filter((i) => i.perissable && i.datePeremption)
            .map((i) => `- ${i.nom}: ${i.quantite} ${i.unite}, péremption ${i.datePeremption}`)
            .join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Prioriser les ingrédients expirant dans les 3 jours.\n
          - Suggérer au moins 2 recettes.\n
          - Retourner un tableau d’objets conformes à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          [{
            "id": "rec1",
            "nom": "Soupe de légumes",
            "ingredients": [{ "nom": "Carottes", "quantite": 0.5, "unite": "kg" }],
            "instructions": ["Cuire les légumes", "Mixer"],
            "tempsPreparation": 30,
            "portions": 4,
            "categorie": "plat principal",
            "difficulte": "facile"
          }]\n`,
      });
    },
  },
  {
    id: PromptType.INGREDIENT_BASED_RECIPE,
    name: 'Recette à Base d’un Ingrédient',
    description: 'Génère une recette mettant en avant un ingrédient principal.',
    generate: (params: { ingredient: Ingredient; member: MembreFamille }) => {
      const { ingredient, member } = params;
      return JSON.stringify({
        prompt: `🥕 **Recette à Base d’un Ingrédient** 🥕\n\n
          Génère une recette mettant en avant un ingrédient principal, adaptée à un membre. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🌟 **Ingrédient** 🌟\n
          - Nom: ${ingredient.nom}\n
          👤 **Membre** 👤\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Préférences: ${member.preferencesAlimentaires.join(', ')}\n\n
          📋 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Salade de tomates",
            "ingredients": [{ "nom": "Tomates", "quantite": 2, "unite": "g" }],
            "instructions": ["Couper les tomates", "Assaisonner"],
            "tempsPreparation": 2,
            "portions": 2,
            "categorie": "entrée",
            "difficulte": "facile"
          }\n`,
      });
    },
  },
  {
    id: PromptType.BUDGET_MENU,
    name: 'Menu Économique',
    description: 'Génère un menu à faible coût pour la famille.',
    generate: (params: { members: MembreFamille[]; budget: number }) => {
      const { members, budget } = params;
      return JSON.stringify({
        prompt: `💸 **Menu Économique** 💸\n\n
          Génère un menu à faible coût (max ${budget} EUR) pour une journée, adapté à la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Menu\`.\n\n
          👨‍👩‍👧‍👦 **Membres** 👤\n
          ${members.map((m) => `- ${m.prenom} ${m.nom}: ${m.preferencesAlimentaires.join(', ') || 'Aucune'}\n`).join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          {
            id: string;
            date: string;
            typeRepas: 'petit-déjeuner' | 'déjeuner' | 'dîner';
            recettes: [{ id: string; nom: string; ingredients: [] }];
            coutTotalEstime?: number;
            statut: 'planifié' | 'terminé' | 'annulé';
          }\n\n
          🔧 **Instructions** 🔧\n
            - Utiliser des ingrédients peu coûteux.\n
            - Respecter les préférences et restrictions.\n
          - Retourner un objet conforme à l’interface \`Menu\`.\n
          📋 **Exemple** 📊\n
          {
            "id": "menu1",
            "date": "${getCurrentDate()}",
            "typeRepas": "déjeuner",
            "recettes": [{ "id": "rec1", "nom": "Pâtes au pesto", "ingredients": [] }],
            "coutTotalEstime": 10,
            "statut": "planifié"
          }\n`,
      });
    },
  },
  {
    id: PromptType.RECIPE_COMPATIBILITY,
    name: 'Analyse de Compatibilité d’une Recette',
    description: 'Vérifie si une recette est compatible avec les membres de la famille.',
    generate: (params: { recipe: Recette; members: MembreFamille[] }) => {
      const { recipe, members } = params;
      return JSON.stringify({
        prompt: `✅ **Analyse de Compatibilité d’une Recette** ✅\n\n
          Vérifie si une recette est compatible avec les préférences et restrictions des membres de la famille. La réponse doit être au format JSON strict.\n\n
          🍴 **Recette** 🍴\n
          - Nom: ${recipe.nom}\n
          - Ingrédients: ${recipe.ingredients.map((i) => i.nom).join(', ')}\n\n
          👨‍👩‍👧‍👦 **Membres** 👨‍👩‍👧‍👦\n
          ${members
            .map(
              (m) =>
                `- ${m.prenom} ${m.nom}: ${m.allergies.join(', ') || 'Aucune'}, ${m.preferencesAlimentaires.join(', ') || 'Aucune'}\n`
            )
            .join('\n')}
          \n📋 **Sortie** 📋\n
          {
            "recipeId": string,
            "compatibilite": { [membreId: string]: 'adapté' | 'non adapté' | 'modifié' }
          }\n
          🔧 **Instructions** 🔧\n
          - Identifier les conflits (allergies, restrictions).\n
          - Suggérer des modifications si nécessaire.\n
          - Retourner un objet avec les détails de compatibilité.\n
          📊 **Exemple** 📊\n
          {
            "recipeId": "${recipe.id}",
            "compatibilite": { "membre1": "adapté", "membre2": "modifié" }
          }\n`,
      });
    },
  },
  {
    id: PromptType.SPECIFIC_DIET_RECIPE,
    name: 'Recette pour Régime Spécifique',
    description: 'Génère une recette pour un régime alimentaire spécifique (ex. sans gluten).',
    generate: (params: { member: MembreFamille; diet: string }) => {
      const { member, diet } = params;
      return JSON.stringify({
        prompt: `🌱 **Recette pour Régime Spécifique** 🌱\n\n
          Génère une recette pour un régime alimentaire spécifique (${diet}), adaptée à un membre. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          👤 **Membre** 👤\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Préférences: ${member.preferencesAlimentaires.join(', ') || 'Aucune'}\n
          📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Respecter strictement le régime spécifié.\n
          - Inclure des ingrédients adaptés.\n
          - Retourner un objet conforme à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Pain sans gluten",
            "ingredients": [{ "nom": "Farine de riz", "quantite": 200, "unite": "g" }],
            "instructions": ["Mélanger la farine", "Cuire 30 min"],
            "tempsPreparation": 15,
            "portions": 4,
            "categorie": "petit-déjeuner",
            "difficulte": "moyen"
          }\n`,
      });
    },
  },
  {
    id: PromptType.BALANCED_DAILY_MENU,
    name: 'Menu Équilibré pour la Journée',
    description: 'Génère un menu équilibré pour une journée, adapté à un membre.',
    generate: (params: { member: MembreFamille; date: string }) => {
      const { member, date } = params;
      return JSON.stringify({
        prompt: `⚖️ **Menu Équilibré pour la Journée** ⚖️\n\n
          Génère un menu équilibré pour une journée (${date}), adapté aux besoins nutritionnels d’un membre. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Menu\`.\n\n
          👤 **Membre** 👤\n
          - Nom: ${member.prenom} ${member.nom}\n
          - Calories cible: ${member.aiPreferences.apportCaloriqueCible ? member.aiPreferences.apportCaloriqueCible : []} kcal\n
          📋 **Interface TypeScript** 📋\n
          interface Menu {
            id: string;
            date: string;
            typeRepas: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
            recettes: { id: string; nom: string; ingredients: [{ nom: string; quantite: number; unite: string }] };
            coutTotalEstime?: number;
            statut?: string | 'planifié' || 'terminé' || 'annulé';
          }\n
          🔧 **Instructions** 🔧\n
          - Inclure 4 repas équilibrés.\n
          - Respecter l’apport calorique cible.\n
          - Retourner un tableau d’objets conformes à l’interface \`Menu\`.\n
          📊 **Exemple** 📊\n
          [{
            "id": "menu1",
            "date": "${date}",
            "typeRepas": "petit-déjeuner",
            "recettes": [{ "id": "rec1", "nom": "Yaourt aux fruits", "ingredients": [] }],
            "coutTotalEstime": 5,
            "statut": "planifié"
          }]\n`,
      });
    },
  },
  {
    id: PromptType.RECIPE_FROM_IMAGE,
    name: 'Recette à Partir d’une Photo',
    description: 'Génère une recette basée sur une photo d’ingrédients ou d’un plat.',
    generate: (params: { imageUri: string; member: MembreFamille }) => {
      const { imageUri, member } = params;
      return JSON.stringify({
        prompt: `📸 **Recette à Partir d’une Photo** 📸\n\n
          Génère une recette basée sur une photo d’ingrédients ou d’un plat, adaptée à un membre. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🌟 **Photo** 🌟\n
          - URI: ${imageUri}\n
          👤 **Membre** 👤\n
          - Nom: ${member.prenom} ${member.nom}\n
          📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Identifier les ingrédients visibles dans la photo.\n
          - Proposer une recette utilisant ces ingrédients.\n
          - Respecter les préférences et restrictions du membre.\n
          - Retourner un objet conforme à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Salade mixte",
            "ingredients": [{ "nom": "Laitue", "quantite": 100, "unite": "g" }],
            "instructions": ["Laver la laitue", "Assaisonner"],
            "tempsPreparation": 10,
            "portions": 2,
            "categorie": "entrée",
            "difficulte": "facile"
          }\n`,
      });
    },
  },
  {
    id: PromptType.LEFTOVER_RECIPE,
    name: 'Recette avec Restes',
    description: 'Génère une recette utilisant des restes alimentaires.',
    generate: (params: { ingredients: Ingredient[] }) => {
      const { ingredients } = params;
      return JSON.stringify({
        prompt: `🍲 **Recette avec Restes** 🍲\n\n
          Génère une recette utilisant des restes alimentaires disponibles. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          🥕 **Restes** 🍕\n
          ${ingredients.map((i) => `- ${i.nom}: ${i.quantite} ${i.unite}\n`).join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: string[];
            instructions: [{ nom: string; quantite: number; unite: unit: string }];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' || 'entrée' || 'dessert' || 'apéritif' || 'boisson';
            difficulte: 'facile' || 'moyen' || 'difficile';
          }\n
          📋 **Instructions** 🔧\n
            - Utiliser uniquement les ressources fournies.\n
            - Proposer une recette créative.\n
          - Retourner un objet conforme à l’état de l’application.\n\n
          📋 **Exercice** 📊\n
          {
            "id": "rec1",
            "nom": "Gratin de restants",
            "ingrédients": ["Pommes de pomme", "quantité": 2, "unité": "g"],
            "instructions": ["Cuir les pommes", "Gratiner"],
            "tempsPréparation": 25,
            "portions": 4,
            "catégorie": "plat principal",
            "difficulté": "moyen"
          }\n`,
      });
    },
  },
  {
    id: PromptType.GUEST_RECIPE,
    name: 'Recette pour Invités',
    description: 'Génère une recette impressionnante pour des invités.',
    generate: (params: { members: MembreFamille[]; guestCount: number }) => {
      const { members, guestCount } = params;
      return JSON.stringify({
        prompt: `🍽️ **Recette pour Invités** 🍽️\n\n
          Génère une recette impressionnante pour ${guestCount} invités, adaptée à la famille. La réponse doit être au format JSON strict, conforme à l’interface TypeScript \`Recette\`.\n\n
          👨‍👩‍👧‍👦 **Membres** 👨‍👩‍👧‍👦\n
          ${members.map((m) => `- ${m.prenom} ${m.nom}: ${m.preferencesAlimentaires.join(', ') || 'Aucune'}\n`).join('\n')}
          \n📋 **Interface TypeScript** 📋\n
          interface Recette {
            id: string;
            nom: string;
            ingredients: { nom: string; quantite: number; unite: string }[];
            instructions: string[];
            tempsPreparation: number;
            portions: number;
            categorie: 'plat principal' | 'entrée' | 'dessert' | 'apéritif' | 'boisson';
            difficulte: 'facile' | 'moyen' | 'difficile';
          }\n
          🔧 **Instructions** 🔧\n
          - Créer une recette élégante et savoureuse.\n
          - Ajuster les portions pour le nombre d’invités.\n
          - Retourner un objet conforme à l’interface \`Recette\`.\n
          📊 **Exemple** 📊\n
          {
            "id": "rec1",
            "nom": "Filet mignon en croûte",
            "ingredients": [{ "nom": "Filet mignon", "quantite": 1, "unite": "kg" }],
            "instructions": ["Préparer la pâte", "Envelopper la viande"],
            "tempsPreparation": 45,
            "portions": ${guestCount},
            "categorie": "plat principal",
            "difficulte": "moyen"
          }\n`,
      });
    },
  },
  {
    id: PromptType.FOOD_TREND_ANALYSIS,
    name: 'Analyse de Tendances Alimentaires',
    description: 'Analyse les préférences alimentaires de la famille pour identifier des tendances.',
    generate: (params: { members: MembreFamille[] }) => {
      const { members } = params;
      return JSON.stringify({
        prompt: `📊 **Analyse de Tendances Alimentaires** 📊\n\n
          Analyse les préférences alimentaires des membres de la famille pour identifier des tendances et suggérer des améliorations. La réponse doit être au format JSON strict.\n\n
          👨‍👩‍👧‍👦 **Membres** 👨‍👩‍👧‍👦\n
          ${members
            .map(
              (m) =>
                `- ${m.prenom} ${m.nom}: ${m.preferencesAlimentaires.join(', ') || 'Aucune'}, ${m.aiPreferences.cuisinesPreferees.join(
                  ', '
                ) || 'Aucune'}\n`
            )
            .join('\n')}
          \n📋 **Sortie** 📋\n
          {
            "tendances": string[],
            "suggestions": string[]
          }\n
          🔧 **Instructions** 🔧\n
          - Identifier les cuisines ou régimes populaires.\n
          - Proposer des recettes ou menus basés sur ces tendances.\n
          - Retourner un objet avec les tendances et suggestions.\n
          📊 **Exemple** 📊\n
          {
            "tendances": ["Végétarien", "Asiatique"],
            "suggestions": ["Essayer un curry végane", "Ajouter des plats thaï"]
          }\n`,
      });
    },
  },
  {
    id: PromptType.INGREDIENT_AVAILABILITY,
    name: 'Vérification de Disponibilité d’un Ingrédient',
    description: 'Vérifie la disponibilité d’un ingrédient dans les magasins à proximité.',
    generate: (params: { ingredient: string; latitude: number; longitude: number }) => {
      const { ingredient, latitude, longitude } = params;
      return JSON.stringify({
        prompt: `🏬 **Vérification de Disponibilité d’un Ingrédient** 🏬\n\n
          Vérifiez la disponibilité de "${ingredient}" près de latitude ${latitude}, longitude ${longitude}. Utilisez l'outil findStoresWithIngredient. Répondez avec un message textuel et un tableau de magasins.\n\n
          📋 **Sortie** 📋\n
          {
            "message": string,
            "stores": { name: string; distance: string; inStock: boolean; price?: number; address: string }[]
          }\n
          🔧 **Instructions** 🔧\n
          - Utiliser l’outil findStoresWithIngredient pour obtenir les données.\n
          - Trier les magasins par distance et disponibilité.\n
          - Retourner un objet avec un message et un tableau de magasins.\n
          📊 **Exemple** 📊\n
          {
            "message": "Ingrédient trouvé dans 2 magasins.",
            "stores": [
              { "name": "Supermarché X", "distance": "1.2 km", "inStock": true, "price": 2.5, "address": "123 Rue Exemple" }
            ]
          }\n`,
      });
    },
  },
  {
    id: PromptType.NUTRITIONAL_INFO,
    name: 'Informations Nutritionnelles',
    description: 'Fournit des informations nutritionnelles pour un aliment ou une recette.',
    generate: (params: { query: string }) => {
      const { query } = params;
      return JSON.stringify({
        prompt: `🔬 **Informations Nutritionnelles** 🔬\n\n
          Fournissez des informations nutritionnelles pour "${query}" (calories, protéines, glucides, lipides, fibres). Répondez en JSON strict.\n\n
          📋 **Sortie** 📋\n
          {
            "aliment": string,
            "calories": number,
            "nutrients": { name: string; value: number; unit: string }[]
          }\n
          🔧 **Instructions** 🔧\n
          - Fournir des données précises basées sur des standards nutritionnels.\n
          - Retourner un objet avec les détails nutritionnels.\n
          📊 **Exemple** 📊\n
          {
            "aliment": "${query}",
            "calories": 18,
            "nutrients": [
              { "name": "Protéines", "value": 0.9, "unit": "g" },
              { "name": "Glucides", "value": 3.9, "unit": "g" }
            ]
          }\n`,
      });
    },
  },
  {
    id: PromptType.TROUBLESHOOT_PROBLEM,
    name: 'Résolution de Problème Culinaire',
    description: 'Résout un problème culinaire ou domestique.',
    generate: (params: { problem: string }) => {
      const { problem } = params;
      return JSON.stringify({
        prompt: `🛠️ **Résolution de Problème Culinaire** 🛠️\n\n
          Résolvez le problème : "${problem}". Proposez une solution claire avec des étapes. Répondez en texte.\n\n
          🔧 **Instructions** 🔧\n
          - Fournir une solution détaillée et pratique.\n
          - Retourner une chaîne de texte avec les étapes.\n
          📊 **Exemple** 📊\n
          "1. Vérifiez la température du four.\n2. Ajustez à 180°C.\n3. Poursuivez la cuisson 10 minutes."\n`,
      });
    },
  },
  {
    id: PromptType.CREATIVE_IDEAS,
    name: 'Idées Créatives',
    description: 'Génère des idées créatives pour un contexte donné.',
    generate: (params: { context: string }) => {
      const { context } = params;
      return JSON.stringify({
        prompt: `💡 **Idées Créatives** 💡\n\n
          Générez 5 idées créatives pour : "${context}". Présentez-les sous forme de liste numérotée. Répondez en texte.\n\n
          🔧 **Instructions** 🔧\n
          - Proposer des idées originales et réalisables.\n
          - Retourner une chaîne de texte avec une liste numérotée.\n
          📊 **Exemple** 📊\n
          "1. Organiser un dîner à thème.\n2. Créer un dessert coloré.\n3. Utiliser des herbes fraîches.\n4. Préparer un buffet.\n5. Décorer avec des fleurs comestibles."\n`,
      });
    },
  },
];
