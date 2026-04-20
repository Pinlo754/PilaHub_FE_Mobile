import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { ExerciseEquipment } from '../../../utils/EquipmentType';
import { useState } from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  equipments: ExerciseEquipment[];
};

const PAGE_SIZE = 5;

const EquipmentModal = ({ visible, onClose, equipments }: Props) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(equipments.length / PAGE_SIZE);
  const paginatedData = equipments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Modal */}
        <View
          className="rounded-3xl overflow-hidden bg-white pb-4"
          style={{ width: 350 }}
        >
          {/* Header */}
          <View className="bg-background-sub1 py-5">
            <Text className="font-semibold color-foreground text-2xl text-center">
              Dụng cụ tập luyện
            </Text>

            <Pressable onPress={onClose} className="absolute right-3 top-3">
              <Ionicons
                name="close-outline"
                size={26}
                color={colors.inactive[80]}
              />
            </Pressable>
          </View>

          {/* Table */}
          <View className="px-4 mt-4">
            {equipments.length === 0 ? (
              <View className="items-center py-8 gap-2">
                <Ionicons
                  name="barbell-outline"
                  size={40}
                  color={colors.inactive[80]}
                />
                <Text className="text-secondaryText text-sm">
                  Không cần dụng cụ
                </Text>
              </View>
            ) : (
              <>
                {/* Table Header */}
                <View className="flex-row gap-2 pb-2 border-b border-foreground mb-1">
                  <Text className="w-6 text-xs font-bold text-secondaryText text-center">
                    STT
                  </Text>
                  <Text className="flex-1 text-xs font-bold text-secondaryText">
                    Tên dụng cụ
                  </Text>
                  <Text className="w-12 text-xs font-bold text-secondaryText text-center">
                    SL
                  </Text>
                  <Text className="w-16 text-xs font-bold text-secondaryText text-center">
                    Bắt buộc
                  </Text>
                </View>

                {/* Table Rows */}
                <View className="flex-col gap-2">
                  {paginatedData.map((item, index) => (
                    <View
                      key={item.exerciseEquipmentId}
                      className="flex-row gap-2 border-b border-background-sub1 pb-2 items-center"
                    >
                      <Text className="w-6 text-secondaryText font-medium text-center text-sm">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-sm">
                          {item.equipmentName}
                        </Text>
                        {item.usageNotes ? (
                          <Text
                            className="text-secondaryText text-xs mt-0.5"
                            numberOfLines={2}
                          >
                            {item.usageNotes}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="w-12 text-secondaryText font-medium text-center text-sm">
                        {item.quantity}
                      </Text>
                      <View className="w-16 items-center">
                        {item.required ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.success.DEFAULT}
                          />
                        ) : (
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color={colors.inactive[80]}
                          />
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                  <View className="flex-row items-center justify-center gap-2 mt-3">
                    <Pressable
                      onPress={() => goToPage(page - 1)}
                      disabled={page === 1}
                      className={`w-8 h-8 rounded-lg items-center justify-center ${page === 1 ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={16}
                        color={
                          page === 1
                            ? colors.inactive.darker
                            : colors.secondaryText
                        }
                      />
                    </Pressable>

                    <Text className="font-semibold text-sm text-foreground">
                      {page}/{totalPages}
                    </Text>

                    <Pressable
                      onPress={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      className={`w-8 h-8 rounded-lg items-center justify-center ${page === totalPages ? 'bg-inactive-lighter' : 'bg-background-sub1'}`}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={
                          page === totalPages
                            ? colors.inactive.darker
                            : colors.secondaryText
                        }
                      />
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EquipmentModal;
