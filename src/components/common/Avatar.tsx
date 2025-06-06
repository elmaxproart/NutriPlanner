import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';

interface AvatarProps {
  source: { uri: string | undefined};
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  style?: any;
  placeholderText?: string;
}

export const Avatar = ({
  source,
  size = 40,
  borderWidth = 2,
  borderColor = '#FF6B00',
  style,
  placeholderText = 'A',
}: AvatarProps) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderWidth, borderColor }, style]}>
      {source ? (
        <Image source={source} style={[styles.image, { width: size, height: size }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Text style={styles.placeholderText}>{placeholderText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 50,
  },
  placeholder: {
    backgroundColor: '#2a2a2a',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
