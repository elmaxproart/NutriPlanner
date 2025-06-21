import { Recette, Menu, ListeCourses, Budget, Ingredient, Store, RecipeAnalysisContent, MenuSuggestionContent, ShoppingListSuggestionContent } from '../constants/entities';

interface FormattedResult {
  text: string;
}

export const formatRecipeToText = (recipe: Recette): FormattedResult => {
  if (!recipe || !recipe.nom) {
    return { text: '[ICON_ERROR] Erreur : Aucune recette valide fournie.' };
  }

  const ingredientsText = recipe.ingredients?.map(i => `- ${i.nom}: ${i.quantite} ${i.unite}`).join('\n') || 'Aucun ingrédient spécifié.';
  const instructionsText = recipe.etapesPreparation?.map(step => `${step.ordre}. ${step.texte}`).join('\n') || 'Aucune instruction fournie.';
  const variantsText = recipe.variantes?.map(v => `- ${v.nom}: ${v.modifications}`).join('\n') || 'Aucune variante spécifiée.';
  const text = `
[ICON_RECIPE] Recette : ${recipe.nom}
[ICON_CATEGORY] Catégorie : ${recipe.categorie}
[ICON_INGREDIENTS] Ingrédients :
${ingredientsText}
[ICON_INSTRUCTIONS] Instructions :
${instructionsText}
${recipe.tempsPreparation ? `[ICON_TIME] Temps de préparation : ${recipe.tempsPreparation} minutes` : ''}
${recipe.tempsCuisson ? `[ICON_COOKING_TIME] Temps de cuisson : ${recipe.tempsCuisson} minutes` : ''}
${recipe.portions ? `[ICON_PORTIONS] Portions : ${recipe.portions}` : ''}
${recipe.difficulte ? `[ICON_DIFFICULTY] Difficulté : ${recipe.difficulte}` : ''}
${recipe.coutEstime ? `[ICON_COST] Coût estimé : ${recipe.coutEstime} FCFA` : ''}
${recipe.tags?.length ? `[ICON_TAGS] Tags : ${recipe.tags.join(', ')}` : ''}
${recipe.variantes?.length ? `[ICON_VARIANTS] Variantes :\n${variantsText}` : ''}
${recipe.aiAnalysis?.caloriesTotales ? `[ICON_NUTRITION] Calories totales : ${recipe.aiAnalysis.caloriesTotales} kcal` : ''}
  `.trim();

  return { text };
};

export const formatMenuToText = (menu: Menu): FormattedResult => {
  if (!menu || !menu.recettes) {
    return { text: '[ICON_ERROR] Erreur : Aucun menu valide fourni.' };
  }

  const recipesText = menu.recettes?.map(recipe => `- ${recipe.nom}`).join('\n') || 'Aucun repas spécifié.';
  const missingIngredientsText = menu.aiSuggestions?.ingredientsManquants?.map(i => `- ${i.nom}: ${i.quantite} ${i.unite}`).join('\n') || 'Aucun ingrédient manquant.';
  const text = `
[ICON_MENU] Menu : ${menu.date} (${menu.typeRepas})
[ICON_RECIPES] Repas :
${recipesText}
${menu.description ? `[ICON_NOTES] Description : ${menu.description}` : ''}
${menu.coutTotalEstime ? `[ICON_COST] Coût estimé : ${menu.coutTotalEstime} FCFA` : ''}
${menu.coutReel ? `[ICON_COST_REAL] Coût réel : ${menu.coutReel} FCFA` : ''}
${menu.statut ? `[ICON_STATUS] Statut : ${menu.statut}` : ''}
${menu.aiSuggestions?.ingredientsManquants?.length ? `[ICON_MISSING] Ingrédients manquants :\n${missingIngredientsText}` : ''}
${menu.feedback?.length ? `[ICON_FEEDBACK] Feedback : ${menu.feedback.map(f => `${f.commentaire} (${f.note}/5)`).join(', ')}` : ''}
  `.trim();

  return { text };
};

export const formatShoppingListToText = (shoppingList: ListeCourses): FormattedResult => {
  if (!shoppingList || !shoppingList.items) {
    return { text: '[ICON_ERROR] Erreur : Aucune liste de courses valide fournie.' };
  }

const itemsText = shoppingList.items.map(item => {
    const boughtStatus = item.stockActuel > 0 ? '[ICON_CHECKED]' : '[ICON_UNCHECKED]';
    const nutrition =
        item.valeurNutritionnelle
            ? `(Calories: ${item.valeurNutritionnelle.calories} kcal, Prot.: ${item.valeurNutritionnelle.proteines}g, Gluc.: ${item.valeurNutritionnelle.glucides}g, Lip.: ${item.valeurNutritionnelle.lipides}g${item.valeurNutritionnelle.fibres !== undefined ? `, Fibres: ${item.valeurNutritionnelle.fibres}g` : ''})`
            : '';
    return `${boughtStatus} ${item.nom}: ${item.quantite} ${item.unite} ${nutrition}`;
}).join('\n');

const text = `
[ICON_SHOPPING_LIST] Liste de Courses : ${shoppingList.nom}
[ICON_ITEMS] Articles :
${itemsText}
${shoppingList.budgetEstime ? `[ICON_COST] Budget estimé : ${shoppingList.budgetEstime} FCFA` : ''}
${shoppingList.budgetReel ? `[ICON_COST_REAL] Budget réel : ${shoppingList.budgetReel} FCFA` : ''}
${shoppingList.statut ? `[ICON_STATUS] Statut : ${shoppingList.statut}` : ''}
${shoppingList.notes ? `[ICON_NOTES] Notes : ${shoppingList.notes}` : ''}
`.trim();

  return { text };
};

export const formatBudgetToText = (budget: Budget): FormattedResult => {
  if (!budget || !budget.depenses) {
    return { text: '[ICON_ERROR] Erreur : Aucun plan budgétaire fourni.' };
  }

  const expensesText = budget.depenses.map(expense => `- ${expense.description}: ${expense.montant} ${budget.devise} (${expense.categorie})`).join('\n');
  const totalSpent = budget.depenses.reduce((sum, expense) => sum + expense.montant, 0);
  const alertsText = budget.alertes?.map(a => `- ${a.message} (${a.seuil}%)`).join('\n') || 'Aucune alerte.';
  const text = `
[ICON_BUDGET] Budget : ${budget.mois}
[ICON_EXPENSES] Dépenses :
${expensesText}
[ICON_TOTAL] Total dépensé : ${totalSpent} ${budget.devise}
[ICON_CEILING] Plafond : ${budget.plafond} ${budget.devise}
${budget.alertes?.length ? `[ICON_ALERT] Alertes :\n${alertsText}` : ''}
  `.trim();

  return { text };
};

export const formatIngredientAvailabilityToText = (ingredient: Ingredient, stores: Store[]): FormattedResult => {
  if (!ingredient || !stores || stores.length === 0) {
    return { text: '[ICON_ERROR] Erreur : Aucune information de disponibilité fournie.' };
  }

  const storesText = stores.map(store => {
    const item = store.articles.find(a => a.nom === ingredient.nom);
    return `- ${store.nom}: ${item ? `${item.prixUnitaire} 'FCFA', ${item.stockDisponible} ${item.unite} en stock` : 'Non disponible'} ${store.localisation ? `(${store.localisation.adresse})` : ''}`;
  }).join('\n');

  const text = `
[ICON_INGREDIENT] Ingrédient : ${ingredient.nom}
[ICON_STORES] Disponibilité :
${storesText}
${ingredient.datePeremption ? `[ICON_EXPIRY] Date de péremption : ${ingredient.datePeremption}` : ''}
${ingredient.stockActuel ? `[ICON_STOCK] Stock actuel : ${ingredient.stockActuel} ${ingredient.unite}` : ''}
${ingredient.valeurNutritionnelle?.calories ? `[ICON_NUTRITION] Calories : ${ingredient.valeurNutritionnelle.calories} kcal/100g` : ''}
  `.trim();

  return { text };
};

export const formatRecipeAnalysisToText = (analysis: RecipeAnalysisContent['analysis']): FormattedResult => {
  if (!analysis) {
    return { text: '[ICON_ERROR] Erreur : Aucune analyse de recette fournie.' };
  }

  const nutrientsText = analysis.nutrients?.map(n => `- ${n.name}: ${n.value} ${n.unit}`).join('\n') || 'Aucune information nutritionnelle.';
  const text = `
[ICON_ANALYSIS] Analyse de Recette
[ICON_CALORIES] Calories : ${analysis.calories} kcal
[ICON_NUTRIENTS] Nutriments :
${nutrientsText}
${analysis.dietaryFit ? `[ICON_DIET] Adapté pour : ${analysis.dietaryFit}` : ''}
  `.trim();

  return { text };
};

export const formatMenuSuggestionToText = (suggestion: MenuSuggestionContent): FormattedResult => {
  if (!suggestion || !suggestion.menu) {
    return { text: '[ICON_ERROR] Erreur : Aucune suggestion de menu fournie.' };
  }

  const recipesText = suggestion.recipes?.map(r => `- ${r.nom}`).join('\n') || 'Aucune recette spécifiée.';
  const text = `
[ICON_MENU_SUGGESTION] Suggestion de Menu
[ICON_DESCRIPTION] Description : ${suggestion.description}
[ICON_RECIPES] Recettes proposées :
${recipesText}
[ICON_DATE] Date : ${suggestion.menu.date}
[ICON_MEAL_TYPE] Type de repas : ${suggestion.menu.typeRepas}
  `.trim();

  return { text };
};

export const formatShoppingListSuggestionToText = (suggestion: ShoppingListSuggestionContent): FormattedResult => {
  if (!suggestion || !suggestion.items) {
    return { text: '[ICON_ERROR] Erreur : Aucune suggestion de liste de courses fournie.' };
  }

  const itemsText = suggestion.items.map(item => `- ${item.name}: ${item.quantity} ${item.unit} ${item.magasins ? `(Magasin: ${item.magasins})` : ''}`).join('\n');
  const text = `
[ICON_SHOPPING_LIST_SUGGESTION] Suggestion de Liste de Courses
[ICON_ITEMS] Articles :
${itemsText}
  `.trim();

  return { text };
};

