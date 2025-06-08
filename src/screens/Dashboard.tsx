import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { width } from '../styles/DashbordStyle';
import { useAuth } from '../hooks/useAuth';
import { useMenus } from '../hooks/useMenus';
//import { useAIConversation } from '../hooks/useAIConversation';
import { useFamilyData } from '../hooks/useFamilyData';
import { Menu} from '../constants/entities'; // Import Menu and MealType
import { MealType } from '../constants/categories';

const radius = 80; // rayon du cercle

const sliderImages = [
  {
    image: require('../assets/images/Le-met-de-pistache1.jpg'),
    title: 'Pistach Delight',
    description: 'Savourez la tradition en une bouchée',
  },
  {
    image: require('../assets/images/pizza.jpg'),
    title: 'Pizza Chaude',
    description: 'Du fromage fondant, toujours frais',
  },
  {
    image: require('../assets/images/noodle.jpg'),
    title: 'Nouilles Asiatiques',
    description: "L'authenticité dans chaque fourchette",
  },
];

// Adjust mockMenus to match Menu interface
const mockMenus: Menu[] = [
  {
    id: '1',
    date: '2025-06-06', // Example date
    typeRepas: 'Déjeuner' as MealType,
    recettes: [], // Empty array as no recipe IDs are provided
    foodName: 'Black Burger',
    description: 'Ambuger facile a preparer a la letue ,stake...',
    image: require('../assets/images/hamburgeur.jpg'),
    coutTotalEstime: 12.99,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
  {
    id: '2',
    date: '2025-06-06',
    typeRepas: 'Dîner' as MealType,
    recettes: [],
    foodName: 'Pizza Margarita',
    description: 'pizza de luxe facile a preparer au peperonie',
    image: require('../assets/images/pizza.jpg'),
    coutTotalEstime: 7.99,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
  {
    id: '3',
    date: '2025-06-06',
    typeRepas: 'Déjeuner' as MealType,
    recettes: [],
    foodName: 'Koki Chaud',
    description: 'koko de la grnde mere',
    image: require('../assets/images/koki.jpg'),
    coutTotalEstime: 4.59,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
  {
    id: '4',
    date: '2025-06-06',
    typeRepas: 'Collation' as MealType,
    recettes: [],
    foodName: 'Wrap Cheese',
    description: 'wrap sheese ',
    image: require('../assets/images/wrap.jpg'),
    coutTotalEstime: 5.49,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
  {
    id: '5',
    date: '2025-06-06',
    typeRepas: 'Dîner' as MealType,
    recettes: [],
    foodName: 'Noodles',
    description: "noodele italian a l'huile d'huile ",
    image: require('../assets/images/noodle.jpg'),
    coutTotalEstime: 6.99,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
  {
    id: '6',
    date: '2025-06-06',
    typeRepas: 'Déjeuner' as MealType,
    recettes: [],
    foodName: 'Harricot',
    description: 'Harricot au oeufs et au socise de france',
    image: require('../assets/images/R.jpg'),
    coutTotalEstime: 5.99,
    statut: 'planifié',
    familyId: '',
    createurId: '',
    dateCreation: '',
  },
];

const Dashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userId, loading: authLoading , error: AuthError } = useAuth();
  const { familyMembers, loading: familyLoading , error: FamilyError } = useFamilyData(userId || '', 'family1');
  const familyId = familyMembers.length > 0 ? familyMembers[0].familyId || 'family1' : 'family1';
  const { menus: dynamicMenus, loading: menusLoading ,error: menuError } = useMenus(userId || '', familyId);
 // const { loading: aiLoading, error: aiError, isReady: aiReady } = useAIConversation({ familyId });
  const scrollViewRef = useRef<ScrollView>(null);


  const [search, setSearch] = useState<string>('');
  const [menus, setMenus] = useState<Menu[]>(mockMenus);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const mappedMenus: Menu[] = dynamicMenus.map(menu => ({
    ...menu,
    image: mockMenus.find(mock => mock.foodName?.toLowerCase().includes(menu.foodName?.toLowerCase() || ''))?.image || require('../assets/images/pizza.jpg'),
  }));


  useEffect(() => {
    const checkAIAccess = async () => {
      if (!userId) {return;}
      const hasAccessedAI = await AsyncStorage.getItem('hasAccessedAI');
      if (!hasAccessedAI) {
        navigation.replace('OnboardingScreen');
      } else {
        await AsyncStorage.setItem('hasAccessedAI', 'true'); // Ensure flag is set
      }
    };
    checkAIAccess();
  }, [userId, navigation]);

  const options = [
    { icon: 'food', action: () => navigation.navigate('addMenu') },
    { icon: 'robot', action: () => navigation.navigate('GeminiAIScreen') },
    { icon: 'calendar', action: () => alert('Planifier manuellement') },
    { icon: 'magnify', action: () => alert('Rechercher menu') },
  ];

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Quitter l\'application', 'Voulez-vous vraiment quitter ?', [
        {
          text: 'Annuler',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Oui',
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % sliderImages.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const filterMenus = (text: string): void => {
    setSearch(text);
    const filtered = (mappedMenus.length > 0 ? mappedMenus : mockMenus).filter(item =>
      item.foodName?.toLowerCase().includes(text.toLowerCase()) || ''
    );
    setMenus(filtered);
  };

  const renderItem = ({ item }: { item: Menu }) => (
    <View style={styles.cardModern}>
      <Image source={item.image} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.foodName || 'Unnamed Menu'}</Text>
        <Text style={styles.cardPrice}>${(item.coutTotalEstime || 0).toFixed(2)}</Text>
        <Text style={styles.cardDescription}>{item.description || 'No description'}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => alert(`Added ${item.foodName || 'Unnamed Menu'} to cart`)}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

if (authLoading || familyLoading || menusLoading || {/*aiLoading || !aiReady*/} ) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.loadingText}>Chargement en cours...</Text>
    </SafeAreaView>
  );
}


  return (
    <SafeAreaView style={styles.container}>
      {/* === SLIDER HEADER === */}
      <View style={styles.sliderContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          {sliderImages.map((item, index) => (
            <Image key={index} source={item.image} style={styles.sliderImage} />
          ))}
        </ScrollView>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.sliderOverlay}
        />
        <View style={styles.sliderTextBox}>
          <Text style={styles.sliderTitle}>
            {sliderImages[currentIndex].title}
          </Text>
          <Text style={styles.sliderDescription}>
            {sliderImages[currentIndex].description}
          </Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#999" />
        <TextInput
          placeholder="Search menus..."
          value={search}
          onChangeText={filterMenus}
          style={styles.searchInput}
        />
      </View>
      <Text style={styles.sectionTitle}>Popular Menus</Text>
      <FlatList
        data={menus}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
      <Text style={styles.sectionTitle}>All Menus</Text>


      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Icon name="home" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('menu')}>
          <Icon name="heart-outline" size={28} color="#999" />
        </TouchableOpacity>
        <View style={styles.centerButtonContainer}>
          {showOptions &&
            options.map((option, index) => {
              const angle = (index * (2 * Math.PI)) / options.length;
              const top = -Math.cos(angle) * radius;
              const left = Math.sin(angle) * radius;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.floatingOption, { top, left }]}
                  onPress={option.action}>
                  <Icon name={option.icon} size={24} color="#fff" />
                </TouchableOpacity>
              );
            })}
          <TouchableOpacity style={styles.plusButton} onPress={toggleOptions}>
            <Icon name="view-grid" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bell-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="account-outline" size={28} color="#999" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

function alert(message: string): void {
  Alert.alert('Info', message);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sliderContainer: {
    height: 200,
    position: 'relative',
  },
  sliderImage: {
    width,
    height: 200,
    resizeMode: 'cover',
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  sliderTextBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  sliderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderDescription: {
    color: '#ddd',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    margin: 16,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#fff',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
  },
  cardModern: {
    width: 180,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardPrice: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 1,
    paddingTop: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#1e1e1e',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingOption: {
    position: 'absolute',
    backgroundColor: '#FF6B00',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  plusButton: {
    backgroundColor: '#FF6B00',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
