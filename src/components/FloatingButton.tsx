import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, DeviceEventEmitter, NativeModules } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

const FloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const navigation = useNavigation<any>();
  const { FloatingBubbleModule } = NativeModules;

  const options = [
    { label: 'Ajouter un menu', screen: 'AddMenuPage' },
    { label: 'Voir les menus', screen: 'MenuScreen' },
  ];

  useEffect(() => {
    console.log('FloatingButton: Mounting component');

    // Vérifier si le module natif est disponible
    if (!FloatingBubbleModule) {
      console.error('FloatingButton: FloatingBubbleModule not available');
      return;
    }

    // Lancer le service de la bulle flottante
    FloatingBubbleModule.startBubbleService().catch((error: any) => {
      console.error('FloatingButton: Error starting bubble service:', error);
    });

    const positionSubscription = DeviceEventEmitter.addListener('FloatingBubblePosition', (data: number[]) => {
      console.log('FloatingButton: Position update:', data);
      setPosition({ x: data[0], y: data[1] });
    });

    const clickSubscription = DeviceEventEmitter.addListener('bubbleClick', () => {
      console.log('FloatingButton: Bubble clicked, navigating to Home');
      navigation.navigate('Dashboard');
    });

    const closeSubscription = DeviceEventEmitter.addListener('bubbleClose', () => {
      console.log('FloatingButton: Bubble closed');
      setIsOpen(false);
    });

    return () => {
      console.log('FloatingButton: Unmounting component');
      positionSubscription.remove();
      clickSubscription.remove();
      closeSubscription.remove();
      // Arrêter le service lors du démontage
      FloatingBubbleModule.stopBubbleService().catch((error: any) => {
        console.error('FloatingButton: Error stopping bubble service:', error);
      });
    };
  }, [FloatingBubbleModule, navigation]);

  const toggleMenu = () => {
    console.log('FloatingButton: Toggling menu, isOpen:', !isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]}>
      {isOpen && (
        <Animatable.View animation="fadeIn" duration={300} style={styles.menu}>
          {options.map((option, index) => (
            <Animatable.View
              key={index}
              animation="slideInRight"
              delay={index * 100}
              style={styles.menuItemContainer}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  console.log(`FloatingButton: Navigating to ${option.screen}`);
                  navigation.navigate(option.screen);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.menuText}>{option.label}</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </Animatable.View>
      )}
      <TouchableOpacity style={styles.button} onPress={toggleMenu}>
        <Animatable.View animation={isOpen ? 'rotate' : 'rotate'} duration={300}>
          <LinearGradient
            colors={['#4285f4', '#34a853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <React.Fragment>
              {isOpen ? (
              <Animatable.Image
                source={require('../assets/close.png')}
                style={styles.image}
                resizeMode="contain"
              />
              ) : (
              <Animatable.Image
                source={require('../assets/plus.png')}
                style={styles.image}
                resizeMode="contain"
              />
              )}
            </React.Fragment>
          </LinearGradient>
        </Animatable.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { width: 32, height: 32, tintColor: '#fff' },

  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    elevation: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menu: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.2)',
  },
  menuItemContainer: {
    marginVertical: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
  },
  menuText: {
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '600',
  },
});

export default FloatingButton;
