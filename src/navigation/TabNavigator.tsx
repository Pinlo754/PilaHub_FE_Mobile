import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/HomeScreen';
import { TabBarBg } from '../components/NotchedBackground';
import { colors } from '../theme/colors';
import { TabIcon } from '../components/TabIcon';
import ListScreen from '../screens/List/ListScreen';
import { NavigatorScreenParams } from '@react-navigation/native';
import { RenderCenterTabBtn } from '../components/TabCenterBtn';
import ShopScreen from '../screens/Shop/ShopScreen';
import AppLayout from '../components/AppLayout';
import TraineeProfileScreen from '../screens/Profile/TraineeProfileScreen';
import RoadmapStackNavigator, { RoadmapStackParamList } from './RoadmapStackNavigator';

export type RootTabParamList = {
  Home: undefined;
  List: undefined;
  Roadmap: NavigatorScreenParams<RoadmapStackParamList> | undefined;
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
            backgroundColor: 'transparent',
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
  component={RoadmapStackNavigator}
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
  listeners={({ navigation: nav }) => ({
    tabPress: (_e: any) => {
      // When pressing the Roadmap tab
      const state = nav.getState();
      const currentTabRoute = state?.routes[state.index];
      
      // If currently on Roadmap tab
      if (currentTabRoute?.name === 'Roadmap' && currentTabRoute?.state) {
        const nestedState = currentTabRoute.state;
        if (nestedState?.routes && nestedState.routes.length > 1 && nestedState.index !== undefined) {
          const detailRoute = nestedState.routes[nestedState.index];
          const source = (detailRoute?.params as any)?.source;
          
          // If from list, reset to RoadmapList
          if (source === 'list') {
            nav.reset({
              index: 0,
              routes: [{ name: 'Roadmap', state: { routes: [{ name: 'RoadmapList' }] } }],
            });
          }
          // If from home, keep the detail screen (do nothing)
        }
      } else {
        // If NOT on Roadmap tab (e.g., coming from Home), reset to RoadmapList
        nav.reset({
          index: 0,
          routes: [{ name: 'Roadmap', state: { routes: [{ name: 'RoadmapList' }] } }],
        });
      }
    },
  })}
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
