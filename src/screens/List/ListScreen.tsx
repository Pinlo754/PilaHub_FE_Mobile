import { View } from 'react-native';
import Header from './components/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Tabs from './components/Tabs';
import List from './components/List';
import { useListScreen } from './useListScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'List'>;

const ListScreen = (props: Props) => {
  // HOOK
  const { activeTab, onChangeTab, dataByTab } = useListScreen();

  return (
    <View className="flex-1 bg-background pt-14">
      {/* Header */}
      <Header navigation={props.navigation} />

      {/* Tabs */}
      <Tabs tabId={activeTab} onChange={onChangeTab} />

      {/* List */}
      <List
        activeTab={activeTab}
        data={dataByTab[activeTab]}
        navigation={props.navigation}
      />
    </View>
  );
};

export default ListScreen;
