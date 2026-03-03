import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

type Props = {
  visible: boolean;
  label: string;
  initialValue?: number;
  onClose: () => void;
  onSave: (value: number | undefined) => void;
};

export default function MeasurementModal({ visible, label, initialValue, onClose, onSave }: Props) {
  const [val, setVal] = useState(initialValue != null ? String(initialValue) : '');

  useEffect(() => {
    setVal(initialValue != null ? String(initialValue) : '');
  }, [initialValue, visible]);

  const handleSave = () => {
    const num = Number(val.replace(',', '.'));
    onSave(isNaN(num) ? undefined : num);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.kav}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <View style={styles.sheet}>
              <Text style={styles.title}>{label}</Text>
              <Text style={styles.subtitle}>Ước lượng gần đúng. Nhập số theo cm.</Text>

              <View style={styles.inputRow}>
                <TextInput
                  keyboardType="numeric"
                  value={val}
                  onChangeText={setVal}
                  style={styles.input}
                  placeholder="Ví dụ: 72"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                <View style={styles.unitPill}>
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveBtn}>
                  <Text style={styles.saveText}>Lưu</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#666', marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    borderRadius: 10,
    fontSize: 20,
    marginRight: 10,
  },
  unitPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: { color: '#333', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#444' },
  saveBtn: { backgroundColor: '#b5651d', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: 'white', fontWeight: '700' },
});
