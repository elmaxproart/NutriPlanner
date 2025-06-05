import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

const FloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();

  const options = [
    { label: 'Ajouter un menu', screen: 'AddMenuPage' },
    { label: 'Voir les menus', screen: 'MenuScreen' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <View style={styles.container}>
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
                  navigation.navigate(option.screen as never);
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
            <Animatable.Image
              source={
                isOpen
                  ? require('../assets/close.png')
                  : require('../assets/plus.png')
              }
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ width: 32, height: 32, tintColor: '#fff' }}
              animation={isOpen ? 'rotate' : undefined}
              duration={300}
            />
          </LinearGradient>
        </Animatable.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
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
