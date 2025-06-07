import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import auth from '@react-native-firebase/auth';
import { ModalComponent } from '../components/common/Modal';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

// Define navigation prop type
type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMessage('Veuillez entrer votre adresse e-mail.');
      setIsErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await auth().sendPasswordResetEmail(email.trim());
      setSuccessMessage('Un e-mail de réinitialisation du mot de passe a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception (et vos spams).');
      setIsSuccessModalVisible(true);
      // Optionally navigate back to Login after a short delay
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        navigation.goBack();
      }, 3000); // Give user time to read the message
    } catch (err: any) {
      console.error('Password reset error:', err);
      let userFriendlyMessage = 'Une erreur est survenue lors de l\'envoi de l\'e-mail de réinitialisation.';

      // More specific error messages for Firebase Auth
      if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = 'L\'adresse e-mail est mal formatée.';
      } else if (err.code === 'auth/user-not-found') {
        userFriendlyMessage = 'Aucun utilisateur trouvé avec cette adresse e-mail.';
      }

      setErrorMessage(userFriendlyMessage);
      setIsErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Mimicking the video container with just a background if no video is used */}
      <View style={styles.topSection}>
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.smokeOverlay}
        />
        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          onPress={handleResetPassword}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ width: '100%' }}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#fc4a1a', '#f7b733']}
            style={styles.resetButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                <AntDesign name="mail" size={18} color="#fff" /> Envoyer un lien
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToLoginButton}>
          <Text style={styles.linkText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <ModalComponent
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        title="Succès"
      >
        <Text style={styles.modalMessageText}>{successMessage}</Text>
      </ModalComponent>

      {/* Error Modal */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topSection: {
    flex: 1.3,
    position: 'relative',
    backgroundColor: '#333', // Placeholder for the top image/video area
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    position: 'relative',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  smokeOverlay: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 20,
  },
  resetButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // To align icon and text
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backToLoginButton: {
    marginTop: 10,
    padding: 10,
  },
  linkText: {
    color: '#f7b733',
    fontWeight: 'bold',
  },
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

