// components/CustomPopup.tsx
import React from 'react';
import {Modal, View, Text, Image, TouchableOpacity} from 'react-native';
import {styles} from '../styles/popupStyle';

const icons = {
  info: require('../assets/icons/info.png'),
  alert: require('../assets/icons/alert.png'),
  error: require('../assets/icons/error.png'),
  success: require('../assets/icons/success.png'),
};

type Props = {
  visible: boolean;
  onClose: () => void;
  type: 'info' | 'alert' | 'error' | 'success';
  message: string;
};

const CustomPopup = ({visible, onClose, type, message}: Props) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <Image source={icons[type]} style={styles.popupIcon} />
          <Text style={styles.popupText}>{message}</Text>
          <TouchableOpacity style={styles.popupButton} onPress={onClose}>
            <Text style={{color: '#fff'}}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomPopup;
