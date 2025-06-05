import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface Props {
  error: string | null;
}

const ErrorBoundary: React.FC<Props> = ({ error }) => {
  if (!error) {return null;}

  return (
    <Animatable.View animation="pulse" iterationCount="infinite" duration={1500} style={styles.container}>
      <View style={styles.inner}>
        <Animatable.Image source={require('../assets/icons/error.png')} style={styles.icon} />
        <Text style={styles.text}>{error}</Text>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
    icon: {
    width: 60,
    height: 60,
    marginBottom: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  container: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inner: {
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff6659',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ErrorBoundary;
