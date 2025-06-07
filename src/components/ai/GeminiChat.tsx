import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { styles as geminiStyles } from '../../styles/geminiStyle';
import { useAIConversation } from '../../hooks/useAIConversation';
import { useAuth } from '../../hooks/useAuth';
import { useBudget } from '../../hooks/useBudget';
import { useFamilyData } from '../../hooks/useFamilyData';
import { useMealHistory } from '../../hooks/useMealHistory';
import { useMenus } from '../../hooks/useMenus';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRecipes } from '../../hooks/useRecipes';
import { useStores } from '../../hooks/useStores';
import { Avatar } from '../common/Avatar';
import { IconButton } from '../common/IconButton';
import { Input } from '../common/Input';
import { ModalComponent } from '../common/Modal';
import MenuSuggestion from './template/MenuSuggestion';
import RecipeSuggestion from './template/RecipeSuggestion';
import ShoppingListSuggestion from './template/ShoppingListSuggestion';
import type {
  Menu,
  Recette,
  MembreFamille,
  Budget,
  Store,
  HistoriqueRepas,
  ListeCourses,
} from '../../constants/entities';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Types pour les messages
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
  | HistoriqueRepas[]
  | object;

interface ChatMessage {
  id: string;
  content: MessageContent;
  isUser: boolean;
  timestamp: string;
  type: MessageType;
  imageUrl?: string;
}

// Composant LoadingMessage
const LoadingMessage = () => (
  <View style={geminiStyles.geminiLoadingContainer}>
    <ActivityIndicator size="small" color="#00BFFF" />
    <Text style={geminiStyles.geminiLoadingText}>NutriBuddy AI réfléchit...</Text>
  </View>
);

// Composant TypingText pour l'effet de frappe
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
      }, 50); // Vitesse de frappe ajustable (50ms par caractère)
      return () => clearInterval(timer);
    }
  }, [text]);

  return <Text style={geminiStyles.messageText}>{displayedText || text}</Text>;
};

const GeminiChat = ({ _navigation }: { _navigation?: any }) => {
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
  } = useAIConversation({ familyId: 'family1' });
  const { familyMembers, fetchFamilyMembers } = useFamilyData(userId || '', 'family1');
  const { budgets } = useBudget(userId || '', 'family1');
  const { menus } = useMenus(userId || '', 'family1');
  const { recipes } = useRecipes(userId || '', 'family1');
  const { stores } = useStores(userId || '', 'family1');
  const { mealHistory } = useMealHistory(userId || '', 'family1');
  const { isConnected } = useNetworkStatus();

  const [inputText, setInputText] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSuggestionModalVisible, setIsSuggestionModalVisible] = useState(false);
  const [isConversationModalVisible, setIsConversationModalVisible] = useState(false);
  const [isNewConversationModalVisible, setIsNewConversationModalVisible] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [_selectedMenu, _setSelectedMenu] = useState<Menu | null>(null);
  const [_selectedRecipe, _setSelectedRecipe] = useState<Recette | null>(null);
  const [_shoppingItems, _setShoppingItems] = useState<
    { nom: string; quantite: number; unite: string; checked?: boolean }[]
  >([]);

  // Modals personnalisés
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
  const [isFeatureDisabledModalVisible, setIsFeatureDisabledModalVisible] = useState(false);
  const [featureDisabledMessage] = useState('');
  const [isTitleMissingModalVisible, setIsTitleMissingModalVisible] = useState(false);
  const [titleMissingMessage, setTitleMissingMessage] = useState('');

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 300, easing: Easing.ease }),
  }));

  const messages: ChatMessage[] = useMemo(() =>
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

  useEffect(() => {
    const initialize = async () => {
      try {
        Tts.setDefaultLanguage('fr-FR');
        Tts.setDefaultRate(0.5);
        Tts.setDefaultPitch(1.0);
        await fetchFamilyMembers();
        if (messages.length === 0 && !currentConversation) {
          await sendMessage(
            'Bonjour ! Je suis NutriBuddy AI. Comment puis-je vous aider aujourd\'hui ?'
          );
        }
      } catch (err: any) {
        Alert.alert('Erreur critique', 'Impossible de charger les données initiales. ' + err.message);
      }
    };
    initialize();

    return () => {
      Tts.stop();
      Voice.destroy().then(() => Voice.removeAllListeners());
    };
  }, [fetchFamilyMembers, sendMessage, messages.length, currentConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
      opacity.value = 1;
    }
  }, [messages, opacity]);

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInputText(e.value[0]);
      }
      setIsListening(false);
    };
    Voice.onSpeechError = () => {
      setIsListening(false);
    };
    return () => Voice.removeAllListeners();
  }, []);

  const speakText = (text: string) => {
    setIsSpeaking(true);
    Tts.speak(text);
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
  };

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

    addLoadingMessage();
    await sendMessage(
      inputText,
      undefined,
      selectedImage ? { uri: selectedImage, mimeType: 'image/jpeg', base64: '' } : undefined
    );
    setInputText('');
    setSelectedImage('');
  }, [inputText, selectedImage, isConnected, addLoadingMessage, sendMessage]);

  const handleGenerateList = useCallback(() => {
    const menu = menus[0];
    if (menu) {
      generateShoppingList(menu, []).then((list) => {
        _setShoppingItems(
          list.map((item) => ({
            nom: item.nom,
            quantite: item.quantite,
            unite: item.unite,
          }))
        );
      });
    }
  }, [menus, generateShoppingList, _setShoppingItems]);

  const handleImagePick = useCallback(async (source: 'camera' | 'gallery') => {
    setIsImagePickerModalVisible(false);
    const options = {
      mediaType: 'photo' as 'photo',
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 200,
    };

    let result;
    if (source === 'camera') {
      result = await launchCamera(options);
    } else {
      result = await launchImageLibrary(options);
    }

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      setImageErrorMessage('Impossible de charger l\'image. Erreur: ' + result.errorMessage);
      setIsImageErrorModalVisible(true);
    } else if (result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri || '');
      setInputText('J\'ai ajouté une image, que pensez-vous de ça ?');
    }
  }, []);

  const handlePredefinedQuestion = useCallback(
    async (question: string, options?: { [key: string]: any }) => {
      addLoadingMessage();
      let systemInstruction = `Réponds en français. ${question}`;
      if (options) {systemInstruction += `. Options : ${JSON.stringify(options)}`;}

      try {
        if (question.includes('Suggérer un menu')) {
          const menuSuggestions = await getMenuSuggestions([], familyMembers, options?.numDays, options?.numMealsPerDay);
          await sendMessage(JSON.stringify(menuSuggestions), systemInstruction);
        } else if (question.includes('Proposer une recette')) {
          const recipeSuggestions = await generateRecipeSuggestions([], {
            niveauEpices: options?.niveauEpices || 2,
            cuisinesPreferees: options?.cuisinesPreferees || ['Italienne'],
            mealType: options?.mealType,
          });
          await sendMessage(JSON.stringify(recipeSuggestions), systemInstruction);
        } else if (question.includes('Générer une liste de courses')) {
          const menu = menus[0];
          if (menu) {
            const shoppingList = await generateShoppingList(menu, []);
            _setShoppingItems(
              shoppingList.map((item) => ({
                nom: item.nom,
                quantite: item.quantite,
                unite: item.unite,
              }))
            );
            await sendMessage(JSON.stringify(shoppingList), systemInstruction);
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
          await sendMessage(
            familyMembers.map((m) => `${m.prenom} ${m.nom}`).join(', '),
            systemInstruction
          );
        } else if (question.includes('Budget')) {
          const currentBudget = budgets[0];
          await sendMessage(
            currentBudget ? `Plafond: ${currentBudget.plafond}€` : 'Aucun budget',
            systemInstruction
          );
        } else if (question.includes('Historique des repas')) {
          await sendMessage(
            mealHistory.map((h) => h.typeRepas).join(', '),
            systemInstruction
          );
        } else if (question.includes('Magasins')) {
          await sendMessage(stores.map((s) => s.nom).join(', '), systemInstruction);
        }
      } catch (err: any) {
        await sendMessage(`Erreur: ${err.message}`);
      }
      setIsSuggestionModalVisible(false);
    },
    [
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
      mealHistory,
      stores,
      _setShoppingItems,
    ]
  );

  const handleSelectMenu = useCallback((menu: Menu) => {
    _setSelectedMenu(menu);
    setMenuSelectedMessage(`Vous avez choisi : ${menu.typeRepas}`);
    setIsMenuSelectedModalVisible(true);
  }, [_setSelectedMenu]);

  const handleSelectRecipe = useCallback((recipe: Recette) => {
    _setSelectedRecipe(recipe);
    setRecipeSelectedMessage(`Vous avez choisi : ${recipe.nom}`);
    setIsRecipeSelectedModalVisible(true);
  }, [_setSelectedRecipe]);

  const handleToggleItem = useCallback((id: string) => {
    _setShoppingItems((prev) =>
      prev.map((item) =>
        item.nom === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, [_setShoppingItems]);

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
            <Text style={geminiStyles.messageText}>{String(item.content)}</Text>
            <Image
              source={{ uri: item.imageUrl }}
              style={geminiStyles.sentImage}
              resizeMode="contain"
            />
          </View>
        );
      } else if (Array.isArray(item.content)) {
        if (item.type === 'menu_suggestion') {
          messageContent = (
            <MenuSuggestion
              menus={item.content as Menu[]}
              onSelectMenu={handleSelectMenu}
            />
          );
        } else if (item.type === 'recipe_suggestion') {
          messageContent = (
            <RecipeSuggestion
              recipes={item.content as Recette[]}
              onSelectRecipe={handleSelectRecipe}
            />
          );
        } else if (item.type === 'shopping_list_suggestion') {
          messageContent = (
            <ShoppingListSuggestion
              items={(item.content as ListeCourses[]).flatMap((list) =>
                'items' in list && Array.isArray(list.items)
                  ? list.items.map((i) => ({
                      id: i.ingredientId,
                      ingredientId: i.ingredientId,
                      nom: i.ingredientId,
                      quantite: i.quantite,
                      unite: i.unite,
                    }))
                  : []
              )}
              onToggleItem={handleToggleItem}
              onGenerateList={handleGenerateList}
            />
          );
        } else {
          messageContent = <Text style={geminiStyles.messageText}>{JSON.stringify(item.content, null, 2)}</Text>;
        }
      } else if (typeof item.content === 'object' && item.content !== null) {
        messageContent = <Text style={geminiStyles.messageText}>{JSON.stringify(item.content, null, 2)}</Text>;
      } else {
        messageContent = <Text style={geminiStyles.messageText}>{String(item.content)}</Text>;
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
          <View
            style={[
              geminiStyles.messageBubble,
              isUser ? geminiStyles.userMessageBubble : geminiStyles.aiMessageBubble,
            ]}
          >
            <Text style={geminiStyles.senderName}>{senderName}</Text>
            {messageContent}
            <Text style={geminiStyles.timestamp}>{item.timestamp}</Text>
            <TouchableOpacity
              onPress={() => {
                const textToCopy =
                  typeof item.content === 'string' || typeof item.content === 'number' || typeof item.content === 'boolean'
                    ? String(item.content)
                    : JSON.stringify(item.content, null, 2);
                Clipboard.setString(textToCopy);
                setCopiedMessage('Copié !');
                setIsCopiedModalVisible(true);
              }}
              style={geminiStyles.copyIcon}
            >
              <AntDesign name="copy1" size={16} color="#b0b0b0" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [animatedStyle, handleGenerateList, handleSelectMenu, handleSelectRecipe, handleToggleItem]
  );

  const handleNewConversationInitiation = () => {
    setIsNewConversationModalVisible(true);
  };

  const confirmNewConversation = async () => {
    if (newConversationTitle.trim()) {
      await createNewConversation(newConversationTitle.trim());
      setNewConversationTitle('');
      setIsNewConversationModalVisible(false);
      await sendMessage('Bonjour ! Je suis NutriBuddy AI. Comment puis-je vous aider aujourd\'hui ?');
    } else {
      setTitleMissingMessage('Veuillez entrer un titre pour la nouvelle conversation.');
      setIsTitleMissingModalVisible(true);
    }
  };

  const handleSelectExistingConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setIsConversationModalVisible(false);
  };

  return (
    <View style={geminiStyles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={geminiStyles.chatContentContainer}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      <View style={geminiStyles.inputContainer}>
        <Input
          value={inputText}
          onChangeText={setInputText}
          placeholder="Posez une question à NutriBuddy AI..."
          style={geminiStyles.input}
          multiline
        />
        <View style={geminiStyles.buttonGroup}>
          <IconButton
            iconName={isListening ? 'microphone-off' : 'microphone'}
            onPress={
              isListening
                ? () => Voice.stop()
                : () => Voice.start('fr-FR').then(() => setIsListening(true))
            }
            color={isListening ? '#FF6B6B' : '#FFF'}
            style={geminiStyles.iconButton}
          />
          <IconButton
            iconName="picture"
            onPress={() => setIsImagePickerModalVisible(true)}
            color="#FFF"
            style={geminiStyles.iconButton}
          />
          <IconButton
            iconName="right"
            onPress={handleSendMessage}
            color="#FFF"
            style={[geminiStyles.iconButton, geminiStyles.sendButton]}
            disabled={!inputText.trim() && !selectedImage}
          />
          <IconButton
            iconName="bulb1"
            onPress={() => setIsSuggestionModalVisible(true)}
            color="#FFF"
            style={geminiStyles.iconButton}
          />
          <IconButton
            iconName="message1"
            onPress={() => setIsConversationModalVisible(true)}
            color="#FFF"
            style={geminiStyles.iconButton}
          />
        </View>
      </View>

      <View style={styles.utilityButtons}>
        <IconButton
          iconName={isSpeaking ? 'sound' : 'soundmute'}
          onPress={() => speakText(messages[messages.length - 1]?.content?.toString() || '')}
          color={isSpeaking ? '#00BFFF' : '#FFF'}
          style={styles.utilityButton}
          disabled={messages.length === 0}
        />
      </View>

      {/* Modals */}
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
        visible={isFeatureDisabledModalVisible}
        onClose={() => setIsFeatureDisabledModalVisible(false)}
        title="Fonctionnalité"
      >
        <Text style={styles.modalMessageText}>{featureDisabledMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isTitleMissingModalVisible}
        onClose={() => setIsTitleMissingModalVisible(false)}
        title="Titre Manquant"
      >
        <Text style={styles.modalMessageText}>{titleMissingMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        title="Ajouter une image prédéfinie"
      >
        <View style={styles.imageGrid}>
          {['food1.jpg', 'food2.jpg', 'recipe1.jpg'].map((img) => (
            <TouchableOpacity
              key={img}
              onPress={() => {
                setSelectedImage(`asset:/images/${img}`);
                setIsImageModalVisible(false);
                setInputText('J\'ai ajouté une image prédéfinie.');
              }}
              style={styles.imageOption}
            >
              <Image
                source={{ uri: `asset:/images/${img}` }}
                style={styles.thumbnail}
              />
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
          <TouchableOpacity
            style={styles.pickerOptionButton}
            onPress={() => handleImagePick('camera')}
          >
            <AntDesign name="camerao" size={24} color="#00BFFF" />
            <Text style={styles.pickerOptionText}>Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickerOptionButton}
            onPress={() => handleImagePick('gallery')}
          >
            <AntDesign name="picture" size={24} color="#00BFFF" />
            <Text style={styles.pickerOptionText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>
      </ModalComponent>

      <ModalComponent
        visible={isSuggestionModalVisible}
        onClose={() => setIsSuggestionModalVisible(false)}
        title="Questions prédéfinies"
      >
        <FlatList
          data={[
            { text: 'Suggérer un menu pour la semaine', options: { numDays: 7, numMealsPerDay: 3 } },
            { text: 'Proposer une recette', options: { niveauEpices: 2, cuisinesPreferees: ['Italienne'] } },
            { text: 'Générer une liste de courses', options: { menuId: menus[0]?.id } },
            { text: 'Donner des idées créatives pour un repas', options: {} },
            { text: 'Analyse une recette', options: {} },
            { text: 'Vérifier la disponibilité d\'un ingrédient', options: {} },
            { text: 'Informations nutritionnelles', options: {} },
            { text: 'Résoudre un problème', options: {} },
            { text: 'Informations sur la famille', options: {} },
            { text: 'Budget', options: {} },
            { text: 'Historique des repas', options: {} },
            { text: 'Magasins', options: {} },
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePredefinedQuestion(item.text, item.options)}
              style={geminiStyles.suggestionItem}
            >
              <Text style={geminiStyles.suggestionText}>{item.text}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.text}
          contentContainerStyle={geminiStyles.suggestionList}
        />
      </ModalComponent>

      <ModalComponent
        visible={isConversationModalVisible}
        onClose={() => setIsConversationModalVisible(false)}
        title="Gérer les conversations"
      >
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <View style={geminiStyles.conversationItem}>
              <Text style={geminiStyles.conversationText}>{item.title}</Text>
              <View style={geminiStyles.conversationActions}>
                <IconButton
                  iconName="delete"
                  onPress={() => deleteConversation(item.id || '')}
                  color="#FF6B6B"
                  style={geminiStyles.smallIconButton}
                />
                <IconButton
                  iconName="arrowright"
                  onPress={() => handleSelectExistingConversation(item.id || '')}
                  color="#27AE60"
                  style={geminiStyles.smallIconButton}
                  disabled={currentConversation?.id === item.id}
                />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id || item.title}
          ListFooterComponent={
            <TouchableOpacity
              onPress={handleNewConversationInitiation}
              style={geminiStyles.newConversationButton}
            >
              <Text style={geminiStyles.newConversationText}>Nouvelle conversation</Text>
            </TouchableOpacity>
          }
        />
      </ModalComponent>

      <ModalComponent
        visible={isNewConversationModalVisible}
        onClose={() => setIsNewConversationModalVisible(false)}
        title="Nouvelle conversation"
      >
        <TextInput
          style={styles.newConversationInput}
          placeholder="Nom de la conversation"
          placeholderTextColor="#ccc"
          value={newConversationTitle}
          onChangeText={setNewConversationTitle}
        />
        <TouchableOpacity
          onPress={confirmNewConversation}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>Créer</Text>
        </TouchableOpacity>
      </ModalComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: { fontSize: 14, color: '#FFF', marginVertical: 2 },
  utilityButtons: { position: 'absolute', top: 16, right: 16, flexDirection: 'row' },
  utilityButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOption: { margin: 8 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  thumbnail: { width: 80, height: 80, borderRadius: 8 },
  pickerOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, width: '100%' },
  pickerOptionButton: { alignItems: 'center', padding: 10 },
  pickerOptionText: { marginTop: 5, color: '#333', fontSize: 16 },
  newConversationInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    width: '80%',
    alignSelf: 'center',
    color: '#FFF',
  },
  confirmButton: {
    backgroundColor: '#00BFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
    marginTop: 10,
  },
  confirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalMessageText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 10 },
});

export default GeminiChat;
