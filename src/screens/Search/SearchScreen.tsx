import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from './components/Header';
import List from './components/List';
import Tabs from './components/Tabs';
import { useSearchScreen } from './useSearchScreen';
import LoadingOverlay from '../../components/LoadingOverlay';
import FilterModal from './components/FilterModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  // HOOK
  const {
    activeTab,
    onChangeTab,
    dataByTab,
    loading,
    filter,
    handleFilter,
    handleSearch,
    setIsFilterVisible,
    searchQuery,
    isFilterVisible,
    isSearching,
  } = useSearchScreen();

  return (
    <>
      {loading && <LoadingOverlay />}

      <View className="w-full flex-1 bg-background pt-14">
        {/* Header */}
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onOpenFilter={() => setIsFilterVisible(true)}
        />

        {/* Tabs */}
        <Tabs tabId={activeTab} onChange={onChangeTab} />

        {/* List */}
        <List
          activeTab={activeTab}
          data={dataByTab[activeTab]}
          navigation={navigation}
          isSearching={isSearching}
        />
      </View>

      {/* Filter Modal */}
      {isFilterVisible && (
        <>
          <View className="absolute inset-0 bg-black/40" />
          <FilterModal
            visible={isFilterVisible}
            currentFilter={filter}
            onApply={handleFilter}
            onClose={() => setIsFilterVisible(false)}
          />
        </>
      )}
    </>
  );
};

export default SearchScreen;
