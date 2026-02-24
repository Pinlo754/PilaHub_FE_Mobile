import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../hooks/axiosInstance';

const TestNavigateScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleGoToProgramDetail = () => {
    navigation.navigate('ProgramDetail', {
      program_id: 'test_id_123',
    });
  };

  const login = () => {
    const res = api.post('http://192.168.1.64:8080/api/auth/login', {
      email: 'maintse184085@fpt.edu.vn',
      password: 'SecurePass123!',
    });

    console.log(res);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Navigate Screen</Text>

      {/* <Button
        title="Go to Coach Screen"
        onPress={() => navigation.navigate('CoachScreen')}
      /> */}
      <Button title="Go to Program Detail" onPress={login} />
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
