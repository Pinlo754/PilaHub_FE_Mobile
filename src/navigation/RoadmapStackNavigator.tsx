import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoadMap from '../screens/Plan/RoadMap';
import RoadmapListScreen from '../screens/Plan/ListRoadmapScreen';
import RoadmapResultScreen from '../screens/Plan/components/RoadmapVideo/RoadmapResultScreen';
import RoadmapDetailScreen from '../screens/Plan/RoadmapDetail';
export type RoadmapStackParamList = {
  RoadmapList: undefined;
  RoadmapDetail: {
    roadmapId: string;
    roadmap?: any;  // Optional roadmap data from list
    source?: 'home' | 'list';  // Track where it came from
  };
  RoadmapResult: {
  roadmapId: string;
};
RoadmapCreate: {
  roadmapId: string;
};
};

const Stack = createNativeStackNavigator<RoadmapStackParamList>();

const RoadmapStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="RoadmapList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="RoadmapList" component={RoadmapListScreen} />
      <Stack.Screen name="RoadmapDetail" component={RoadMap} />
      <Stack.Screen
  name="RoadmapResult"
  component={RoadmapResultScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="RoadmapCreate"
  component={RoadmapDetailScreen}
/>  
    </Stack.Navigator>
  );
};

export default RoadmapStackNavigator;