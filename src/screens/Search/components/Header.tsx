import React, { useEffect, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { SearchTab } from '../../../constants/searchTab';

type Props = {
  activeTab: SearchTab;
  searchQuery: string;
  onSearch: (query: string) => void;
  onOpenFilter: () => void;
  onPressBack: () => void;
};

const Header = ({
  activeTab,
  searchQuery,
  onSearch,
  onOpenFilter,
  onPressBack,
}: Props) => {
  // NAVIGATION
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // STATE
  const [focused, setFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const canFilter = activeTab !== SearchTab.Coach;

  // USE EFFECT
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  return (
    <View className="flex-row justify-between items-center px-4">
      {/* Back */}
      <View className="">
        <Pressable onPress={onPressBack}>
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* Input */}
      <View
        className={`w-[280px] flex-row justify-between items-center bg-white shadow-md elevation-md border rounded-lg ${focused ? 'border-foreground' : 'border-background-sub1'}`}
      >
        <TextInput
          className={`color-foreground font-medium px-3 py-3 text-lg`}
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.inactive[80]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ width: 200 }}
          value={localQuery}
          onChangeText={setLocalQuery}
          returnKeyType="search"
          onSubmitEditing={() => onSearch(localQuery)}
        />

        {localQuery.length > 0 ? (
          <Pressable
            className="px-2"
            onPress={() => {
              setLocalQuery('');
              onSearch('');
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.inactive[80]}
            />
          </Pressable>
        ) : null}

        <Pressable className="px-3" onPress={() => onSearch(localQuery)}>
          <Ionicons name="search" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Filter */}
      {canFilter ? (
        <Pressable className="ml-3" onPress={onOpenFilter}>
          <Ionicons
            name="options-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
};

export default Header;
