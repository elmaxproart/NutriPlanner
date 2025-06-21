import React, { useRef, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../styles/theme';

interface RecordingModalProps {
  visible: boolean;
  isRecording: boolean;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClose: () => void;
}

const RecordingModal: React.FC<RecordingModalProps> = ({
  visible,
  isRecording,
  error,
  onStartRecording,
  onStopRecording,
  onClose,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isRecording) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isRecording]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isRecording ? 'Enregistrement en cours...' : error ? 'Erreur' : 'Prêt à enregistrer'}
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.microphoneContainer}>
            <LottieView
              ref={animationRef}
              source={require('../../assets/animations/no-data.json')}
              style={styles.lottieAnimation}
              loop={true}
              autoPlay={true}
            />
            {isRecording && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.indicator} />}
          </View>
          <TouchableOpacity
            style={[styles.actionButton, error && styles.disabledButton]}
            onPress={isRecording ? onStopRecording : onStartRecording}
            disabled={!!error} // Disable button if there's an error
            accessibilityLabel={isRecording ? 'Arrêter l’enregistrement' : 'Démarrer l’enregistrement'}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isRecording ? 'Arrêter' : 'Démarrer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Fermer le modal"
          >
            <Text style={styles.closeButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error || '#FF0000',
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    marginBottom: 16,
    textAlign: 'center',
  },
  microphoneContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
  indicator: {
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semiBold,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
});

export default RecordingModal;
