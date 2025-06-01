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
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { signUp } from '../hooks/SignUpFnAuth';

const Signup: React.FC<{ navigation: any }> = ({ navigation }) => {
  const imageSource: ImageSourcePropType = require('../assets/images/hamburgeur.jpg');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoding ,setIsloding] =React.useState(false)

  const handleSignup = async () => {
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsloding(true)
      await signUp(email, password);
      setIsloding(false);
      navigation.replace('Login');

    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : String(err));
    }
  };

   if (isLoding) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      );
    }
  

  const handleGoogleSignup = () => {
    Alert.alert('Info', 'Connexion via Google à implémenter.');
    // TODO: Logique d'auth Google
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
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
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity onPress={handleSignup} style={{ width: '100%' }}>
          <LinearGradient colors={['#fc4a1a', '#f7b733']} style={styles.loginButton}>
            <Text style={styles.loginText}>
              <AntDesign name="adduser" size={18} color="#fff" /> Sign Up
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoogleSignup} style={{ width: '100%' }}>
          <LinearGradient colors={['#4285F4', '#34A853']} style={styles.googleButton}>
            <Text style={styles.loginText}>
              <AntDesign name="google" size={18} color="#fff" /> Sign up with Google
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
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
  },
  googleButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  linkText: {
    color: '#f7b733',
  },
});
