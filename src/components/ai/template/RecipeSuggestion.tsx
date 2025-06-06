import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as geminiStyles } from '../../../styles/geminiStyle';
import { Card } from '../../common/Card';
import { Ingredient, Recette } from '../../../constants/entities';


interface RecipeSuggestionProps {
  recipes: Recette[];
  onSelectRecipe?: (recipe: Recette) => void;
}

const RecipeSuggestion = ({ recipes, onSelectRecipe }: RecipeSuggestionProps) => {
  // Style local pour l'image de la carte si geminiStyles.cardImage n'existe pas
  const cardImageStyle = {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  };

  return (
    <View style={[geminiStyles.suggestionCard, localStyles.container]}>
      <View style={localStyles.header}>
        <Icon name="chef-hat" size={24} color="#2980b9" style={localStyles.headerIcon} />
        <Text style={[geminiStyles.messageText, localStyles.headerText]}>
          Voici vos suggestions de recettes :
        </Text>
      </View>
      {recipes.length > 0 ? (
        recipes.map((recipe, index) => (
          <Card key={recipe.id || index} title={recipe.nom} style={localStyles.card}>
            <View style={localStyles.content}>
              {recipe.imageUrl ? (
                <Image
                  source={{ uri: recipe.imageUrl }}
                  style={geminiStyles.cardImage || cardImageStyle}
                  resizeMode="cover"
                />
              ) : (
                <View style={localStyles.placeholderImage}>
                  <Icon name="image-off" size={40} color="#b0b0b0" />
                </View>
              )}
              <Text style={localStyles.cardDescription}>
                {recipe.instructions.substring(0, 100)}...
              </Text>
              <View style={localStyles.infoContainer}>
                {recipe.tempsPreparation && (
                  <View style={localStyles.infoItem}>
                    <Icon name="clock" size={14} color="#666" />
                    <Text style={localStyles.infoText}>
                      {recipe.tempsPreparation} min
                    </Text>
                  </View>
                )}
                {recipe.portions && (
                  <View style={localStyles.infoItem}>
                    <Icon name="account-group" size={14} color="#666" />
                    <Text style={localStyles.infoText}>
                      {recipe.portions} pers.
                    </Text>
                  </View>
                )}
                {recipe.difficulte && (
                  <View style={localStyles.infoItem}>
                    <Icon name="star" size={14} color="#666" />
                    <Text style={localStyles.infoText}>
                      {recipe.difficulte}
                    </Text>
                  </View>
                )}
              </View>
              {recipe.ingredients.length > 0 && (
                <View style={localStyles.ingredientsContainer}>
                  <Text style={localStyles.sectionTitle}>
                    Ingrédients :
                  </Text>
                  {recipe.ingredients.slice(0, 3).map((ingredient: Ingredient, idx: number) => (
                    <View key={idx} style={localStyles.ingredientItem}>
                      <Icon name="basket" size={14} color="#b0b0b0" style={localStyles.ingredientIcon} />
                      <Text style={localStyles.ingredientText}>
                        {ingredient.nom} - {ingredient.quantite} {ingredient.unite}
                      </Text>
                    </View>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <Text style={localStyles.moreText}>
                      +{recipe.ingredients.length - 3} autres...
                    </Text>
                  )}
                </View>
              )}
              {onSelectRecipe && (
                <TouchableOpacity
                  onPress={() => onSelectRecipe(recipe)}
                  style={localStyles.actionButton}
                >
                  <Icon name="book-open-page-variant" size={20} color="#2980b9" />
                  <Text style={localStyles.actionText}>Voir la recette</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      ) : (
        <View style={localStyles.emptyContainer}>
          <Icon name="recipe" size={40} color="#b0b0b0" />
          <Text style={localStyles.emptyText}>Aucune recette suggérée</Text>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  content: {
    marginTop: 8,
  },
  cardDescription: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#2a2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  ingredientsContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ingredientIcon: {
    marginRight: 6,
  },
  ingredientText: {
    color: '#ffffff',
    fontSize: 14,
  },
  moreText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  actionText: {
    color: '#2980b9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginTop: 10,
  },
});

export default RecipeSuggestion;
