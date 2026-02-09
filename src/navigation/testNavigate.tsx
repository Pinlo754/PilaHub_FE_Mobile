import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

const TestNavigateScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleGoToProgramDetail = () => {
    navigation.navigate('ProgramDetail', {
      program_id: 'test_id_123',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Navigate Screen</Text>

      <Button
        title="Go to Coach Screen"
        onPress={() => navigation.navigate('CoachScreen')}
      />
      {/* <Button
        title="Go to Program Detail"
        onPress={handleGoToProgramDetail}
      /> */}
    </View>
  );
};

export default TestNavigateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
});
