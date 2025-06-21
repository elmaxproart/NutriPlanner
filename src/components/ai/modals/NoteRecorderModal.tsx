import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles } from '../../../styles/commonStyles';
import { theme } from '../../../styles/theme';

interface Note {
  text: string;
  audioUri?: string;
}

interface NoteRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (note: Note) => Promise<void>;
  title?: string;
  initialNote?: Note;
  isFinalStep?: boolean;
}

const NoteRecorderModal: React.FC<NoteRecorderModalProps> = ({
  visible,
  onClose,
  onSave,
  title = 'Enregistrer une note',
  initialNote = { text: '', audioUri: undefined },
  isFinalStep = false,
}) => {
  const [textNote, setTextNote] = useState(initialNote.text);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | undefined>(initialNote.audioUri);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      modalTranslateY.value = withTiming(0, { duration: theme.animation.duration, easing: Easing.inOut(Easing.ease) });
      AccessibilityInfo.announceForAccessibility('Modal d’enregistrement de note ouvert');
      setTextNote(initialNote.text);
      setAudioUri(initialNote.audioUri);
    } else {
      modalOpacity.value = withTiming(0, { duration: theme.animation.duration });
      modalTranslateY.value = withTiming(50, { duration: theme.animation.duration }, () => {
        setTextNote('');
        setAudioUri(undefined);
        setIsRecording(false);
        setRecordingDuration(0);
      });
    }
  }, [modalOpacity, modalTranslateY, visible, initialNote]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      timer = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
    return () => {
      if (timer) {clearInterval(timer);}
    };
  }, [isRecording, pulseScale]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleRecordToggle = useCallback(async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setAudioUri('mock_audio_uri.mp3');
        setRecordingDuration(0);
      } else {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erreur lors de l’enregistrement:', error);
      AccessibilityInfo.announceForAccessibility('Erreur lors de l’enregistrement');
    }
  }, [isRecording]);

  const handlePlayAudio = useCallback(() => {
    if (audioUri) {
      AccessibilityInfo.announceForAccessibility('Lecture de la note vocale');
    }
  }, [audioUri]);

  const handleSave = useCallback(async () => {
    if (textNote.trim() || audioUri) {
      await onSave({ text: textNote.trim(), audioUri });
      onClose();
      AccessibilityInfo.announceForAccessibility('Note sauvegardée');
    }
  }, [textNote, audioUri, onSave, onClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessible
      accessibilityLabel="Modal d’enregistrement de note"
      testID="note-recorder-modal"
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

          <Text style={commonStyles.textSecondary}>
            Enregistrez une note vocale ou saisissez une idée, comme une soupe egusi.
          </Text>

          <View style={styles.recorderContainer}>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleRecordToggle}
              accessibilityLabel={isRecording ? 'Arrêter l’enregistrement' : 'Démarrer l’enregistrement'}
              testID="record-button"
            >
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={commonStyles.buttonGradient}
              >
                <Animated.View style={animatedPulseStyle}>
                  <MaterialCommunityIcons
                    name={isRecording ? 'stop-circle' : 'microphone'}
                    size={30}
                    color={theme.colors.textPrimary}
                  />
                </Animated.View>
                <Text style={commonStyles.buttonText}>
                  {isRecording ? 'Arrêter' : 'Enregistrer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isRecording && (
              <Text style={styles.durationText} testID="recording-duration">
                {formatDuration(recordingDuration)}
              </Text>
            )}

            {audioUri && (
              <TouchableOpacity
                style={[commonStyles.button, styles.playButton]}
                onPress={handlePlayAudio}
                accessibilityLabel="Écouter la note vocale"
                testID="play-button"
              >
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.primary]}
                  style={commonStyles.buttonGradient}
                >
                  <MaterialCommunityIcons
                    name="play-circle"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={commonStyles.buttonText}>Écouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[commonStyles.input, styles.textInput]}
            placeholder="Saisissez votre note ici..."
            placeholderTextColor={theme.colors.textSecondary}
            value={textNote}
            onChangeText={setTextNote}
            multiline
            accessibilityLabel="Champ de saisie de note"
            testID="text-input"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={onClose}
              accessibilityLabel="Annuler"
              testID="cancel-button"
            >
              <LinearGradient
                colors={['#666', '#999']}
                style={commonStyles.buttonGradient}
              >
                <Text style={commonStyles.buttonText}>Annuler</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleSave}
              disabled={!textNote.trim() && !audioUri}
              accessibilityLabel="Sauvegarder la note"
              testID="save-button"
            >
              <LinearGradient
                colors={
                  textNote.trim() || audioUri
                    ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                    : ['#666', '#666']
                }
                style={commonStyles.buttonGradient}
              >
                <Text style={commonStyles.buttonText}>
                  {isFinalStep ? 'Terminer' : 'Sauvegarder'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  recorderContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  durationText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fonts.sizes.medium,
    marginTop: theme.spacing.sm,
  },
  playButton: {
    marginTop: theme.spacing.md,
  },
  textInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
});

export default NoteRecorderModal;
