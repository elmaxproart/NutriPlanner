import React from 'react';
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
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {login} from '../hooks/SignUpFnAuth';
import {rgbaColor} from 'react-native-reanimated/lib/typescript/Colors';

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoding, setIsloding] = React.useState(false);

  const alert = (message: string) => {
    import('react-native').then(({Alert}) => {
      Alert.alert('Login Error', message);
    });
  };

  if (isLoding) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <View style={styles.videoContainer}>
        <Video
          source={require('../assets/videos/hamburgeur.mp4')}
          style={styles.video}
          repeat
          resizeMode="cover"
          muted
          controls={false}
          paused={false}
          ignoreSilentSwitch="obey"
        />
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
        <Text style={styles.title}>Welcome Back</Text>

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

        <TouchableOpacity
          onPress={async () => {
            try {
              setIsloding(true);
              await login(email, password);
              setIsloding(false);
              navigation.replace('Home');
            } catch (err) {
              if (err instanceof Error) {
                alert('Erreur: ' + err.message);
              } else {
                alert('Erreur inconnue');
              }
            }
          }}
          style={{width: '100%'}}>
          <LinearGradient
            colors={['#fc4a1a', '#f7b733']}
            style={styles.loginButton}>
            <Text style={styles.loginText}>
              <AntDesign name="login" size={18} color="#fff" /> Login
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1.3,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    position: 'relative',
  },

  smokeOverlay: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
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
