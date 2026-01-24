import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import List from './components/List';
import Tabs from './components/Tabs';
import { useSearchScreen } from './useSearchScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  // HOOK
  const { activeTab, onChangeTab, dataByTab } = useSearchScreen();

  return (
    <View className="w-full flex-1 bg-background pt-4">
      {/* Header */}
      <Header />

      {/* Tabs */}
      <Tabs tabId={activeTab} onChange={onChangeTab} />

      {/* List */}
      <List
        activeTab={activeTab}
        data={dataByTab[activeTab]}
        navigation={navigation}
      />
    </View>
  );
};

export default SearchScreen;
