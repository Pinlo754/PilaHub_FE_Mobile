import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { useEffect, useState } from 'react';

type Props = {
  searchQuery: string;
  onSearch: (query: string) => void;
};

const SearchSection = ({ onSearch, searchQuery }: Props) => {
  // STATE
  const [focused, setFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // USE EFFECT
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  return (
    <View className="m-4">
      {/* Search */}
      <View
        className={`w-[80%] self-center flex-row justify-between items-center bg-white shadow-md elevation-md border rounded-lg ${focused ? 'border-foreground' : 'border-background-sub1'}`}
      >
        <TextInput
          className={`color-foreground font-medium px-3 py-3 text-lg`}
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.inactive[80]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ width: 220 }}
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

      {/* Filter
      <Pressable className="absolute right-0 top-3 z-10" onPress={() => {}}>
        <Ionicons name="options-outline" size={24} color={colors.foreground} />
      </Pressable> */}
    </View>
  );
};

export default SearchSection;
