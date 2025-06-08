import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Define common styles for onboarding screens
export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22, // Slightly smaller for multi-step screens
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 15,
    fontSize: 16,
    paddingHorizontal: 15,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden', // Ensures picker items don't overflow rounded corners
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  buttonContainer: {
    width: width > 400 ? '70%' : '90%',
    marginBottom: 15,
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quitButton: {
    width: width > 400 ? '70%' : '90%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f7b733',
    marginBottom: 20, // Add some margin to the bottom
  },
  quitText: {
    color: '#f7b733',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: { // For step 4 to show loading
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  // Specific for UserOnboardingScreen title
  welcomeTitle: {
    fontSize: 26, // Larger font for the main welcome screen
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
});

// Styles specific to UserOnboardingStep4 summary
export const summaryStyles = StyleSheet.create({
  summary: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
});
