import {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import auth from '@react-native-firebase/auth';

const Welcome: React.FC<{navigation: any}> = ({navigation}) => {
  const imageSource: ImageSourcePropType = require('../assets/images/hamburgeur.jpg');
  const [initializing, setInitializing] = useState(true);

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
        <LinearGradient
          colors={['transparent', '#0d0d0d']}
          style={styles.smokeOverlay}
        />

        <Text style={styles.title}>
          <Text style={styles.whiteText}>Quik Delivery</Text>
          {'\n'}
          <Text style={styles.yellowText}>at Your Doorstep</Text>
        </Text>

        <Text style={styles.description}>
          ⚜️ Home delivery and intelligent online Grocery ⚜️ {'\n'}
          system for your Home
        </Text>

        <LinearGradient
          colors={['#fc4a1a', '#f7b733']}
          style={styles.loginButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{width: '100%', alignItems: 'center'}}>
            <Text style={styles.loginText}>
              <AntDesign name="login" size={20} color="#fff" /> Login
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1.3,
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
    height: 120, // dégradé progressif
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
    top: -70,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  whiteText: {
    color: '#fff',
  },
  yellowText: {
    color: '#f7b733',
  },
  description: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signupButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f7b733',
    alignItems: 'center',
  },
  signupText: {
    color: '#fff',
  },
});

export default Welcome;
