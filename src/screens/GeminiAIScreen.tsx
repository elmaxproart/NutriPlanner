import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../hooks/useAuth';
import { useFamilyData } from '../hooks/useFamilyData';
import { useMenus } from '../hooks/useMenus';
import GeminiChat from '../components/ai/GeminiChat';
import FamilyCard from '../components/ai/FamilyCard';
import { MembreFamille } from '../constants/entities';

interface SuggestionBubble {
  id: string;
  text: string;
  image: any;
}

interface Section {
  id: string;
  title: string;
  content: MembreFamille[] | SuggestionBubble[];
}

const GeminiAIScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userId } = useAuth();
  const { familyMembers, fetchFamilyMembers } = useFamilyData(userId || '', 'family1');
  const { menus } = useMenus(userId || '', 'family1');
  const [showOptions, setShowOptions] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [, setChatMessage] = useState('');
  const chatOpacity = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const radius = 80;

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const options = [
    { icon: 'food', action: () => navigation.navigate('addMenu') },
    { icon: 'robot', action: () => { setIsChatActive(true); setChatMessage(''); } },
    { icon: 'calendar', action: () => Alert.alert('Planifier manuellement') },
    { icon: 'magnify', action: () => Alert.alert('Rechercher menu') },
  ];

  const suggestionBubbles: SuggestionBubble[] = [
    { id: '1', text: 'Suggérer un menu', image: require('../assets/images/pizza.jpg') },
    { id: '2', text: 'Proposer une recette', image: require('../assets/images/hamburgeur.jpg') },
    { id: '3', text: 'Liste de courses', image: require('../assets/images/shopping.jpg') },
    ...(menus.length > 0 ? [{ id: '4', text: `Menu: ${menus[0].typeRepas}`, image: require('../assets/images/menu.jpg') }] : []),
  ];

  const sections: Section[] = [
    { id: '1', title: 'Famille', content: familyMembers },
    { id: '2', title: 'Suggestions', content: suggestionBubbles },
    { id: '3', title: 'Historique', content: [] },
  ];

  const renderSection = ({ item }: { item: Section }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      {item.title === 'Famille' && familyMembers.length > 0 && (
        <FlatList
          data={item.content as MembreFamille[]}
          renderItem={({ item: member }) => (
            <FamilyCard
              member={member}
              onPress={() => navigation.navigate('FamilyMemberDetail', { memberId: member.id })}
              onSendToAI={(message) => {
                setIsChatActive(true);
                setChatMessage(message);
                Animated.timing(chatOpacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              }}
            />
          )}
          keyExtractor={(member) => member.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      )}
      {item.title === 'Suggestions' && (
        <FlatList
          data={item.content as SuggestionBubble[]}
          renderItem={({ item: bubble }) => (
            <TouchableOpacity
              style={styles.bubble}
              onPress={() => {
                setIsChatActive(true);
                setChatMessage(bubble.text);
                Animated.timing(chatOpacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              }}
            >
              <Image source={bubble.image} style={styles.bubbleImage} />
              <Text style={styles.bubbleText}>{bubble.text}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(bubble) => bubble.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );

  const handleCloseChat = () => {
    Animated.timing(chatOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsChatActive(false));
  };

  const toggleOverlay = () => {
    Animated.timing(slideAnim, {
      toValue:  0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -300],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Modifications')}>
            <Icon name="bell-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Recherche')}>
            <Icon name="magnify" size={28} color="#fff" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.aiIcon}
          onPress={() => {
            setIsChatActive(true);
            setChatMessage('');
            Animated.timing(chatOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }}
        >
          <Icon name="robot" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {!isChatActive && (
        <ScrollView style={styles.content}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={(item) => item.id}
            style={styles.sectionList}
          />
          <TouchableOpacity style={styles.overlayToggle} onPress={toggleOverlay}>
            <Text style={styles.overlayText}>Ouvrir Overlay</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Animated.View
        style={[
          styles.overlay,
          { transform: [{ translateY: slideInterpolate }] },
        ]}
      >
        <View style={styles.overlayContent}>
          <Text style={styles.overlayTitle}>Sections Supplémentaires</Text>
          <Text style={styles.overlayText}>Contenu personnalisé ici...</Text>
          <TouchableOpacity style={styles.closeOverlay} onPress={toggleOverlay}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.chatContainer, { opacity: chatOpacity }]}>
        {isChatActive && (
          <View style={styles.chatWrapper}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseChat}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <GeminiChat _navigation={navigation} />
          </View>
        )}
      </Animated.View>

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
                  onPress={option.action}
                >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1e1e1e',
  },
  leftIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  aiIcon: {
    padding: 5,
  },
  searchIcon: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  sectionList: {
    paddingBottom: 60,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  bubble: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  bubbleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  bubbleText: {
    marginTop: 5,
    fontSize: 14,
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
  },
  chatWrapper: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  overlayContent: {
    flex: 1,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overlayText: {
    color: '#ddd',
    fontSize: 16,
  },
  closeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  overlayToggle: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    margin: 10,
    borderRadius: 10,
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
});

export default GeminiAIScreen;
