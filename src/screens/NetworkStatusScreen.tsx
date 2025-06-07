import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type NetworkStatusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NetworkStatus'>;

interface NetworkStatusScreenProps {
  navigation: NetworkStatusScreenNavigationProp;
}

const NetworkStatusScreen: React.FC<NetworkStatusScreenProps> = ({ /*navigation*/ }) => {
  const { isConnected, loading } = useNetworkStatus();

  // Animations for icon and text
  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Icon animation: scale up, then subtle bounce/pulse
    iconScale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    iconOpacity.value = withTiming(1, { duration: 500 });

    // Text animation: slide up and fade in
    textTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Optional: add a repeat animation for the icon if it's connected
    if (isConnected) {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.ease }),
          withTiming(1, { duration: 800, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      // Stop repeat animation if disconnected
      iconScale.value = withTiming(1);
    }

  }, [iconOpacity, iconScale, isConnected, loading, textOpacity, textTranslateY]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const statusMessage = loading
    ? 'Vérification de l\'état du réseau...'
    : isConnected
    ? 'Connexion Internet disponible !'
    : 'Pas de connexion Internet.';

  const iconName = isConnected ? 'wifi' : 'disconnect'; // Using AntDesign icons
  const iconColor = isConnected ? '#27AE60' : '#E74C3C'; // Green for connected, Red for disconnected

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d0d0d" barStyle="light-content" />

      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {/* Using AntDesign for simple, scalable icons */}
        <AntDesign name={iconName} size={80} color={iconColor} />
      </Animated.View>

      <Animated.Text style={[styles.statusText, animatedTextStyle]}>
        {statusMessage}
      </Animated.Text>

      {!loading && !isConnected && (
        <Animated.View style={[styles.reconnectTip, animatedTextStyle]}>
          <AntDesign name="infocirlceo" size={18} color="#f7b733" />
          <Text style={styles.reconnectText}>
            Veuillez vérifier votre connexion Wi-Fi ou vos données mobiles.
          </Text>
        </Animated.View>
      )}

      {/* Optional: Add a button to refresh or navigate back */}
      {/* <TouchableOpacity onPress={() => { /* Implement refresh or goBack here */ /*}} style={styles.button}>
        <Text style={styles.buttonText}>Rafraîchir</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  reconnectTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    maxWidth: '90%',
  },
  reconnectText: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 10,
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#f7b733',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NetworkStatusScreen;

