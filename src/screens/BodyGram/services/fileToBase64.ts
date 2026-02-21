import RNFS from 'react-native-fs';

export async function fileToBase64(uri: string) {
  const path = uri.replace('file://', '');
  return await RNFS.readFile(path, 'base64');
}
