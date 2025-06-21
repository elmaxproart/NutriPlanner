import { Dimensions, StyleSheet } from 'react-native';

export const { width } = Dimensions.get('window');


const CARD_WIDTH = width * 0.6;
const SLIDER_HEIGHT = 200;
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    position: 'relative',
  },
  sliderImage: {
    width,
    height: SLIDER_HEIGHT,
    resizeMode: 'cover',
  },
  sliderOverlay: {
    position: 'absolute',
    width: '100%',
    height: SLIDER_HEIGHT,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // assombrit les images
  },
  sliderTextBox: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  sliderTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sliderDescription: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  topImageContainer: {
    height: 180,
    position: 'relative',
  },
  topImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerText: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    margin: 16,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a', // champ sombre
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    color: '#fff', // texte clair
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    color: '#fff',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    elevation: 3,
    marginRight: 16,
    marginTop: 10,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    height: 280,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    color: '#fff',
  },
  cardPrice: {
    color: '#aaa',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0d0d0d',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },

plusButton: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#FF6B00',
  justifyContent: 'center',
  alignItems: 'center',

  bottom: 20,
  zIndex: 10,
  elevation: 8,
},

floatingOption: {
  backgroundColor: '#232222',
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9,
  elevation: 6,
},
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 5,
},

circleContainer: {
  position: 'absolute',
  bottom: 100,
  right: 40,
  width: 200,
  height: 200,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 6,
},

centerButtonContainer: {
  position: 'absolute',
  bottom: 80,
  right: 20,
  zIndex: 7,
},



});
