import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';


import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { formatDate } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import type {
  Menu,
  Recette,
  ListeCourses,
  MembreFamille,
  Budget,
  Ingredient,
  Store,
  HistoriqueRepas,
} from '../../constants/entities';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';


import { styles as geminiStyles } from '../../styles/geminiStyle';
import { useGeminiSuggestions } from '../../hooks/useAIConversation';
import { useAuth } from '../../hooks/useAuth';
import { useBudget } from '../../hooks/useBudget';
import { useFamilyData } from '../../hooks/useFamilyData';
import { useFirestore } from '../../hooks/useFirestore';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useMenus } from '../../hooks/useMenus';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRecipes } from '../../hooks/useRecipes';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { useStores } from '../../hooks/useStores';
import { Avatar } from '../common/Avatar';
import { Card } from '../common/Card';
import { IconButton } from '../common/IconButton';
import { Input } from '../common/Input';
import { ModalComponent } from '../common/Modal';

// Types pour les messages
type MessageType =
  | 'text'
  | 'menu_suggestion'
  | 'recipe_suggestion'
  | 'shopping_list_suggestion'
  | 'error'
  | 'image'
  | 'loading';

type MessageContent =
  | string
  | Recette[]
  | Menu[]
  | ListeCourses['items']
  | MembreFamille[]
  | Budget[]
  | Store[]
  | HistoriqueRepas[];

interface ChatMessage {
  id: string;
  content: MessageContent;
  isUser: boolean;
  timestamp: string;
  type: MessageType;
  imageUrl?: string;
}



const MenuSuggestion = ({ menus }: { menus: Menu[] }) => (
  <View style={geminiStyles.suggestionContainer}>
    <Text style={geminiStyles.messageText}>Voici vos suggestions de menus :</Text>
    {menus.map((menu, index) => (
      <Card key={index} style={geminiStyles.suggestionCard}>
        <Text style={geminiStyles.cardTitle}>{menu.nom}</Text>
        <Text style={geminiStyles.cardDescription}>{menu.description}</Text>
      </Card>
    ))}
  </View>
);

const RecipeSuggestion = ({ recipes }: { recipes: Recette[] }) => (
  <View style={geminiStyles.suggestionContainer}>
    <Text style={geminiStyles.messageText}>Voici vos suggestions de recettes :</Text>
    {recipes.map((recipe, index) => (
      <Card key={index} style={geminiStyles.suggestionCard} title={'j'} children={undefined}>
        <Text style={geminiStyles.cardTitle}>{recipe.nom}</Text>
        <Text style={geminiStyles.cardDescription}>{recipe.instructions.substring(0, 100)}...</Text>
      </Card>
    ))}
  </View>
);

const ShoppingListSuggestion = ({ items }: { items: ListeCourses['items'] }) => (
  <View style={geminiStyles.suggestionContainer}>
    <Text style={geminiStyles.messageText}>Voici votre liste de courses :</Text>
    {items.map((item, index) => (
      <Text key={index} style={geminiStyles.listItem}>
        - {item.ingredientId} : {item.quantite} {item.unite}
      </Text>
    ))}
  </View>
);

const LoadingMessage = () => (
  <View style={geminiStyles.geminiLoadingContainer}>
    <ActivityIndicator size="small" color="#00BFFF" />
    <Text style={geminiStyles.geminiLoadingText}>NutriBuddy AI réfléchit...</Text>
  </View>
);

const GeminiChat = ({ navigation }: { navigation: any }) => {
  // Hooks personnalisés
  const { userId } = useAuth();
  const { getCollection, addEntity } = useFirestore(userId || '', 'family1');
  const {
    getMenuSuggestions,
    getRecipeSuggestions,
    generateShoppingList,
  } = useGeminiSuggestions();
  const { familyMembers, fetchFamilyMembers } = useFamilyData(userId || '', 'family1');
  const { budgets } = useBudget(userId || '', 'family1');
  const { menus } = useMenus(userId || '', 'family1');
  const { recipes } = useRecipes(userId || '', 'family1');
  const { shoppingLists } = useShoppingLists(userId || '', 'family1');
  const { stores } = useStores(userId || '', 'family1');
  const { mealHistory } = useMealHistory(userId || '', 'family1');
  const { isConnected } = useNetworkStatus();


  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationModalVisible, setIsConversationModalVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const opacity = useSharedValue(0);


  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 300, easing: Easing.ease }),
  }));


  useEffect(() => {
    const initialize = async () => {
      try {
        // Configuration TTS
        Tts.setDefaultLanguage('fr-FR');
        Tts.setDefaultRate(0.5);
        Tts.setDefaultPitch(1.0);

        // Chargement des messages initiaux
        const interactions = await getCollection('aiInteractions');
        if (interactions.length > 0) {
          setMessages(interactions.map((interaction: any) => ({
            id: interaction.id,
            content: interaction.content,
            isUser: interaction.isUser,
            timestamp: interaction.timestamp,
            type: interaction.type || 'text',
            imageUrl: interaction.imageUrl,
          })));
        } else {
          // Message de bienvenue si aucune conversation existante
          addWelcomeMessage();
        }

        // Chargement des membres de la famille
        await fetchFamilyMembers();
        await loadConversations();
      } catch (error) {
        logger.error('Initialization error', { error });
        Alert.alert('Erreur', 'Impossible de charger les données initiales.');
      }
    };

    initialize();

    return () => {
      Tts.stop();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
      opacity.value = 1;
    }
  }, [messages]);

  // Gestion de la reconnaissance vocale
  useEffect(() => {
    Voice.onSpeechResults = (e: any) => {
      setInputText(e.value[0]);
      setIsListening(false);
    };

    Voice.onSpeechError = (e: any) => {
      logger.error('Voice recognition error', { error: e.error });
      setIsListening(false);
    };

    return () => {
      Voice.removeAllListeners();
    };
  }, []);

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-msg',
      content: 'Bonjour ! Je suis NutriBuddy AI. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me demander des suggestions de menus, recettes, ou listes de courses.',
      isUser: false,
      timestamp: formatDate(new Date(), 'HH:mm'),
      type: 'text',
    };
    setMessages([welcomeMessage]);
  };

  const loadConversations = async () => {
    try {
      const convs = await getCollection('conversations');
      setConversations(convs);
    } catch (error) {
      logger.error('Error loading conversations', { error });
    }
  };

  const saveConversation = async () => {
    try {
      const conversationId = `conv-${Date.now()}`;
      await addEntity('conversations', {
        id: conversationId,
        userId,
        messages,
        date: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      });
      Alert.alert('Succès', 'Conversation enregistrée.');
      loadConversations();
    } catch (error) {
      logger.error('Error saving conversation', { error });
      Alert.alert('Erreur', 'Impossible d\'enregistrer la conversation.');
    }
  };

  const loadConversation = (conversation: any) => {
    setMessages(conversation.messages);
    setIsConversationModalVisible(false);
  };

  const startVoiceRecognition = async () => {
    try {
      setIsListening(true);
      await Voice.start('fr-FR');
    } catch (error) {
      logger.error('Voice recognition start error', { error });
      setIsListening(false);
      Alert.alert('Erreur', 'Impossible de démarrer la reconnaissance vocale.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      logger.error('Voice recognition stop error', { error });
    }
  };

  const speakText = (text: string) => {
    setIsSpeaking(true);
    Tts.speak(text, {
      onDone: () => setIsSpeaking(false),
      onStop: () => setIsSpeaking(false),
    });
  };

  const addLoadingMessage = () => {
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      content: '',
      isUser: false,
      timestamp: formatDate(new Date(), 'HH:mm'),
      type: 'loading',
    };
    setMessages(prev => [...prev, loadingMessage]);
  };

  const removeLoadingMessage = () => {
    setMessages(prev => prev.filter(msg => msg.type !== 'loading'));
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !isConnected) {
      if (!isConnected) {
        Alert.alert('Erreur', 'Pas de connexion internet.');
      }
      return;
    }

    // Création du message utilisateur
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: inputText,
      isUser: true,
      timestamp: formatDate(new Date(), 'HH:mm'),
      type: selectedImage ? 'image' : 'text',
      imageUrl: selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImage('');
    addLoadingMessage();

    try {
      // Sauvegarde du message utilisateur
      await addEntity('aiInteractions', {
        ...userMessage,
        content: typeof userMessage.content === 'string' ?
          userMessage.content :
          JSON.stringify(userMessage.content),
      });

      // Traitement de la réponse de l'IA
      let aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: 'Désolé, je ne comprends pas. Essayez "menu", "recette", "liste de courses", etc.',
        isUser: false,
        timestamp: formatDate(new Date(), 'HH:mm'),
        type: 'text',
      };

      if (/menu/i.test(inputText)) {
        const suggestedMenus = await getMenuSuggestions(
          await getCollection('Ingredients') as Ingredient[],
          familyMembers.length > 0 ? familyMembers : await getCollection('FamilyMembers') as MembreFamille[]
        );
        aiResponse = {
          ...aiResponse,
          content: suggestedMenus,
          type: 'menu_suggestion',
        };
      }
      else if (/recette/i.test(inputText)) {
        const suggestedRecipes = await getRecipeSuggestions(
          await getCollection('Ingredients') as Ingredient[],
          { niveauEpices: 3, cuisinesPreferees: ['italienne', 'camerounaise'] }
        );
        aiResponse = {
          ...aiResponse,
          content: suggestedRecipes,
          type: 'recipe_suggestion',
        };
      }
      else if (/liste de courses/i.test(inputText)) {
        const menuToUse = menus[0] || (await getCollection('Menus') as Menu[])[0];
        if (menuToUse) {
          const shoppingList = await generateShoppingList(menuToUse);
          aiResponse = {
            ...aiResponse,
            content: shoppingList,
            type: 'shopping_list_suggestion',
          };
        }
      }
      else if (/famille/i.test(inputText)) {
        aiResponse.content = familyMembers.length > 0
          ? `Membres : ${familyMembers.map(m => `${m.prenom} ${m.nom}`).join(', ')}`
          : 'Aucun membre enregistré.';
      }
      else if (/dépenses|budget/i.test(inputText)) {
        const currentBudget = budgets.find(b => b.mois === formatDate(new Date(), 'YYYY-MM'));
        aiResponse.content = currentBudget
          ? `Budget ${currentBudget.mois} : ${currentBudget.plafond}€, dépensé ${currentBudget.depenses.reduce((sum, d) => sum + d.montant, 0).toFixed(2)}€`
          : 'Aucun budget pour ce mois.';
      }
      else if (/historique des repas/i.test(inputText)) {
        aiResponse.content = mealHistory.length > 0
          ? `Derniers repas : ${mealHistory.slice(0, 3).map(h => `${h.typeRepas} (${formatDate(new Date(h.date), 'DD/MM')})`).join(', ')}`
          : 'Aucun historique.';
      }
      else if (/magasins/i.test(inputText)) {
        aiResponse.content = stores.length > 0
          ? `Magasins : ${stores.map(s => s.nom).join(', ')}`
          : 'Aucun magasin.';
      }
      else if (selectedImage) {
        aiResponse.content = 'Image reçue. Je peux analyser son contenu si vous le souhaitez !';
      }

      // Sauvegarde et affichage de la réponse
      await addEntity('aiInteractions', {
        ...aiResponse,
        content: typeof aiResponse.content === 'string' ?
          aiResponse.content :
          JSON.stringify(aiResponse.content),
      });

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      logger.error('Error processing message', { error });
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        content: `Erreur : ${(error as Error).message}`,
        isUser: false,
        timestamp: formatDate(new Date()),
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      removeLoadingMessage();
    }
  };

  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.isUser;
    const avatarSource = isUser
      ? require('../../assets/images/user.png')
      : require('../../assets/images/ai.jpg');
    const senderName = isUser ? 'Vous' : 'NutriBuddy AI';

    let messageContent;
    if (item.type === 'loading') {
      return <LoadingMessage />;
    } else if (item.type === 'image' && item.imageUrl) {
      messageContent = (
        <View>
          <Text style={geminiStyles.messageText}>{item.content}</Text>
          <Image
            source={{ uri: item.imageUrl }}
            style={geminiStyles.sentImage}
            resizeMode="contain"
          />
        </View>
      );
    } else if (typeof item.content === 'string') {
      messageContent = <Text style={geminiStyles.messageText}>{item.content}</Text>;
    } else if (Array.isArray(item.content)) {
      if (item.type === 'menu_suggestion') {
        messageContent = <MenuSuggestion menus={item.content as Menu[]} />;
      } else if (item.type === 'recipe_suggestion') {
        messageContent = <RecipeSuggestion recipes={item.content as Recette[]} />;
      } else if (item.type === 'shopping_list_suggestion') {
        messageContent = <ShoppingListSuggestion items={item.content as ListeCourses['items']} />;
      } else {
        messageContent = <Text style={geminiStyles.messageText}>{JSON.stringify(item.content, null, 2)}</Text>;
      }
    }

    return (
      <Animated.View
        style={[
          geminiStyles.messageContainer,
          isUser ? geminiStyles.userMessageContainer : geminiStyles.aiMessageContainer,
          animatedStyle,
        ]}
      >
        <Avatar size={30} source={avatarSource} />
        <View style={[
          geminiStyles.messageBubble,
          isUser ? geminiStyles.userMessageBubble : geminiStyles.aiMessageBubble,
        ]}>
          <Text style={geminiStyles.senderName}>{senderName}</Text>
          {messageContent}
          <Text style={geminiStyles.timestamp}>{item.timestamp}</Text>
          <TouchableOpacity
            onPress={() => {
              const textToCopy = typeof item.content === 'string'
                ? item.content
                : JSON.stringify(item.content);
              Clipboard.setString(textToCopy);
              Alert.alert('Copié !');
            }}
            style={geminiStyles.copyIcon}
          >
            <Icon name="content-copy" size={16} color="#b0b0b0" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }, [animatedStyle]);

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => loadConversation(item)}
      style={geminiStyles.conversationItem}
    >
      <Text style={geminiStyles.conversationDate}>{item.date}</Text>
      <Text numberOfLines={1} style={geminiStyles.conversationPreview}>
        {item.messages.slice(0, 2).map((m: any) => m.content).join(' - ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={geminiStyles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={geminiStyles.chatContentContainer}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      <View style={geminiStyles.inputContainer}>
        <Input
          value={inputText}
          onChangeText={setInputText}
          placeholder="Posez une question à NutriBuddy AI..."
          placeholderTextColor="#888"
          style={geminiStyles.input}
          multiline
          onSubmitEditing={handleSendMessage}
        />

        <View style={geminiStyles.buttonGroup}>
          <IconButton
            icon={isListening ? 'microphone-off' : 'microphone'}
            onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
            color={isListening ? '#FF6B6B' : '#FFF'}
            style={geminiStyles.iconButton}
          />

          <IconButton
            icon="image"
            onPress={() => setIsImageModalVisible(true)}
            color="#FFF"
            style={geminiStyles.iconButton}
          />

          <IconButton
            icon="send"
            onPress={handleSendMessage}
            color="#FFF"
            style={[geminiStyles.iconButton, geminiStyles.sendButton]}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
          />
        </View>
      </View>

      <View style={geminiStyles.utilityButtons}>
        <IconButton
          icon={isSpeaking ? 'volume-high' : 'volume-off'}
          onPress={() => speakText(messages[messages.length - 1]?.content.toString() || '')}
          color={isSpeaking ? '#00BFFF' : '#FFF'}
          style={geminiStyles.utilityButton}
          disabled={messages.length === 0}
        />

        <IconButton
          icon="content-save"
          onPress={saveConversation}
          color="#FFF"
          style={geminiStyles.utilityButton}
          disabled={messages.length === 0}
        />

        <IconButton
          icon="history"
          onPress={() => setIsConversationModalVisible(true)}
          color="#FFF"
          style={geminiStyles.utilityButton}
        />
      </View>

      {/* Modals */}
      <ModalComponent
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        title="Ajouter une image"
      >
        <View style={geminiStyles.imageGrid}>
          {['food1.jpg', 'food2.jpg', 'recipe1.jpg'].map((img) => (
            <TouchableOpacity
              key={img}
              onPress={() => {
                setSelectedImage(`asset:/images/${img}`);
                setIsImageModalVisible(false);
              }}
              style={geminiStyles.imageOption}
            >
              <Image
                source={{ uri: `asset:/images/${img}` }}
                style={geminiStyles.thumbnail}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ModalComponent>

      <ModalComponent
        visible={isConversationModalVisible}
        onClose={() => setIsConversationModalVisible(false)}
        title="Historique des conversations"
      >
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={geminiStyles.conversationList}
        />
      </ModalComponent>
    </View>
  );
};

// Original styles (can be removed if all migrated)
const originalStyles = StyleSheet.create({
  // Keep only styles not present in geminiStyle.ts or that need to be overridden
  // For example, if geminiStyles.listItem doesn't exist, you'd keep it here:
  listItem: {
    fontSize: 14,
    color: '#FFF',
    marginVertical: 2,
  },
  utilityButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  utilityButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOption: {
    margin: 8,
  },

});


export default GeminiChat;
