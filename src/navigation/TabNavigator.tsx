import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/HomeScreen';
import { TabBarBg } from '../components/NotchedBackground';
import { colors } from '../theme/colors';
import { TabIcon } from '../components/TabIcon';
import ListScreen from '../screens/List/ListScreen';

import { RenderCenterTabBtn } from '../components/TabCenterBtn';
import ShopScreen from '../screens/Shop/ShopScreen';
import AppLayout from '../components/AppLayout';
import RoadMap from '../screens/Plan/RoadMap';
import TraineeProfileScreen from '../screens/Profile/TraineeProfileScreen';

export type RootTabParamList = {
  Home: undefined;
  List: undefined;
  Roadmap: undefined;
  TraineeProfile: undefined;
  Shop: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator: React.FC = () => {
  return (
    <AppLayout>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          tabBarStyle: {
            height: 80,
            position: 'absolute',
            backgroundColor: colors.background.DEFAULT,
            elevation: 0,
            shadowColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 5,
          },
          tabBarBackground: TabBarBg,
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 6,
          },
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.foreground,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Trang chủ',
            tabBarIcon: TabIcon('home-outline', 'home'),
          }}
        />
        <Tab.Screen
          name="List"
          component={ListScreen}
          options={{
            tabBarLabel: 'Danh sách',
            tabBarIcon: TabIcon('list-circle-outline', 'list-circle', 28),
          }}
        />
        <Tab.Screen
          name="Roadmap"
          component={RoadMap}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: TabIcon(
              'git-network-outline',
              'git-network-outline',
              30,
              '#FFF',
            ),
            tabBarButton: RenderCenterTabBtn,
          }}
        />
            <Tab.Screen
          name="Shop"
          component={ShopScreen}
          options={{
            tabBarLabel: 'Cửa hàng',
            tabBarIcon: TabIcon('pricetag-outline', 'pricetag', 22),
          }}
        />
        <Tab.Screen
          name="TraineeProfile"
          component={TraineeProfileScreen}
          options={{
            tabBarLabel: 'Cá nhân',
            tabBarIcon: TabIcon('person-circle-outline', 'person-circle', 28),
          }}
        />
    
      </Tab.Navigator>
    </AppLayout>
  );
};

export default TabNavigator;
