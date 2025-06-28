// styles.js
import {StyleSheet, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  formContain: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
addButton: {
  backgroundColor: '#181818', 
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginVertical: 12,
},
cardDetail: {
  color: '#fff',
  fontSize: 13,
  marginTop: 2,
  marginBottom: 2,
},

  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    width: '100%',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
    addButton: {
    backgroundColor: '#d64b28',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#b0b0b0',
    fontSize: 14,

    marginBottom: 10,
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F39C12',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 100,
    elevation: 8,
  },
    detailButton: {
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 14,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    flexDirection: 'row',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  removeBtn: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,

    justifyContent: 'center',
  },





  Moverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},

MformContain: {
  backgroundColor: '#1e1e1e',
  borderRadius: 20,
  paddingVertical: 30,
  paddingHorizontal: 20,
  alignItems: 'center',
  width: '80%',
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 6,
},

MheaderTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 20,
  color: '#f5f5f5',
},

MsaveButton: {
  backgroundColor: '#3b82f6',
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 30,
  marginVertical: 8,
  width: '80%',
  alignItems: 'center',
},

MremoveBtn: {
  backgroundColor: '#333',
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 30,
  marginTop: 10,
  width: '80%',
  alignItems: 'center',
},
appBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#1a1a1a',
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#333',
  elevation: 4,
  borderRadius: 10,
},

appBarTitle: {
  fontSize: 18,
  color: '#fff',
  fontWeight: '600',
},

searchInput: {
  backgroundColor: '#2a2a2a',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 10,
  marginHorizontal: 16,
  marginVertical: 10,
  fontSize: 16,
  color: '#fff',
},


});
