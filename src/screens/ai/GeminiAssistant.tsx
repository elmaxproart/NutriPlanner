import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
  Clipboard,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {askGemini} from './geminiService';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import notifee, { AndroidImportance } from '@notifee/react-native';

interface Message {
  from: 'user' | 'bot';
  text: string;
}
async function displayNotification() {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: '👨‍🍳 MR CORDON BLEU',
    body: 'Hey ! Une nouvelle idée recette t’attend 🍲',
    android: {
      channelId: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });
}
const GeminiAssistant: React.FC<{navigation: any}> = ({navigation}) => {

  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    loadChatHistory();
    fetchFamilyData();
  }, []);
useEffect(() => {
  const interval = setInterval(() => {
    displayNotification();
  }, 15*60000); // toutes les 15 minutes

  return () => clearInterval(interval); // nettoyage à la fin
}, []);

  const fetchFamilyData = async () => {
    try {
      const members = await fetchFamilyMembers();
      setFamilyMembers(members);
    } catch (error) {
      console.error('Erreur chargement famille:', error);
    }
  };

  const fetchFamilyMembers = async (): Promise<any[]> => {
    const userId = auth().currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté.');

    const snapshot = await firestore()
      .collection(`users/${userId}/family`)
      .get();

    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  
  const loadChatHistory = async () => {
    const saved = await AsyncStorage.getItem('chatHistory');
    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  };

  const saveChatHistory = async (messages: Message[]) => {
    await AsyncStorage.setItem('chatHistory', JSON.stringify(messages));
  };
  
const familyContext = familyMembers.map(member => {
  const allergies = member.allergies?.join(', ') || 'aucune';
  const vegan = member.vegan ? 'est vegan' : 'n\'est pas vegan';
  return `${member.fullName} (${member.age} ans), ${vegan}, allergies : ${allergies}`;
}).join('\n');

  const handleAskGemini = async () => {
    if (!userInput.trim()) return;

    const updatedHistory: Message[] = [
      ...chatHistory,
      {from: 'user', text: userInput},
    ];

    setChatHistory(updatedHistory);
    setUserInput('');
    setLoading(true);

    const context = updatedHistory
      .map(
        msg =>
          `${msg.from === 'user' ? 'Utilisateur' : 'Assistant'} : ${msg.text}`,
      )
      .join('\n');

    const prompt = `
Tu es **Monsieur Cordon Bleu**, un assistant culinaire intelligent. Contexte de la conversation :

${context}

Voici une nouvelle demande : ${userInput}
- Propose un **menu familial** adapté.
- Génère une **liste de courses** claire.
- Donne un **commentaire nutritionnel**.
    `;

    const botResponse = await askGemini(prompt);
    const newHistory: Message[] = [
      ...updatedHistory,
      {from: 'bot', text: botResponse},
    ];

    setChatHistory(newHistory);
    await saveChatHistory(newHistory);
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('📋 Copié', 'Réponse copiée dans le presse-papiers.');
  };

  const handleShare = async (text: string) => {
    try {
      await Share.share({message: text});
    } catch {
      Alert.alert('Erreur', 'Le partage a échoué.');
    }
  };

  const handleEdit = (text: string) => {
    setUserInput(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {navigation.goBack()}}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={fetchFamilyData}>
          <AntDesign name="team" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Info', familyContext)}>
          <AntDesign name="infocirlceo" size={24} color="#fff" />
        </TouchableOpacity>
        <AntDesign name="star" size={24} color="#FFD700" />
        <Text style={styles.title}>Monsieur Cordon Bleu </Text>
      </View>

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={{paddingBottom: 100}}
        keyboardShouldPersistTaps="handled">
        {chatHistory.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBox,
              msg.from === 'user' ? styles.userBox : styles.botBox,
            ]}>
            {msg.from === 'bot' ? (
              <>
                <Markdown
                  style={{
                    body: {color: '#fff', fontSize: 16},
                    strong: {color: '#FFD700'},
                  }}>
                  {msg.text}
                </Markdown>
                <View style={styles.options}>
                  <TouchableOpacity
                    onPress={() => handleCopy(msg.text)}
                    style={styles.optionButton}>
                    <AntDesign name="copy1" size={18} color="#fff" />
                    <Text style={styles.optionText}>Copier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleShare(msg.text)}
                    style={styles.optionButton}>
                    <AntDesign name="sharealt" size={18} color="#fff" />
                    <Text style={styles.optionText}>Partager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(msg.text)}
                    style={styles.optionButton}>
                    <AntDesign name="edit" size={18} color="#fff" />
                    <Text style={styles.optionText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{color: '#FFD700', fontSize: 15}}>{msg.text}</Text>
            )}
          </View>
        ))}
        {loading && (
          <ActivityIndicator
            size="large"
            color="#FFD700"
            style={{margin: 20}}
          />
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={styles.inputBar}>
        <TextInput
          placeholder="Décris ce que tu as dans ta cuisine..."
          placeholderTextColor="#aaa"
          value={userInput}
          onChangeText={setUserInput}
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={handleAskGemini} style={styles.sendButton}>
          <AntDesign name="arrowright" size={22} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: '#222',
    backgroundColor: '#1e1e1e',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 60,
  },
  messageBox: {
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
  },
  userBox: {
    backgroundColor: '#2a2a2a',
    alignSelf: 'flex-end',
  },
  botBox: {
    backgroundColor: '#1f1f1f',
    alignSelf: 'flex-start',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  optionText: {
    color: '#fff',
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    marginLeft: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GeminiAssistant;
