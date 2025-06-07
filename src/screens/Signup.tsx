import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useSignUpFnAuth } from '../hooks/SignUpFnAuth';
import { ModalComponent } from '../components/common/Modal';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the root stack param list for navigation types
type RootStackParamList = {
  Login: undefined;
  // Add other routes relevant to Signup's navigation actions if any
};

// Define navigation prop type
type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface SignupProps {
  navigation: SignupScreenNavigationProp;
}

const Signup: React.FC<SignupProps> = ({ navigation }) => {
  const imageSource: ImageSourcePropType = require('../assets/images/hamburgeur.jpg');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const { signUp, loading: isLoading, error: authError } = useSignUpFnAuth();

  const [isErrorModalVisible, setIsErrorModalVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isInfoModalVisible, setIsInfoModalVisible] = React.useState(false);
  const [infoMessage, setInfoMessage] = React.useState('');


  const handleSignup = async () => {
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
      setIsErrorModalVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      setIsErrorModalVisible(true);
      return;
    }

    try {

      const result = await signUp(email, password, { nom: '', prenom: '' }); // Pass initialData if needed
      if (result) {
        setInfoMessage('Compte créé avec succès ! Veuillez vous connecter.');
        setIsInfoModalVisible(true);
        navigation.replace('Login'); // Navigate after successful signup
      } else if (authError) {
          setErrorMessage(authError);
          setIsErrorModalVisible(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
      setIsErrorModalVisible(true);
    }
  };

  const handleGoogleSignup = () => {
    setInfoMessage('Connexion via Google à implémenter.');
    setIsInfoModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.loginButton, { backgroundColor: '#f7b733' }]}
          onPress={handleSignup}
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.googleButton, { backgroundColor: '#4285F4' }]}
          onPress={handleGoogleSignup}
        >
          <AntDesign name="google" size={20} color="#fff" />
          <Text style={styles.loginText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>

      {/* Modals for messages */}
      <ModalComponent
        visible={isErrorModalVisible}
        onClose={() => setIsErrorModalVisible(false)}
        title="Erreur"
      >
        <Text style={styles.modalMessageText}>{errorMessage}</Text>
      </ModalComponent>

      <ModalComponent
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        title="Information"
      >
        <Text style={styles.modalMessageText}>{infoMessage}</Text>
      </ModalComponent>

    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 15,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center', // Center content for ActivityIndicator
    flexDirection: 'row', // Align icon and text if used
  },
  googleButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row', // Align icon and text
    justifyContent: 'center', // Center content
    gap: 10, // Space between icon and text
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  linkText: {
    color: '#f7b733',
  },
  // New style for modal message text (consistent with GeminiChat)
  modalMessageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

