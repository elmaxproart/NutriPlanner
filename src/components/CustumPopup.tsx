import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

// Icônes locales (à ajuster selon tes assets)
const icons = {
  info: require('../assets/icons/info.png'),
  alert: require('../assets/icons/alert.png'),
  error: require('../assets/icons/error.png'),
  success: require('../assets/icons/success.png'),
};

type Props = {
  visible: boolean;
  onClose: () => void;
  type: 'info' | 'alert' | 'error' | 'success';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const CustomPopup: React.FC<Props> = ({ visible, onClose, type, message, actionLabel = 'Fermer', onAction }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animatable.View animation="zoomIn" duration={400} style={styles.container}>
          <LinearGradient
            colors={['#ffffff', '#f0f4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Image source={icons[type]} style={styles.icon} />
            <Text style={styles.title}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                // eslint-disable-next-line react-native/no-inline-styles
                style={[styles.button, onAction && { flex: 1, marginRight: 8 }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              {onAction && (
                <TouchableOpacity
                  style={[styles.button, styles.actionButton]}
                  onPress={() => {
                    onAction();
                    onClose();
                  }}
                >
                  <LinearGradient
                    colors={['#4285f4', '#34a853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>{actionLabel}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: 'transparent',
    flex: 1,
    paddingVertical: 0,
  },
  actionButtonGradient: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomPopup;
