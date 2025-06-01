import { useEffect, useState } from 'react';
import{
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Redirection: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  
   useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
  if (user) {
    navigation.replace('Dashboard');
  } else {
    navigation.replace('Onboarding');
  }
}, []);

return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
    </SafeAreaView>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },    
});

export default Redirection;
