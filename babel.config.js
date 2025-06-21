module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
        },
      ],
    ],
    env: {
      development: {
        plugins: [
          ['inline-dotenv', {
            env: {
              EXPO_OS: process.platform === 'ios' ? 'ios' : 'android',
            },
          }],
        ],
      },
    },
  };
};
