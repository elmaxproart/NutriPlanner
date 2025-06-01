import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
popupOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

popupContainer: {
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 20,
  alignItems: 'center',
  width: '80%',
},

popupIcon: {
  width: 60,
  height: 60,
  marginBottom: 10,
},

popupText: {
  fontSize: 16,
  color: '#333',
  textAlign: 'center',
  marginBottom: 20,
},

popupButton: {
  backgroundColor: '#007BFF',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
},
})