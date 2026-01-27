import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
};

const AppLayout: React.FC<Props> = ({ children }) => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {children}
    </SafeAreaView>
  );
};

export default AppLayout;
