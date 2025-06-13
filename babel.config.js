module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // Plugin existant pour react-native-reanimated
    [
      'module:react-native-dotenv', // Plugin pour lire les variables du fichier .env
      {
        moduleName: '@env', // Nom du module pour importer les variables (ex. import { GOOGLE_MAPS_API_KEY } from '@env')
        path: '.env', // Chemin vers le fichier .env
        safe: true, // Génère une erreur si une variable utilisée n'est pas définie dans .env
        allowUndefined: false, // Interdit les variables non définies
      },
    ],
  ],
};