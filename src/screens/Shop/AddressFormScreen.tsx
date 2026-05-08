import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAddress, updateAddress } from '../../services/address';
import { getProvinces, getDistricts, getWards } from '../../services/ghn';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalPopup from '../../components/ModalPopup';

// FIX: màu chữ cho Picker trên Android release build
const PICKER_TEXT_COLOR = '#111827';

export default function AddressFormScreen({ route }: any) {
  const navigation: any = useNavigation();

  const isModal = Boolean(route?.params?.asModal);
  const editingAddress = route?.params?.address ?? null;
  const isEditing = Boolean(editingAddress?.addressId);

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // ModalPopup state and helpers (use any to match ModalPopup discriminated props)
  const [modalProps, setModalProps] = useState<any>({
    visible: false,
    mode: 'noti',
    titleText: '',
    contentText: '',
    onConfirm: undefined,
  });

  const showModal = React.useCallback((props: Partial<any>) => {
    setModalProps((prev: any) => ({ ...prev, ...props, visible: true }));
  }, []);

  const closeModal = React.useCallback(() => {
    setModalProps((prev: any) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!editingAddress) return;

    setReceiverName(editingAddress.receiverName || '');
    setReceiverPhone(normalizeVietnamPhone(editingAddress.receiverPhone || '').slice(0, 10));
    setAddressLine(editingAddress.addressLine || '');
    setIsDefault(Boolean(editingAddress.isDefault));

    console.log('EDITING_ADDRESS:', editingAddress);
    console.log('EDITING_IS_DEFAULT:', editingAddress.isDefault);
  }, [editingAddress]);

  useEffect(() => {
    let mounted = true;

    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);

        const data = await getProvinces();
        const list = Array.isArray(data) ? data : [];

        if (!mounted) return;

        setProvinces(list);

        if (editingAddress) {
          const provinceText =
            editingAddress.province ||
            editingAddress.city ||
            editingAddress.provinceName ||
            '';

          const foundProvince = list.find((p: any) => {
            const name = String(p.provinceName || '').toLowerCase().trim();
            const target = String(provinceText || '').toLowerCase().trim();
            return name === target;
          });

          if (foundProvince) {
            setSelectedProvince(foundProvince.provinceId);
          }
        }
      } catch (error) {
        console.log('FETCH_PROVINCES_ERROR:', error);
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không thể tải danh sách tỉnh/thành' });
      } finally {
        if (mounted) {
          setLoadingProvinces(false);
        }
      }
    };

    fetchProvinces();

    return () => {
      mounted = false;
    };
  }, [editingAddress, showModal]);

  useEffect(() => {
    let mounted = true;

    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        setWards([]);
        setSelectedDistrict(null);
        setSelectedWard(null);
        return;
      }

      try {
        setLoadingDistricts(true);

        const data = await getDistricts(selectedProvince);
        const list = Array.isArray(data) ? data : [];

        if (!mounted) return;

        setDistricts(list);

        if (editingAddress) {
          const districtText =
            editingAddress.district ||
            editingAddress.districtName ||
            '';

          const foundDistrict = list.find((d: any) => {
            const name = String(d.districtName || '').toLowerCase().trim();
            const target = String(districtText || '').toLowerCase().trim();
            return name === target;
          });

          if (foundDistrict) {
            setSelectedDistrict(foundDistrict.districtId);
          } else {
            setSelectedDistrict(null);
            setWards([]);
            setSelectedWard(null);
          }
        } else {
          setSelectedDistrict(null);
          setWards([]);
          setSelectedWard(null);
        }
      } catch (error) {
        console.log('FETCH_DISTRICTS_ERROR:', error);
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không thể tải danh sách quận/huyện' });
      } finally {
        if (mounted) {
          setLoadingDistricts(false);
        }
      }
    };

    fetchDistricts();

    return () => {
      mounted = false;
    };
  }, [selectedProvince, editingAddress, showModal]);

  useEffect(() => {
    let mounted = true;

    const fetchWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        setSelectedWard(null);
        return;
      }

      try {
        setLoadingWards(true);

        const data = await getWards(selectedDistrict);
        const list = Array.isArray(data) ? data : [];

        if (!mounted) return;

        setWards(list);

        if (editingAddress) {
          const wardText =
            editingAddress.ward ||
            editingAddress.wardName ||
            '';

          const foundWard = list.find((w: any) => {
            const name = String(w.wardName || '').toLowerCase().trim();
            const target = String(wardText || '').toLowerCase().trim();
            return name === target;
          });

          if (foundWard) {
            setSelectedWard(foundWard.wardCode);
          } else {
            setSelectedWard(null);
          }
        } else {
          setSelectedWard(null);
        }
      } catch (error) {
        console.log('FETCH_WARDS_ERROR:', error);
        showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không thể tải danh sách phường/xã' });
      } finally {
        if (mounted) {
          setLoadingWards(false);
        }
      }
    };

    fetchWards();

    return () => {
      mounted = false;
    };
  }, [selectedDistrict, editingAddress, showModal]);

  const selectedProvinceName = useMemo(() => {
    return provinces.find(p => p.provinceId === selectedProvince)?.provinceName ?? '';
  }, [provinces, selectedProvince]);

  const selectedDistrictName = useMemo(() => {
    return districts.find(d => d.districtId === selectedDistrict)?.districtName ?? '';
  }, [districts, selectedDistrict]);

  const selectedWardName = useMemo(() => {
    return wards.find(w => w.wardCode === selectedWard)?.wardName ?? '';
  }, [wards, selectedWard]);

  useEffect(() => {
    const current = addressLine.trim();

    if (current) return;

    const parts = [
      selectedWardName,
      selectedDistrictName,
      selectedProvinceName,
    ].filter(Boolean);

    if (parts.length > 0) {
      setAddressLine(parts.join(', '));
    }
  }, [
    selectedWardName,
    selectedDistrictName,
    selectedProvinceName,
    addressLine,
  ]);

  const validateForm = () => {
    if (!receiverName.trim()) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng nhập tên người nhận' });
      return false;
    }

    if (!receiverPhone.trim()) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng nhập số điện thoại' });
      return false;
    }

    if (!isValidVietnamPhone(receiverPhone)) {
      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
      });
      return false;
    }

    if (!selectedProvince) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng chọn tỉnh/thành' });
      return false;
    }

    if (!selectedDistrict) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng chọn quận/huyện' });
      return false;
    }

    if (!selectedWard) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng chọn phường/xã' });
      return false;
    }

    if (!addressLine.trim()) {
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Vui lòng nhập địa chỉ' });
      return false;
    }

    return true;
  };

  const onSave = async () => {
    if (loading) return;

    const valid = validateForm();
    if (!valid) return;

    setLoading(true);

    try {
      const payload: any = {
        receiverName: receiverName.trim(),
        receiverPhone: normalizeVietnamPhone(receiverPhone),
        addressLine: addressLine.trim(),
        isDefault: Boolean(isDefault),
        province: selectedProvinceName,
        city: selectedProvinceName,
        district: selectedDistrictName,
        ward: selectedWardName,
      };

      console.log('IS_DEFAULT_STATE:', isDefault);
      console.log('ADDRESS_PAYLOAD:', payload);

      if (isEditing) {
        console.log('UPDATE_ADDRESS_ID:', editingAddress.addressId);
        await updateAddress(editingAddress.addressId, payload);
      } else {
        await createAddress(payload);
      }

      const successMsg = isEditing
        ? 'Đã cập nhật địa chỉ'
        : 'Đã thêm địa chỉ';

      showModal({
        mode: 'noti',
        titleText: 'Thành công',
        contentText: successMsg,
        onConfirm: () => {
          if (route?.params && typeof route.params.onSaved === 'function') {
            route.params.onSaved();
          }

          closeModal();
          navigation.goBack();
        },
      });
    } catch (error: any) {
      console.log('SAVE_ADDRESS_ERROR:', error);
      showModal({ mode: 'noti', titleText: 'Lỗi', contentText: 'Không thể lưu địa chỉ' });
    } finally {
      setLoading(false);
    }
  };

  const Content = (
    <View style={styles.card}>
      <Text style={styles.label}>Người nhận</Text>

      <TextInput
        value={receiverName}
        onChangeText={setReceiverName}
        placeholder="Tên người nhận"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />

      <Text style={styles.label}>Số điện thoại</Text>

      <TextInput
        value={receiverPhone}
        onChangeText={text => {
          const cleaned = text.replace(/\D/g, '').slice(0, 10);
          setReceiverPhone(cleaned);
        }}
        placeholder="Số điện thoại"
        placeholderTextColor="#9CA3AF"
        keyboardType="phone-pad"
        maxLength={10}
        style={styles.input}
      />

      <Text style={styles.label}>Tỉnh / Thành</Text>

      <View style={styles.pickerWrap}>
        {loadingProvinces ? (
          <View style={styles.loadingPicker}>
            <ActivityIndicator size="small" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải tỉnh/thành...</Text>
          </View>
        ) : (
          // FIX: bỏ className, thêm style color và color vào mỗi Picker.Item
          <Picker
            selectedValue={selectedProvince}
            style={styles.picker}
            dropdownIconColor={PICKER_TEXT_COLOR}
            onValueChange={value => {
              setSelectedProvince(value);
              setSelectedDistrict(null);
              setSelectedWard(null);
              setDistricts([]);
              setWards([]);
              setAddressLine('');
            }}
          >
            <Picker.Item
              label="Chọn tỉnh/thành"
              value={null}
              color={PICKER_TEXT_COLOR}
            />
            {provinces.map(p => (
              <Picker.Item
                key={p.provinceId}
                label={p.provinceName}
                value={p.provinceId}
                color={PICKER_TEXT_COLOR}
              />
            ))}
          </Picker>
        )}
      </View>

      <Text style={styles.label}>Quận / Huyện</Text>

      <View style={styles.pickerWrap}>
        {loadingDistricts ? (
          <View style={styles.loadingPicker}>
            <ActivityIndicator size="small" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải quận/huyện...</Text>
          </View>
        ) : (
          // FIX: bỏ className, thêm style color và color vào mỗi Picker.Item
          <Picker
            selectedValue={selectedDistrict}
            enabled={districts.length > 0}
            style={styles.picker}
            dropdownIconColor={PICKER_TEXT_COLOR}
            onValueChange={value => {
              setSelectedDistrict(value);
              setSelectedWard(null);
              setWards([]);
              setAddressLine('');
            }}
          >
            <Picker.Item
              label="Chọn quận/huyện"
              value={null}
              color={PICKER_TEXT_COLOR}
            />
            {districts.map(d => (
              <Picker.Item
                key={d.districtId}
                label={d.districtName}
                value={d.districtId}
                color={PICKER_TEXT_COLOR}
              />
            ))}
          </Picker>
        )}
      </View>

      <Text style={styles.label}>Phường / Xã</Text>

      <View style={styles.pickerWrap}>
        {loadingWards ? (
          <View style={styles.loadingPicker}>
            <ActivityIndicator size="small" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải phường/xã...</Text>
          </View>
        ) : (
          // FIX: bỏ className, thêm style color và color vào mỗi Picker.Item
          <Picker
            selectedValue={selectedWard}
            style={styles.picker}
            dropdownIconColor={PICKER_TEXT_COLOR}
            enabled={wards.length > 0}
            onValueChange={value => {
              setSelectedWard(value);
              setAddressLine('');
            }}
          >
            <Picker.Item
              label="Chọn phường/xã"
              value={null}
              color={PICKER_TEXT_COLOR}
            />
            {wards.map(w => (
              <Picker.Item
                key={w.wardCode}
                label={w.wardName}
                value={w.wardCode}
                color={PICKER_TEXT_COLOR}
              />
            ))}
          </Picker>
        )}
      </View>

      <Text style={styles.label}>Địa chỉ</Text>

      <TextInput
        value={addressLine}
        onChangeText={setAddressLine}
        placeholder="Số nhà, tên đường..."
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />

      <View style={styles.defaultRow}>
        <TouchableOpacity
          onPress={() => {
            setIsDefault(prev => {
              const nextValue = !prev;
              console.log('TOGGLE_IS_DEFAULT:', nextValue);
              return nextValue;
            });
          }}
          style={[
            styles.checkbox,
            isDefault && styles.checkboxActive,
          ]}
          activeOpacity={0.8}
        >
          {isDefault ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setIsDefault(prev => {
              const nextValue = !prev;
              console.log('TOGGLE_IS_DEFAULT_TEXT:', nextValue);
              return nextValue;
            });
          }}
          style={styles.defaultTextWrap}
        >
          <Text style={styles.defaultText}>Đặt làm địa chỉ mặc định</Text>
          <Text style={styles.defaultSubText}>
            Nếu chọn, địa chỉ mặc định cũ sẽ được thay thế
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onSave}
        style={[
          styles.saveBtn,
          loading && styles.saveBtnDisabled,
        ]}
        activeOpacity={0.85}
        disabled={loading}
      >
        <View style={styles.saveBtnInner}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="checkmark"
              size={16}
              color="#fff"
              style={styles.saveBtnIcon}
            />
          )}

          <Text style={styles.saveBtnText}>
            {loading
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật địa chỉ'
                : 'Lưu địa chỉ'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isModal) {
    return (
      <Modal visible transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={modalStyles.modalWrap}
        >
          <View style={modalStyles.backdrop}>
            <View style={modalStyles.sheet}>
              <View style={styles.header}>
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={styles.headerBtn}
                >
                  <Text style={styles.headerBtnText}>✕</Text>
                </Pressable>

                <Text style={styles.headerTitle}>
                  {isEditing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
                </Text>

                <View style={styles.headerBtn} />
              </View>

              <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                {Content}
              </ScrollView>

              <ModalPopup
                {...(modalProps as any)}
                onClose={closeModal}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          {isEditing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
        </Text>

        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {Content}
      </ScrollView>

      <ModalPopup
        {...(modalProps as any)}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

function normalizeVietnamPhone(phone: string): string {
  return phone.replace(/\D/g, '').trim();
}

function isValidVietnamPhone(phone: string): boolean {
  const normalized = normalizeVietnamPhone(phone);
  const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
  return vnPhoneRegex.test(normalized);
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFAF0',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },

  headerBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBtnText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    color: '#111827',
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 3,
  },

  label: {
    marginTop: 10,
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 6,
    backgroundColor: '#fff',
    color: '#111827',
    fontSize: 14,
  },

  pickerWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  // FIX: style riêng cho Picker với color rõ ràng
  picker: {
    color: PICKER_TEXT_COLOR,
    backgroundColor: '#fff',
  },

  loadingPicker: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },

  checkboxActive: {
    backgroundColor: '#A0522D',
    borderColor: '#A0522D',
  },

  defaultTextWrap: {
    flex: 1,
  },

  defaultText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },

  defaultSubText: {
    marginTop: 2,
    color: '#9CA3AF',
    fontSize: 12,
  },

  saveBtn: {
    marginTop: 24,
    backgroundColor: '#A0522D',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowRadius: 10,
    elevation: 4,
  },

  saveBtnDisabled: {
    opacity: 0.7,
  },

  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },

  saveBtnIcon: {
    marginRight: 8,
    opacity: 0.95,
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});

const modalStyles = StyleSheet.create({
  modalWrap: {
    flex: 1,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },

  sheet: {
    backgroundColor: '#FFFAF0',
    borderRadius: 16,
    padding: 12,
    maxHeight: '90%',
  },
});