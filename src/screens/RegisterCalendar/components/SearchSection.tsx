import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { useState } from 'react';

const SearchSection = () => {
  // STATE
  const [focused, setFocused] = useState(false);

  return (
    <View className="m-4">
      {/* Search */}
      <View
        className={`w-[80%] self-center flex-row justify-between items-center bg-white shadow-sm elevation-6 border rounded-lg ${focused ? 'border-foreground' : 'border-background-sub1'}`}
      >
        <TextInput
          className={`color-foreground font-medium px-3 py-3 text-lg`}
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.inactive.darker}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Pressable className="px-3" onPress={() => {}}>
          <Ionicons name="search" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Filter */}
      <Pressable className="absolute right-0 top-3 z-10" onPress={() => {}}>
        <Ionicons name="options-outline" size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );
};

export default SearchSection;
