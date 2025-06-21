import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMenus } from '../hooks/useMenus';
import { useAuth } from '../hooks/useAuth';
import { Menu } from '../constants/entities';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ModalComponent } from '../components/common/Modal';
import { formatDate } from '../utils/helpers';


type MenuDetailScreenParams = {
  menuId: string;
};

// Typage pour la navigation
type MenuDetailScreenNavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

// Ajout des types pour le hook useMenus
interface UseMenusReturn {
  loading: boolean;
  error: string | null;
  fetchMenus: () => Promise<void>;
  addMenu: (menu: Omit<Menu, 'id' | 'dateCreation' | 'dateMiseAJour'>) => Promise<void>;
  estimateMenuCost: (menu: Menu) => Promise<number>;
  optimizeMenu: (menu: Menu, familyMembers: any[]) => Promise<Menu>;
  getMenuById: (menuId: string) => Promise<Menu | null>;
  updateMenu: (menuId: string, updatedMenu: Partial<Menu>) => Promise<void>;
  deleteMenu: (menuId: string) => Promise<void>;
}



const MenuDetailScreen: React.FC<{
  navigation: MenuDetailScreenNavigationProp;
  route: { params: MenuDetailScreenParams };
}> = ({ navigation, route }) => {
  const { userId, loading: authLoading } = useAuth();
  const { loading: menusLoading, error: menusError, getMenuById, updateMenu, deleteMenu } = useMenus(

  ) as unknown as UseMenusReturn;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { menuId } = route.params;

  // Charger les détails du menu
  const fetchMenuDetails = useCallback(async () => {
    if (!menuId || !userId) {
      return;
    }
    setIsLoading(true);
    try {
      const fetchedMenu = await getMenuById(menuId);
      if (fetchedMenu) {
        setMenu(fetchedMenu);
      } else {
        throw new Error('Menu non trouvé');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger le menu');
    } finally {
      setIsLoading(false);
    }
  }, [menuId, userId, getMenuById]);

  useEffect(() => {
    fetchMenuDetails();
  }, [fetchMenuDetails]);

  // Gérer l'ajout d'un commentaire
  const handleAddComment = useCallback(async () => {
    if (!menu || !comment.trim()) {
      return;
    }
    const updatedFeedback = [
      ...(menu.feedback || []),
      { userId: userId || '', note: 0, commentaire: comment , date: formatDate(new Date()) },
    ];
    const updatedMenu = { ...menu, feedback: updatedFeedback };
    try {
      await updateMenu(menu.id, updatedMenu);
      setMenu(updatedMenu);
      setComment('');
      setIsModalVisible(false);
      Alert.alert('Succès', 'Commentaire ajouté');
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'ajout du commentaire");
    }
  }, [menu, comment, userId, updateMenu]);

  // Gérer la suppression du menu
  const handleDelete = useCallback(async () => {
    if (!menuId) {
      return;
    }
    Alert.alert(
      'Confirmer la suppression',
      'Voulez-vous vraiment supprimer ce menu ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await deleteMenu(menuId);
              Alert.alert('Succès', 'Menu supprimé avec succès');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erreur', 'Échec de la suppression du menu');
            }
          },
        },
      ]
    );
  }, [menuId, deleteMenu, navigation]);

  // Gérer la navigation vers l'édition
  const handleEdit = useCallback(() => {
    if (menuId) {
      navigation.navigate('EditScreen', { menuId });
    }
  }, [menuId, navigation]);

  // Gérer la navigation vers les détails d'une recette
  const handleRecipePress = useCallback(
    (recipeId: string) => {
      navigation.navigate('RecipeDetailScreen', { recipeId });
    },
    [navigation]
  );

  // Memoized rendering of recipes
  const renderRecipeItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity style={styles.recipeItem} onPress={() => handleRecipePress(item)}>
        <Text style={styles.recipeText}>Recette {item}</Text>
      </TouchableOpacity>
    ),
    [handleRecipePress]
  );

  // Memoized menu data to prevent unnecessary re-renders
  const displayedMenu = useMemo(() => menu, [menu]);

  if (authLoading || menusLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (menusError || !displayedMenu) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Erreur lors du chargement du menu</Text>
        <Button title="Retour" onPress={() => navigation.goBack()} style={styles.backButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Bouton de retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Détails du menu */}
      <Card title={displayedMenu.foodName || 'Sans nom'} style={styles.card}>

          <Image source={displayedMenu.image} style={styles.menuImage} />
        <Text style={styles.detailText}>
          Date : {new Date(displayedMenu.date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>Type de repas : {displayedMenu.typeRepas || 'Non spécifié'}</Text>
        <Text style={styles.detailText}>
          Coût estimé : ${(displayedMenu.coutTotalEstime || 0).toFixed(2)}
        </Text>
        <Text style={styles.description}>
          {displayedMenu.description || 'Aucune description'}
        </Text>
        <Text style={styles.status}>Statut : {displayedMenu.statut || 'Non défini'}</Text>

        {/* Liste des recettes */}
        {displayedMenu.recettes && displayedMenu.recettes.length > 0 && (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>Recettes Associées</Text>
            <FlatList
              data={displayedMenu.recettes.map((recette: any) => recette.id)}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Commentaires */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.sectionTitle}>Commentaires</Text>
          {displayedMenu.feedback && displayedMenu.feedback.length > 0 ? (
            displayedMenu.feedback.map((fb, index) => (
              <Text key={index} style={styles.feedbackText}>
                {fb.commentaire} (par {fb.userId}, le{' '}
                {fb.date ? new Date(fb.date).toLocaleDateString() : 'Date inconnue'})
              </Text>
            ))
          ) : (
            <Text style={styles.feedbackText}>Aucun commentaire</Text>
          )}
        </View>
      </Card>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <Button title="Modifier" onPress={handleEdit} style={styles.actionButton} />
        <Button
          title="Supprimer"
          onPress={handleDelete}
          style={[styles.actionButton, styles.deleteButton]}
        />
        <Button
          title="Ajouter un Commentaire"
          onPress={() => setIsModalVisible(true)}
          style={styles.actionButton}
        />
      </View>

      {/* Modal pour ajouter un commentaire */}
      <ModalComponent visible={isModalVisible} onClose={() => setIsModalVisible(false)} title="Ajouter un commentaire">
        <View style={styles.modalContent}>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Entrez votre commentaire"
            placeholderTextColor="#666"
            multiline
          />
          <Button title="Envoyer" onPress={handleAddComment} style={styles.modalButton} />
        </View>
      </ModalComponent>
    </SafeAreaView>
  );
};

export default React.memo(MenuDetailScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 50,
    alignItems: 'center',
  },
  menuImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailText: {
    color: '#ddd',
    fontSize: 18,
    marginBottom: 6,
  },
  description: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  status: {
    color: '#FF6B00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  recipesContainer: {
    marginTop: 16,
    width: '100%',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeItem: {
    backgroundColor: '#2e2e2e',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  recipeText: {
    color: '#fff',
    fontSize: 16,
  },
  feedbackContainer: {
    marginTop: 16,
    width: '100%',
  },
  feedbackText: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    marginVertical: 5,
  },
  deleteButton: {
    backgroundColor: '#FF3D00',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  commentInput: {
    width: '100%',
    height: 100,
    backgroundColor: '#2e2e2e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    color: '#FF3D00',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
  },
});
