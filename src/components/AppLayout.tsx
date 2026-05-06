import React, { useEffect } from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';
import Orientation from 'react-native-orientation-locker';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    Orientation.lockToPortrait();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

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
