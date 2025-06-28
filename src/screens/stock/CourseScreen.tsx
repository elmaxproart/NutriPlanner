import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Ingredient} from '../AddMenuPage';
import AntDesign from 'react-native-vector-icons/AntDesign';

type CourseByPlat = {
  platName: string;
  forFamilyPrice: number;
  ingredients: Ingredient[];
  date: string;
};

const CourseScreen: React.FC = () => {
  const [groupedCourses, setGroupedCourses] = useState<CourseByPlat[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<Ingredient[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('stock')
      .orderBy('ingredientName')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Ingredient),
          }));
          setStock(data);
        },
        err => {
          console.error('Erreur Firestore recupereation faild:', err);
        },
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        const user = auth().currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const snapshot = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('courses')
          .get();

        const allCourses: CourseByPlat[] = [];
        let total = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const plats = data?.plats || [];
          const date = data?.date || 'Date inconnue';

          plats.forEach((plat: any) => {
            const platName = plat.foodName || 'Plat inconnu';
            const forFamilyPrice = Number(plat.forFamilyPrice) || 0;
            const ingredients = plat.foodIngredients || [];

            allCourses.push({
              platName,
              forFamilyPrice,
              ingredients,
              date,
            });

            total += forFamilyPrice;
          });
        });

        setGroupedCourses(allCourses);
        setTotalPrice(total);
      } catch (error) {
        console.error('Erreur récupération des courses utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCourses();
  }, []);

  const filteredCourses = groupedCourses.filter(plat => {
    try {
      return plat.platName.toLowerCase().includes(searchText.toLowerCase());
    } catch (err) {
      console.warn('Erreur lors du filtrage:', err);
      return false;
    }
  });

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={{padding: 16}}>
      <TextInput
        placeholder="Rechercher un plat..."
        placeholderTextColor={isDark ? '#aaa' : '#666'}
        style={[styles.searchBar, isDark && styles.darkInput]}
        value={searchText}
        onChangeText={setSearchText}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={[styles.text, isDark && styles.darkText]}>
            Chargement…
          </Text>
        </View>
      ) : filteredCourses.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            Aucune course trouvée.
          </Text>
        </View>
      ) : (
        <>
          {filteredCourses.map((plat, index) => (
            <View
              key={index}
              style={[
                styles.cardContainer,
                isDark ? styles.cardDark : styles.cardLight,
              ]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, isDark && styles.textWhite]}>
                  {plat.platName}
                </Text>
                <Text style={[styles.badge, isDark && styles.badgeDark]}>
                  {plat.forFamilyPrice.toFixed(2)} FCFA
                </Text>
              </View>

              <View style={styles.cardMeta}>
                <AntDesign
                  name="calendar-today"
                  size={16}
                  color={isDark ? '#fff' : '#555'}
                />
                <Text style={[styles.metaText, isDark && styles.textWhite]}>
                  Prévu pour le : {plat.date}
                </Text>
              </View>

              <View style={styles.ingredientList}>
                {plat.ingredients.map((ing, idx) => {
                  const stockItem = stock.find(
                    item => item.ingredientName.toLowerCase() === ing.ingredientName.toLowerCase(),
                  );
                  const isInStock = stockItem && Number(stockItem.quantity) >= Number(ing.quantity);

                  return (
                    <View key={idx} style={styles.ingredientItem}>
                      {ing.ingredientImage ? (
                        <Image
                          source={{uri: ing.ingredientImage}}
                          style={styles.ingredientImage}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <AntDesign name="picture" size={20} color="#ccc" />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.ingredientText,
                          isDark && styles.textWhite,
                          isInStock && {textDecorationLine: 'line-through', color: '#aaa'},
                        ]}>
                        {isInStock ? 'Déjà en stock ' : ''}
                        {ing.ingredientName} — {Number(ing.quantity)} {ing.unite} — {Number(ing.price).toFixed(2)} FCFA
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          <View
            style={[
              styles.totalBox,
              isDark ? styles.cardDark : styles.cardLight,
            ]}>
            <AntDesign name="wallet" size={18} color="#FFD700" />
            <Text style={[styles.totalText, isDark && styles.textWhite]}>
              Total général : {totalPrice.toFixed(2)} FCFA
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  ingredientImage: {
  width: 32,
  height: 32,
  borderRadius: 6,
  marginRight: 8,
  backgroundColor: '#eee',
},
imagePlaceholder: {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: '#eee',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 8,
},
  
  cardContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardLight: {
    backgroundColor: '#fff',
  },

  cardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  badge: {
    backgroundColor: '#FFA500',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
  },

  badgeDark: {
    backgroundColor: '#333',
    color: '#FFD700',
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#555',
  },

  ingredientList: {
    marginTop: 12,
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },

  ingredientText: {
    marginLeft: 6,
    fontSize: 14,
    flexShrink: 1,
  },

  totalBox: {
    padding: 14,
    marginTop: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  textWhite: {
    color: '#fff',
  },

  meta: {
    fontSize: 14,
    marginBottom: 4,
    color: '#888',
  },

  summaryCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },

  summaryText: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  darkContainer: {
    backgroundColor: '#121212',
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
  },
  item: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  darkItem: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000000',
  },
  text: {
    fontSize: 14,
    color: '#333333',
  },
  darkText: {
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666666',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
});

export default CourseScreen;
