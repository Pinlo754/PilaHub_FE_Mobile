import { Text, TouchableOpacity, View } from "react-native";
import Schedule from "../components/Schedule";
import Header from "../components/Header";
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../../navigation/AppNavigator";
const CommingsoonClass = () => {
    type RouteProps = RouteProp<RootStackParamList, 'CommingsoonClass'>;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProps>();
    const startSession = (id: string) => {
        console.log(`Bắt đầu lớp học với ID: ${id}`);
        navigation.navigate('EndSessionScreen', { selectedId: id });
    }
    const selectedId = route.params.selectedId;
    return (
        <View className="flex-1 bg-background px-2">
            <Header />
            <Schedule />
            <View>
                <Text className=" text-lg font-semibold mt-4 text-foreground">Chi tiết lịch học</Text>
                <View className="bg-background-sub1 rounded-2xl p-4 mt-2 shadow-lg elevation-5 h-[50%] relative">

                    <Text className="text-center mt-4 text-gray-500">
                        Chi tiết cho lịch học ID: {selectedId} đợi api
                    </Text>

                    <TouchableOpacity
                        onPress={() => startSession(selectedId)}
                        className="absolute bottom-4 right-4"
                        activeOpacity={0.8}
                    >
                        <View className="bg-secondaryText rounded-3xl w-28 h-10 justify-center items-center">
                            <Text className="text-white font-bold text-base">
                                Vào lớp →
                            </Text>
                        </View>
                    </TouchableOpacity>

                </View>

            </View>

        </View>
    );
};
export default CommingsoonClass;    
