/*import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface Props {
  error: string | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, { hasError: boolean; errorMessage: string | null }> {
  constructor(props: React.PropsWithChildren<Props>) {
    super(props);
    this.state = { hasError: false, errorMessage: props.error || null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught an error:', error.message);
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.error !== this.props.error) {
      this.setState({ errorMessage: this.props.error, hasError: !!this.props.error });
    }
  }

  render() {
    if (!this.state.hasError || !this.state.errorMessage) {
      return this.props.children;
    }

    return (
      <Animatable.View animation="pulse" iterationCount="infinite" duration={1500} style={styles.container}>
        <View style={styles.inner}>
          <Image source={require('../assets/icons/error.png')} style={styles.icon} resizeMode="contain" />
          <Text style={styles.text}>{this.state.errorMessage}</Text>
        </View>
      </Animatable.View>
    );
  }
}

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
*/
