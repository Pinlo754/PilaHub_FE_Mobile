import { Text, View } from 'react-native';
import Schedule from './components/Schedule';
import Header from './components/Header';
import FeatureGrid from './components/NavigateMenu';

const CoachScreen = () => {
  return (
    <View className="flex-1 bg-background px-2">
      <Header />
      <Schedule />
      <FeatureGrid />
    </View>
  );
};

export default CoachScreen;
