import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background.DEFAULT,
      }}
    >
      {children}
    </View>
  );
};

export default AppLayout;
