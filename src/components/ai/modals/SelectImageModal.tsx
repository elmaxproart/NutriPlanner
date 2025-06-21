import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface ImageItem {
  id: string;
  uri: string;
  name: string;
}

interface ImageCardProps {
  image: ImageItem;
  isSelected: boolean;
  onSelect: (imageItem: ImageItem) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, isSelected, onSelect }) => {
  const cardScale = useSharedValue(1);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    cardScale.value = withSpring(isSelected ? 1.05 : 1, {
      damping: 10,
      stiffness: 100,
    });
  }, [isSelected, cardScale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[commonStyles.card, styles.cardSpacing, isSelected && styles.selectedCard]}
      onPress={() => onSelect(image)}
      accessibilityLabel={`Sélectionner l'image ${image.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      testID={`image-card-${image.id}`}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedCardStyle]}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.surface]}
          style={commonStyles.cardGradient}
        >
          {imageError ? (
            <MaterialCommunityIcons
              name="image-broken"
              size={60}
              color={theme.colors.textSecondary}
              style={styles.image}
            />
          ) : (
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              accessibilityLabel={image.name}
              testID={`image-${image.id}`}
              onError={() => setImageError(true)}
            />
          )}
          <View style={styles.imageInfo}>
            <Text style={commonStyles.cardTitle} numberOfLines={1}>
              {image.name}
            </Text>
          </View>
          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={theme.colors.primary}
              style={styles.checkIcon}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface SelectImageModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (images: ImageItem[], isFinalStep?: boolean) => Promise<void>;
  title?: string;
  images?: ImageItem[];
  loading?: boolean;
  initialSelectedImages?: ImageItem[];
  allowMultipleSelection?: boolean;
  isFinalStep?: boolean;
}

const SelectImageModal: React.FC<SelectImageModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Sélectionner une image',
  images = [],
  loading = false,
  initialSelectedImages = [],
  allowMultipleSelection = false,
  isFinalStep = false,
}) => {
  const [allAvailableImages, setAllAvailableImages] = useState<ImageItem[]>(images);
  const [currentSelections, setCurrentSelections] = useState<ImageItem[]>(initialSelectedImages);
  const [isLoading, setIsLoading] = useState(loading);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);

  const handleLaunchImageLibrary = useCallback(() => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 200,
      selectionLimit: allowMultipleSelection ? 0 : 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        if (allAvailableImages.length === 0 && currentSelections.length === 0) {
          onClose();
        }
      } else if (response.errorMessage) {
        AccessibilityInfo.announceForAccessibility(`Erreur de sélection d'image : ${response.errorMessage}`);
      } else if (response.assets) {
        const pickedImages: ImageItem[] = response.assets
          .map((asset: Asset) => ({
            id: asset.uri || `${new Date().getTime()}-${Math.random()}`,
            uri: asset.uri || '',
            name: asset.fileName || 'Image sélectionnée',
          }))
          .filter((img) => img.uri !== '');

        setAllAvailableImages((prevImages) => {
          const combined = [...prevImages, ...pickedImages];
          return Array.from(new Map(combined.map((item) => [item.uri, item])).values());
        });

        if (allowMultipleSelection) {
          setCurrentSelections((prev) => {
            const newSelections = [...prev, ...pickedImages];
            return Array.from(new Map(newSelections.map((item) => [item.id, item])).values());
          });
        } else if (pickedImages.length > 0) {
          setCurrentSelections([pickedImages[0]]);
        } else {
          setCurrentSelections([]);
        }

        AccessibilityInfo.announceForAccessibility(`${pickedImages.length} image(s) sélectionnée(s) depuis la galerie.`);
      }
    });
  }, [allAvailableImages, currentSelections, onClose, allowMultipleSelection]);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      modalTranslateY.value = withTiming(0, {
        duration: theme.animation.duration,
        easing: Easing.inOut(Easing.ease),
      });
      AccessibilityInfo.announceForAccessibility('Modal de sélection d’image ouvert');
      setAllAvailableImages(images.length > 0 ? images : initialSelectedImages);
      setCurrentSelections(initialSelectedImages);
      if (images.length === 0 && initialSelectedImages.length === 0) {
        handleLaunchImageLibrary();
      }
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setCurrentSelections([]);
        setAllAvailableImages([]);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, images, initialSelectedImages, handleLaunchImageLibrary]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleImageCardSelect = useCallback((image: ImageItem) => {
    setCurrentSelections((prevSelections) => {
      const isAlreadySelected = prevSelections.some((item) => item.id === image.id);
      if (allowMultipleSelection) {
        return isAlreadySelected
          ? prevSelections.filter((item) => item.id !== image.id)
          : [...prevSelections, image];
      } else {
        return isAlreadySelected ? [] : [image];
      }
    });
  }, [allowMultipleSelection]);

  const handleConfirm = useCallback(async () => {
    if (currentSelections.length > 0) {
      await onSelect(currentSelections, isFinalStep);
      onClose();
      AccessibilityInfo.announceForAccessibility(`${currentSelections.length} image(s) confirmée(s).`);
    }
  }, [currentSelections, onSelect, isFinalStep, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal de sélection d’image"
      testID="select-image-modal"
    >
      <View style={commonStyles.modalOverlay}>
        <Animated.View style={[commonStyles.modalContainer, animatedModalStyle]}>
          <TouchableOpacity
            style={commonStyles.closeModalButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
            testID="close-button"
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={commonStyles.modalHeaderTitle} testID="modal-title">
            {title}
          </Text>

          <TouchableOpacity
            style={styles.pickImageButton}
            onPress={handleLaunchImageLibrary}
            accessibilityLabel="Sélectionner une image depuis la galerie"
            testID="launch-library-button"
          >
            <LinearGradient
              colors={[theme.colors.secondary, theme.colors.primary]}
              style={commonStyles.buttonGradient}
            >
              <MaterialCommunityIcons
                name="image-plus"
                size={24}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.pickImageButtonText}>
                {allowMultipleSelection ? 'Ajouter des images' : 'Choisir une autre image'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {isLoading ? (
            <View style={commonStyles.centeredContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={commonStyles.textSecondary}>Chargement...</Text>
            </View>
          ) : allAvailableImages.length === 0 ? (
            <View style={commonStyles.centeredContainer}>
              <Text style={commonStyles.textSecondary}>
                Aucune image n'a été ajoutée.
              </Text>
              <Text style={commonStyles.textSecondary}>
                Appuyez sur "Ajouter des images" pour commencer.
              </Text>
            </View>
          ) : (
            <FlatList
              data={allAvailableImages}
              renderItem={({ item }) => (
                <ImageCard
                  image={item}
                  isSelected={currentSelections.some((img) => img.id === item.id)}
                  onSelect={handleImageCardSelect}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={commonStyles.verticalListContent}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              accessibilityLabel="Liste des images sélectionnées ou disponibles"
              testID="images-list"
            />
          )}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={currentSelections.length === 0}
            accessibilityLabel={`Confirmer la sélection de ${currentSelections.length} image(s)`}
            testID="confirm-button"
          >
            <LinearGradient
              colors={
                currentSelections.length > 0
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : ['#666', '#666']
              }
              style={commonStyles.buttonGradient}
            >
              <Text style={commonStyles.buttonText}>
                {isFinalStep ? 'Terminer' : 'Confirmer'} {currentSelections.length > 0 ? `(${currentSelections.length})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardSpacing: {
    margin: theme.spacing.xs,
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  image: {
    width: '80%',
    height: '60%',
    borderRadius: theme.borderRadius.medium,
    resizeMode: 'cover',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  imageInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  checkIcon: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    overflow: 'hidden',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  pickImageButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.medium,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
});

export default SelectImageModal;
