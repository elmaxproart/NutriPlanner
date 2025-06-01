import React, {JSX, useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  BackHandler,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LinearGradient from 'react-native-linear-gradient';
import {Alert} from 'react-native';
import {styles, width} from '../styles/DashbordStyle';

interface MenuItem {
  id: string;
  title: string;
  price: number;
  image: any;
  description?: string;
}


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

const mockMenus: MenuItem[] = [
  {
    id: '1',
    title: 'Black Burger',
    price: 12.99,
    description: 'Ambuger facile a preparer a la letue ,stake...',
    image: require('../assets/images/hamburgeur.jpg'),
  },
  {
    id: '2',
    title: 'Pizza Margarita',
    price: 7.99,
    description: 'pizza de luxe facile a preparer au peperonie',
    image: require('../assets/images/pizza.jpg'),
  },
  {
    id: '3',
    title: 'Koki Chaud',
    price: 4.59,
    description: 'koko de la grnde mere',
    image: require('../assets/images/koki.jpg'),
  },
  {
    id: '4',
    title: 'Wrap Cheese',
    price: 5.49,
    description: 'wrap sheese ',
    image: require('../assets/images/wrap.jpg'),
  },
  {
    id: '5',
    title: 'Noodles',
    price: 6.99,
    description: "noodele italian a l'huile d'huile ",
    image: require('../assets/images/noodle.jpg'),
  },
  {
    id: '6',
    title: 'harricot',
    price: 5.99,
    description: 'Harricot au oeufs et au socise de france',
    image: require('../assets/images/R.jpg'),
  },
];
const Dashboard: React.FC<{navigation: any}> = ({navigation}) => {
  const options = [
  {icon: 'food', action: () => navigation.navigate('addMenu')},
  {icon: 'robot', action: () => alert('Planifier avec l’IA')},
  {icon: 'calendar', action: () => alert('Planifier manuellement')},
  {icon: 'magnify', action: () => alert('Rechercher menu')},
];
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [search, setSearch] = useState<string>('');
  const [menus, setMenus] = useState<MenuItem[]>(mockMenus);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };
  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Quitter l'application", 'Voulez-vous vraiment quitter ?', [
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

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

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

  const onViewRef = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  });
  const filterMenus = (text: string): void => {
    setSearch(text);
    const filtered = mockMenus.filter(item =>
      item.title.toLowerCase().includes(text.toLowerCase()),
    );
    setMenus(filtered);
  };

  const renderItem = ({item}: {item: MenuItem}) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
      <Text style={{color: '#666', fontSize: 12, textAlign: 'center'}}>
        {item.description}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#FF6B00',
          paddingVertical: 8,
          paddingHorizontal: 50,
          borderRadius: 8,
          marginTop: 10,
        }}
        onPress={() => alert(`Added ${item.title} to cart`)}>
        <Text style={{color: '#fff', fontWeight: 'bold'}}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 1,
          paddingTop: 10,
        }}
      />
      <Text style={styles.sectionTitle}>All Menus</Text>

      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Icon name="home" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('menu')}>
          <Icon name="heart-outline" size={28} color="#999" />
        </TouchableOpacity>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
          {showOptions &&
            options.map((option, index) => {
              const angle = (index * (2 * Math.PI)) / options.length; 
              const top = -Math.cos(angle) * radius;
              const left = Math.sin(angle) * radius;


              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.floatingOption,
                    {top, left, position: 'absolute'},
                  ]}
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
