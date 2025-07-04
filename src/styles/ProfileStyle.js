import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  profileBox: { alignItems: 'center', marginVertical: 20 },
  userName: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  optionLabel: { fontSize: 16 },
  languageSwitch: { fontSize: 16, color: '#FF6B00', fontWeight: 'bold' },
  input: {
    width: '100%',
    backgroundColor: '#181818',
    padding: 15,
    borderRadius: 10,
    color: '#fff',
    marginBottom: 15,
  },
  progressContainer: {
    height: 10,
    width: '80%',
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B00',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 20,
    width: 'auto',
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  addButton: {
    backgroundColor: '#181818',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  scrollContainer: {
  paddingBottom: 20,
},
closeIcon: {
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 100,
},

  saveButton: {
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 40,
  },
  removeBtn: {
    backgroundColor: '#9a2422',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  memberImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  formContain: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
});

export const lightStyles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  text: { color: '#000' },
  border: { borderBottomColor: '#ddd' },
});

export const darkStyles = StyleSheet.create({
  container: { backgroundColor: '#121212' },
  text: { color: '#fff' },
  border: { borderBottomColor: '#444' },
});
export const commonStyles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  inputField: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
});