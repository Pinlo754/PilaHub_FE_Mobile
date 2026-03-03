module.exports = {
<<<<<<< HEAD
  presets: [
    'module:@react-native/babel-preset',
    'nativewind/babel',
  ],
  plugins: [
    'react-native-worklets/plugin'
  ],
}
=======
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-worklets/plugin', // nếu thật sự dùng
    'react-native-reanimated/plugin', // LUÔN Ở CUỐI
  ],
};
>>>>>>> 759e504 (add profile screen)
