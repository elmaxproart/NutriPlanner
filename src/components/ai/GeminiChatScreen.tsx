
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Tts from 'react-native-tts';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { StackScreenProps } from '@react-navigation/stack';

// Components and Hooks
import { Avatar } from '../common/Avatar';
import { IconButton } from '../common/IconButton';
import { Input } from '../common/Input';
import { ModalComponent } from '../common/Modal';

import MenuSuggestion from './template/MenuSuggestion';
import RecipeSuggestion from './template/RecipeSuggestion';
import ShoppingListSuggestion from './template/ShoppingListSuggestion';
import { useAIConversation } from '../../hooks/useAIConversation';
import { useAuth } from '../../hooks/useAuth';
import { useBudget } from '../../hooks/useBudget';
import { useFamilyData } from '../../hooks/useFamilyData';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useMenus } from '../../hooks/useMenus';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRecipes } from '../../hooks/useRecipes';
import { useStores } from '../../hooks/useStores';

// Types
import type {
  Menu,
  Recette,
  MembreFamille,
  Budget,
  Store,
  ListeCourses,
} from '../../constants/entities';
import type { RootStackParamList } from '../../App';
import FamilyCard from './FamilyCard';
import SuggestionCard from './SuggestionCard';

const { width } = Dimensions.get('window');

type MessageType =
  | 'text'
  | 'menu_suggestion'
  | 'recipe_suggestion'
  | 'shopping_list_suggestion'
  | 'error'
  | 'image'
  | 'loading'
  | 'tool_use'
  | 'tool_response'
  | 'json';

type MessageContent =
  | string
  | Menu[]
  | Recette[]
  | ListeCourses[]
  | MembreFamille[]
  | Budget[]
  | Store[]
  | object;

interface ChatMessage {
  id: string;
  content: MessageContent;
  isUser: boolean;
  timestamp: string;
  type: MessageType;
  imageUrl?: string;
}

const LoadingMessage = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color="#FF6B00" />
    <Text style={styles.loadingText}>NutriBuddy AI réfléchit...</Text>
  </View>
);

const TypingText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);
  const hasTyped = useRef(false);

  useEffect(() => {
    if (!hasTyped.current && index.current < text.length) {
      const timer = setInterval(() => {
        if (index.current < text.length) {
          setDisplayedText(text.substring(0, index.current + 1));
          index.current += 1;
        } else {
          clearInterval(timer);
          hasTyped.current = true;
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [text]);

  return <Text style={styles.messageText}>{displayedText || text}</Text>;
};

const TemplateTypingAnimation = ({ children }: { children: React.ReactNode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

const GeminiChatScreen: React.FC<StackScreenProps<RootStackParamList, 'GeminiChat'>> = ({
  navigation,
  route,
}) => {
  const { initialMessage } = route.params || {};
  const { userId } = useAuth();

  const {
    messages: aiInteractions,
    sendMessage,
    currentConversation,
    conversations,
    createNewConversation,
    selectConversation,
    deleteConversation,
    getMenuSuggestions,
    generateShoppingList,
    analyzeRecipe,
    generateRecipeSuggestions,
    checkIngredientAvailability,
    getNutritionalInfo,
    troubleshootProblem,
    getCreativeIdeas,
  } = useAIConversation({ defaultModel: 'gemini-1.5-flash' });

  const { familyMembers, fetchFamilyMembers, loading: familyLoading } = useFamilyData();
  const { budgets, loading: budgetLoading } = useBudget();
  const { menus, loading: menusLoading } = useMenus();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { stores, loading: storesLoading } = useStores();
  const { loading: mealHistoryLoading } = useMealHistory();
  const { isConnected } = useNetworkStatus();

  const [inputText, setInputText] = useState(initialMessage || '');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSuggestionModalVisible, setIsSuggestionModalVisible] = useState(false);
  const [isConversationModalVisible, setIsConversationModalVisible] = useState(false);
  const [isNewConversationModalVisible, setIsNewConversationModalVisible] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [_, setSelectedMenu] = useState<Menu | null>(null);
  const [__, setSelectedRecipe] = useState<Recette | null>(null);
  const [___, setShoppingItems] = useState<
    { nom: string; quantite: number; unite: string; checked?: boolean }[]
  >([]);
  const [isNetworkErrorModalVisible, setIsNetworkErrorModalVisible] = useState(false);
  const [networkErrorMessage, setNetworkErrorMessage] = useState('');
  const [isCopiedModalVisible, setIsCopiedModalVisible] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');
  const [isMenuSelectedModalVisible, setIsMenuSelectedModalVisible] = useState(false);
  const [menuSelectedMessage, setMenuSelectedMessage] = useState('');
  const [isRecipeSelectedModalVisible, setIsRecipeSelectedModalVisible] = useState(false);
  const [recipeSelectedMessage, setRecipeSelectedMessage] = useState('');
  const [isImageErrorModalVisible, setIsImageErrorModalVisible] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState('');
  const [isTitleMissingModalVisible, setIsTitleMissingModalVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const messageScrollViewRef = useRef<ScrollView>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const messages: ChatMessage[] = useMemo(
    () =>
      aiInteractions.map((interaction) => ({
        id: interaction.id || `msg-${Date.now()}`,
        content: interaction.content,
        isUser: interaction.isUser,
        timestamp: interaction.timestamp,
        type: interaction.type as MessageType,
        imageUrl:
          typeof interaction.content === 'object' && 'uri' in interaction.content
            ? interaction.content.uri
            : undefined,
      })),
    [aiInteractions]
  );

  const addLoadingMessage = useCallback(() => {
    sendMessage('', undefined, undefined);
  }, [sendMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() && !selectedImage) {return;}
    if (!isConnected) {
      setNetworkErrorMessage('Pas de connexion internet.');
      setIsNetworkErrorModalVisible(true);
      return;
    }
    if (!userId) {
      setNetworkErrorMessage('Veuillez vous connecter pour envoyer un message.');
      setIsNetworkErrorModalVisible(true);
      return;
    }

    try {
      addLoadingMessage();
      await sendMessage(
        inputText,
        undefined,
        selectedImage ? { uri: selectedImage, mimeType: 'image/jpeg', base64: '' } : undefined
      );
      setInputText('');
      setSelectedImage('');
      messageScrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      setNetworkErrorMessage('Erreur lors de l’envoi du message.');
      setIsNetworkErrorModalVisible(true);
    }
  }, [inputText, selectedImage, isConnected, userId, addLoadingMessage, sendMessage]);

  const speakText = useCallback((text: string) => {
    try {
      setIsSpeaking(true);
      Tts.speak(text, {
        iosVoiceId: 'com.apple.ttsbundle.Marie-compact',
        rate: 0.5,
        androidParams: { KEY_PARAM_STREAM: 'STREAM_MUSIC', KEY_PARAM_VOLUME: 0, KEY_PARAM_PAN: 0 },
      });
      Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    } catch (error) {
      setIsSpeaking(false);
    }
  }, []);

  const handleGenerateList = useCallback(() => {
    const menu = menus[0];
    if (menu && userId) {
      generateShoppingList(menu, []).then((list) => {
        setShoppingItems(list.map((item) => ({ nom: item.name, quantite: item.quantity, unite: item.unit })));
      });
    }
  }, [menus, userId, generateShoppingList]);

  const handleImagePick = useCallback(async (source: 'camera' | 'gallery') => {
    setIsImagePickerModalVisible(false);
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 200,
    };

    try {
      const result = source === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);
      if (result.didCancel) {return;}
      if (result.errorCode) {
        setImageErrorMessage('Impossible de charger l’image: ' + (result.errorMessage || 'Inconnue'));
        setIsImageErrorModalVisible(true);
        return;
      }
      if (result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        setInputText('J’ai ajouté une image, que pensez-vous de ça ?');
      }
    } catch (error) {
      setImageErrorMessage('Erreur lors de la sélection de l’image.');
      setIsImageErrorModalVisible(true);
    }
  }, []);

  const handlePredefinedQuestion = useCallback(
    async (question: string, options?: { [key: string]: any }) => {
      if (!userId) {
        setNetworkErrorMessage('Veuillez vous connecter pour utiliser cette fonctionnalité.');
        setIsNetworkErrorModalVisible(true);
        return;
      }

      try {
        addLoadingMessage();
        let systemInstruction = `Réponds en français. ${question}`;
        if (options) {systemInstruction += `. Options: ${JSON.stringify(options)}`;}

        if (question.includes('Suggérer un menu')) {
          const menuSuggestions = await getMenuSuggestions([], familyMembers, options?.numDays, options?.numMealsPerDay);
          await sendMessage(JSON.stringify(menuSuggestions), systemInstruction, undefined);
        } else if (question.includes('Proposer une recette')) {
          const recipeSuggestions = await generateRecipeSuggestions([], {
            niveauEpices: options?.niveauEpices || 2,
            cuisinesPreferees: options?.cuisinesPreferees || ['Italienne'],
            mealType: options?.mealType,
          });
          await sendMessage(JSON.stringify(recipeSuggestions), systemInstruction, undefined);
        } else if (question.includes('Générer une liste de courses')) {
          const menu = menus[0];
          if (menu) {
            const shoppingList = await generateShoppingList(menu, []);
            setShoppingItems(shoppingList.map((item) => ({ nom: item.name, quantite: item.quantity, unite: item.unit })));
            await sendMessage(JSON.stringify(shoppingList), systemInstruction, undefined);
          }
        } else if (question.includes('idées créatives')) {
          const ideas = await getCreativeIdeas('dîner de famille');
          await sendMessage(ideas.join(', '), systemInstruction);
        } else if (question.includes('Analyse une recette')) {
          const recipe = recipes[0];
          if (recipe) {
            const analysis = await analyzeRecipe(recipe, familyMembers);
            await sendMessage(JSON.stringify(analysis), systemInstruction);
          }
        } else if (question.includes('Vérifier la disponibilité')) {
          const result = await checkIngredientAvailability('tomate', { latitude: 0, longitude: 0 });
          await sendMessage(JSON.stringify(result), systemInstruction);
        } else if (question.includes('Informations nutritionnelles')) {
          const info = await getNutritionalInfo('pomme');
          await sendMessage(JSON.stringify(info), systemInstruction);
        } else if (question.includes('Résoudre un problème')) {
          const solution = await troubleshootProblem('recette trop épicée');
          await sendMessage(solution, systemInstruction);
        } else if (question.includes('Informations sur la famille')) {
          await sendMessage(familyMembers.map((m) => `${m.prenom} ${m.nom}`).join(', '), systemInstruction);
        } else if (question.includes('Budget')) {
          const currentBudget = budgets[0];
          await sendMessage(currentBudget ? `Plafond: ${currentBudget.plafond}€` : 'Aucun budget', systemInstruction);
        } else if (question.includes('Magasins')) {
          await sendMessage(stores.map((s) => s.nom).join(', '), systemInstruction);
        }
        setIsSuggestionModalVisible(false);
        messageScrollViewRef.current?.scrollToEnd({ animated: true });
      } catch (err: any) {
        await sendMessage(`Erreur: ${err.message || 'Inconnue'}`, undefined, undefined);
      }
    },
    [
      userId,
      addLoadingMessage,
      sendMessage,
      getMenuSuggestions,
      generateRecipeSuggestions,
      generateShoppingList,
      getCreativeIdeas,
      analyzeRecipe,
      checkIngredientAvailability,
      getNutritionalInfo,
      troubleshootProblem,
      familyMembers,
      menus,
      recipes,
      budgets,
      stores,
    ]
  );

  const handleSelectMenu = useCallback((menu: Menu) => {
    setSelectedMenu(menu);
    setMenuSelectedMessage(`Vous avez choisi: ${menu.typeRepas}`);
    setIsMenuSelectedModalVisible(true);
  }, []);

  const handleSelectRecipe = useCallback((recipe: Recette) => {
    setSelectedRecipe(recipe);
    setRecipeSelectedMessage(`Vous avez choisi: ${recipe.nom}`);
    setIsRecipeSelectedModalVisible(true);
  }, []);

  const handleToggleItem = useCallback((id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.nom === id ? { ...item, checked: !item.checked } : item))
    );
  }, []);

  const renderMessageItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.isUser;
      const avatarSource = isUser
        ? require('../../assets/images/ia.jpg')
        : require('../../assets/images/ai.jpg');
      const senderName = isUser ? 'Vous' : 'NutriBuddy AI';

      let messageContent;

      if (item.type === 'loading') {
        messageContent = <LoadingMessage />;
      } else if (!isUser && item.type === 'text') {
        messageContent = <TypingText text={String(item.content)} />;
      } else if (item.type === 'image' && item.imageUrl) {
        messageContent = (
          <View>
            <Text style={styles.messageText}>{String(item.content)}</Text>
            <Image source={{ uri: item.imageUrl }} style={styles.sentImage} resizeMode="contain" />
          </View>
        );
      } else if (Array.isArray(item.content)) {
        if (item.type === 'menu_suggestion') {
          messageContent = (
            <TemplateTypingAnimation>
              <MenuSuggestion menus={item.content as Menu[]} onSelectMenu={handleSelectMenu} />
            </TemplateTypingAnimation>
          );
        } else if (item.type === 'recipe_suggestion') {
          messageContent = (
            <TemplateTypingAnimation>
              <RecipeSuggestion recipes={item.content as Recette[]} onSelectRecipe={handleSelectRecipe} />
            </TemplateTypingAnimation>
          );
        } else if (item.type === 'shopping_list_suggestion') {
          messageContent = (
            <TemplateTypingAnimation>
              <ShoppingListSuggestion
                items={(item.content as ListeCourses[])
                  .flatMap((list) =>
                    'items' in list && Array.isArray(list.items)
                      ? list.items.map((i) => ({
                          id: i.ingredientId,
                          ingredientId: i.ingredientId,
                          nom: i.ingredientId,
                          quantite: i.quantite,
                          unite: i.unite,
                        }))
                      : []
                  )
                  .filter((i) => i.nom)}
                onToggleItem={handleToggleItem}
                onGenerateList={handleGenerateList}
              />
            </TemplateTypingAnimation>
          );
        } else {
          messageContent = <Text style={styles.messageText}>{JSON.stringify(item.content, null, 2)}</Text>;
        }
      } else if (typeof item.content === 'object' && item.content !== null) {
        messageContent = <Text style={styles.messageText}>{JSON.stringify(item.content, null, 2)}</Text>;
      } else {
        messageContent = <TypingText text={String(item.content)} />;
      }

      return (
        <Animated.View
          style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer, { opacity }]}
        >
          <Avatar size={30} source={avatarSource} />
          <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.aiMessageBubble]}>
            <Text style={styles.senderName}>{senderName}</Text>
            {messageContent}
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            <TouchableOpacity
              onPress={() => {
                const textToCopy =
                  typeof item.content === 'string' ||
                  typeof item.content === 'number' ||
                  typeof item.content === 'boolean'
                    ? String(item.content)
                    : JSON.stringify(item.content, null, 2);
                Clipboard.setString(textToCopy);
                setCopiedMessage('Copié !');
                setIsCopiedModalVisible(true);
              }}
              style={styles.copyIcon}
            >
              <AntDesign name="copy1" size={16} color="#b0b0b0" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [opacity, handleSelectMenu, handleSelectRecipe, handleToggleItem, handleGenerateList]
  );

  const handleNewConversationInitiation = useCallback(() => {
    setIsNewConversationModalVisible(true);
  }, []);

  const confirmNewConversation = useCallback(async () => {
    if (!newConversationTitle.trim()) {
      setIsTitleMissingModalVisible(true);
      return;
    }

    try {
      await createNewConversation(newConversationTitle.trim());
      setNewConversationTitle('');
      setIsNewConversationModalVisible(false);
      await sendMessage('Bonjour ! Je suis NutriBuddy AI. Comment puis-je vous aider aujourd’hui ?');
      scrollViewRef.current?.scrollTo({ x: conversations.length * width, animated: true });
    } catch (error) {
      setNetworkErrorMessage('Erreur lors de la création de la conversation.');
      setIsNetworkErrorModalVisible(true);
    }
  }, [newConversationTitle, createNewConversation, sendMessage, conversations.length]);

  const handleSelectExistingConversation = useCallback(
    (conversationId: string) => {
      selectConversation(conversationId);
      setIsConversationModalVisible(false);
    },
    [selectConversation]
  );

  useEffect(() => {
    const initialize = async () => {
      Tts.setDefaultLanguage('fr-FR');
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      if (userId) {await fetchFamilyMembers();}
      if (!currentConversation && messages.length === 0) {
        await sendMessage(
          initialMessage || 'Bonjour ! Je suis NutriBuddy AI. Comment puis-je vous aider aujourd’hui ?'
        );
      }
    };
    initialize();

    return () => {
      Tts.stop();
      Tts.removeAllListeners('tts-finish');
    };
  }, [userId, fetchFamilyMembers, sendMessage, messages.length, currentConversation, initialMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      messageScrollViewRef.current?.scrollToEnd({ animated: true });
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [messages, opacity]);

  const isLoading =
    familyLoading || budgetLoading || menusLoading || recipesLoading || storesLoading || mealHistoryLoading;

  if (!userId || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>
          {userId ? 'Chargement des données...' : 'Veuillez vous connecter.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.componentHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeChatComponentButton}
        >
          <AntDesign name="arrowleft" size={24} color="#e0e0e0" />
        </TouchableOpacity>
        <Text style={styles.componentTitle}>NutriBuddy AI</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.conversationScrollContainer}
      >
        {conversations.map((conversation) => (
          <View key={conversation.id || conversation.title} style={styles.conversationPage}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationTitle}>{conversation.title}</Text>
              <TouchableOpacity
                onPress={() => deleteConversation(conversation.id || '')}
                style={styles.deleteButton}
              >
                <AntDesign name="delete" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={messageScrollViewRef}
              contentContainerStyle={styles.chatContentContainer}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {currentConversation?.id === conversation.id ? (
                messages.length > 0 ? (
                  messages.map((item) => <View key={item.id}>{renderMessageItem({ item })}</View>)
                ) : (
                  <Text style={styles.welcomeText}>
                    Bienvenue ! Posez une question ou utilisez les suggestions pour commencer.
                  </Text>
                )
              ) : null}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Input
          value={inputText}
          onChangeText={setInputText}
          placeholder="Posez une question à NutriBuddy AI..."
          style={styles.input}
          multiline
        />
        <View style={styles.buttonGroup}>
          <IconButton
            iconName="image-outline"
            onPress={() => setIsImagePickerModalVisible(true)}
            color="#FFF"
            style={styles.iconButton}
          />
          <IconButton
            iconName="send"
            onPress={handleSendMessage}
            color="#FFF"
            style={[styles.iconButton, styles.sendButton]}
            disabled={!inputText.trim() && !selectedImage}
          />
          <IconButton
            iconName="lightbulb-on-outline"
            onPress={() => setIsSuggestionModalVisible(true)}
            color="#FFF"
            style={styles.iconButton}
          />
          <IconButton
            iconName="message-text-outline"
            onPress={() => setIsConversationModalVisible(true)}
            color="#FFF"
            style={styles.iconButton}
          />
        </View>
      </View>

      <View style={styles.utilityButtons}>
        <IconButton
          iconName={isSpeaking ? 'volume-high' : 'volume-off'}
          onPress={() => speakText(messages[messages.length - 1]?.content?.toString() || '')}
          color={isSpeaking ? '#FF6B00' : '#FFF'}
          style={styles.utilityButton}
          disabled={messages.length === 0}
        />
      </View>

      <ModalComponent
        visible={isNetworkErrorModalVisible}
        onClose={() => setIsNetworkErrorModalVisible(false)}
        title="Erreur de connexion"
      >
        <Text style={styles.modalMessageText}>{networkErrorMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isCopiedModalVisible}
        onClose={() => setIsCopiedModalVisible(false)}
        title="Information"
      >
        <Text style={styles.modalMessageText}>{copiedMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isMenuSelectedModalVisible}
        onClose={() => setIsMenuSelectedModalVisible(false)}
        title="Menu Sélectionné"
      >
        <Text style={styles.modalMessageText}>{menuSelectedMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isRecipeSelectedModalVisible}
        onClose={() => setIsRecipeSelectedModalVisible(false)}
        title="Recette Sélectionnée"
      >
        <Text style={styles.modalMessageText}>{recipeSelectedMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isImageErrorModalVisible}
        onClose={() => setIsImageErrorModalVisible(false)}
        title="Erreur d'image"
      >
        <Text style={styles.modalMessageText}>{imageErrorMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isTitleMissingModalVisible}
        onClose={() => setIsTitleMissingModalVisible(false)}
        title="Titre Manquant"
      >
        <Text style={styles.modalMessageText}>Veuillez entrer un titre pour la nouvelle conversation.</Text>
      </ModalComponent>

      <ModalComponent
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        title="Ajouter une image prédéfinie"
      >
        <View style={styles.imageGrid}>
          {['food1.jpg', 'food2.jpeg', 'recipe1.jpg'].map((img) => (
            <TouchableOpacity
              key={img}
              onPress={() => {
                setSelectedImage(`assets:/images/${img}`);
                setIsImageModalVisible(false);
                setInputText('J’ai ajouté une image prédéfinie.');
              }}
              style={styles.imageOption}
            >
              <Image source={{ uri: `assets/images/${img}` }} style={styles.tooltipImage} />
            </TouchableOpacity>
          ))}
        </View>
      </ModalComponent>

      <ModalComponent
        visible={isImagePickerModalVisible}
        onClose={() => setIsImagePickerModalVisible(false)}
        title="Sélectionner une image"
      >
        <View style={styles.pickerOptionsContainer}>
          <TouchableOpacity style={styles.pickerOptionButton} onPress={() => handleImagePick('camera')}>
            <MaterialIcons name="photo-camera" size={24} color="#FF6B00" />
            <Text style={styles.pickerOptionText}>Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerOptionButton} onPress={() => handleImagePick('gallery')}>
            <MaterialIcons name="photo-library" size={24} color="#FF6B00" />
            <Text style={styles.pickerOptionText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>

      <ModalComponent
        visible={isSuggestionModalVisible}
        onClose={() => setIsSuggestionModalVisible(false)}
        title="Suggestions"
      >
        <ScrollView contentContainerStyle={styles.suggestionList}>
          {[
            {
              title: 'Menu pour la semaine',
              description: 'Planifiez vos repas pour 7 jours avec 3 repas par jour.',
              options: { numDays: 7, numMealsPerDay: 3 },
              imageUri: 'eru.jpg',
            },
            {
              title: 'Recette rapide',
              description: 'Découvrez une recette italienne avec un niveau d’épices modéré.',
              options: { niveauEpices: 2, cuisinesPreferees: ['Italienne'] },
              imageUri: 'recipe.jpg',
            },
            {
              title: 'Liste de courses',
              description: 'Générez une liste basée sur votre menu actuel.',
              options: { menuId: menus[0]?.id },
              imageUri: 'koki.jpg',
            },
            {
              title: 'Idées créatives',
              description: 'Trouvez des idées pour un dîner de famille mémorable.',
              options: {},
              imageUri: 'menu.jpg',
            },
            {
              title: 'Analyse de recette',
              description: 'Obtenez des informations sur une recette existante.',
              options: {},
              imageUri: 'okok.jpg',
            },
            {
              title: 'Disponibilité d’ingrédient',
              description: 'Vérifiez si un ingrédient est disponible près de chez vous.',
              options: {},
              imageUri: 'ingredient.jpg',
            },
            {
              title: 'Informations nutritionnelles',
              description: 'Découvrez les bienfaits d’un aliment comme la pomme.',
              options: {},
              imageUri: 'pizza.jpg',
            },
            {
              title: 'Résoudre un problème',
              description: 'Trouvez des solutions pour des plats trop épicés.',
              options: {},
              imageUri: 'resete.jpg',
            },
            {
              title: 'Budget actuel',
              description: 'Consultez votre budget alimentaire actuel.',
              options: {},
              imageUri: 'shopping.jpg',
            },
            {
              title: 'Magasins proches',
              description: 'Découvrez les magasins à proximité pour vos courses.',
              options: {},
              imageUri: 'ia.jpg',
            },
          ].map((item) => (
            <SuggestionCard
              key={item.title}
              title={item.title}
              description={item.description}
              imageUri={item.imageUri}
              onPress={() => handlePredefinedQuestion(item.title, item.options)}
              onSendToAI={(message: string) => handlePredefinedQuestion(message)}
            />
          ))}
          {familyMembers.length > 0 && (
            <>
              <Text style={styles.suggestionSectionTitle}>Membres de la famille</Text>
              {familyMembers.map((member) => (
                <FamilyCard
                  key={member.id}
                  member={member}
                  onPress={() => handlePredefinedQuestion(`Informations sur ${member.prenom} ${member.nom}`)}
                  onSendToAI={(message: string) => handlePredefinedQuestion(message)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </ModalComponent>

      <ModalComponent
        visible={isConversationModalVisible}
        onClose={() => setIsConversationModalVisible(false)}
        title="Gérer les conversations"
      >
        <ScrollView contentContainerStyle={styles.suggestionList}>
          {conversations.map((item) => (
            <View key={item.id || item.title} style={styles.conversationItem}>
              <Text style={styles.conversationText}>{item.title}</Text>
              <View style={styles.conversationActions}>
                <IconButton
                  iconName="delete"
                  onPress={() => deleteConversation(item.id || '')}
                  color="#FF6B6B"
                  style={styles.smallIconButton}
                />
                <IconButton
                  iconName="arrow-right"
                  onPress={() => handleSelectExistingConversation(item.id || '')}
                  color="#27AE60"
                  style={styles.smallIconButton}
                  disabled={currentConversation?.id === item.id}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={handleNewConversationInitiation}
            style={styles.newConversationButton}
          >
            <Text style={styles.newConversationText}>Nouvelle conversation</Text>
          </TouchableOpacity>
        </ScrollView>
      </ModalComponent>

      <ModalComponent
        visible={isNewConversationModalVisible}
        onClose={() => setIsNewConversationModalVisible(false)}
        title="Nouvelle conversation"
      >
        <TextInput
          style={styles.newConversationInput}
          placeholder="Nom de la conversation"
          placeholderTextColor="#999"
          value={newConversationTitle}
          onChangeText={setNewConversationTitle}
        />
        <TouchableOpacity onPress={confirmNewConversation} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Créer</Text>
        </TouchableOpacity>
      </ModalComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeChatComponentButton: {
    padding: 5,
  },
  componentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  headerRightSpacer: {
    width: 24,
  },
  conversationScrollContainer: {
    flexGrow: 1,
  },
  conversationPage: {
    width,
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  conversationTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  chatContentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeText: {
    color: '#b0b0b0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },

  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
    position: 'relative',
  },
  userMessageBubble: {
    backgroundColor: '#FF6B00',
  },
  aiMessageBubble: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
  },
  senderName: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 4,
  },
  timestamp: {
    color: '#b0b0b0',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  copyIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  sentImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  iconButton: {
    backgroundColor: '#FF6B00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#27AE60',
  },
  utilityButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 32,
    right: 16,
    flexDirection: 'row',
  },
  utilityButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionList: {
    padding: 12,
  },
  suggestionSectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 8,
  },
  conversationText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  newConversationButton: {
    padding: 12,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  newConversationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  smallIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  imageOption: {
    margin: 8,
  },
  tooltipImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  pickerOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    width: '100%',
  },
  pickerOptionButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  pickerOptionText: {
    marginTop: 5,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  newConversationInput: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    width: '80%',
    alignSelf: 'center',
    color: '#FFF',
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
  },
  confirmButton: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    flexDirection: 'row',
    padding: 8,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default React.memo(GeminiChatScreen);
