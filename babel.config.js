module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-worklets/plugin', // nếu thật sự dùng
    'react-native-reanimated/plugin', // LUÔN Ở CUỐI
  ],
};