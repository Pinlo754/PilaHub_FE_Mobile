import { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button, { ColorType } from './Button';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../theme/colors';

type ConfirmModal = {
  mode: 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
};

type NotiModal = {
  mode: 'noti';
  onConfirm?: () => void;
};

type ToastModal = {
  mode: 'toast';
  onConfirm?: never;
  onCancel?: never;
};

type CommonProps = {
  visible: boolean;
  onClose: () => void;
  titleText?: string;
  contentText: string;
  iconName?: string;
  iconSize?: number;
  iconBgColor?: IconColor;
  confirmBtnText?: string;
  confirmBtnColor?: ColorType;
  cancelBtnText?: string;
  cancelBtnColor?: ColorType;
  modalWidth?: number;
  btnWidth?: number;
  btnHeight?: number;
};

export type IconColor = 'grey' | 'red' | 'green' | 'blue' | 'yellow';

type Props = CommonProps & (ConfirmModal | NotiModal | ToastModal);

const getColors = (type: IconColor): string => {
  const colorMap: Record<IconColor, string> = {
    red: colors.danger.DEFAULT,
    yellow: colors.warning.DEFAULT,
    green: colors.success.DEFAULT,
    blue: colors.info.darker,
    grey: colors.inactive.darker,
  };

  return colorMap[type] ?? '#D3D3D3';
};

const ModalPopup = (props: Props) => {
  const {
    visible,
    mode,
    onClose,
    titleText,
    contentText,
    iconName,
    iconSize = 30,
    iconBgColor = 'green',
    confirmBtnText = 'Xác nhận',
    confirmBtnColor = 'green',
    cancelBtnText = 'Hủy',
    cancelBtnColor = 'grey',
    modalWidth = 355,
    btnWidth = 80,
    btnHeight,
  } = props;

  const iconColor = getColors(iconBgColor);

  const renderButtons = () => {
    if (mode === 'confirm') {
      const { onCancel, onConfirm } = props as ConfirmModal;
      return (
        <View style={styles.btnConfirm}>
          <Button
            text={cancelBtnText}
            colorType={cancelBtnColor}
            onPress={onCancel ?? onClose}
            width={btnWidth}
            height={btnHeight}
          />
          <Button
            text={confirmBtnText}
            colorType={confirmBtnColor}
            onPress={onConfirm}
            width={btnWidth}
            height={btnHeight}
          />
        </View>
      );
    }

    if (mode === 'noti') {
      const { onConfirm } = props as NotiModal;
      return (
        <View style={styles.btnNoti}>
          <Button
            text={confirmBtnText}
            colorType={confirmBtnColor}
            onPress={onConfirm ?? onClose}
            width={btnWidth}
            height={btnHeight}
          />
        </View>
      );
    }

    return null;
  };

  useEffect(() => {
    if (mode === 'toast' && visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode, visible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: modalWidth }]}>
          {/* Close button */}
          {mode !== 'toast' && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={25} color="#B0B0B0" />
            </TouchableOpacity>
          )}

          {/* Title */}
          {titleText && titleText.length > 0 && (
            <>
              <Text style={styles.titleText}>{titleText}</Text>
              <View style={styles.divider}></View>
            </>
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            {iconName && (
              <View
                style={[styles.iconContainer, { backgroundColor: iconColor }]}
              >
                <Ionicons
                  name={iconName as any}
                  size={iconSize}
                  color="white"
                />
              </View>
            )}

            <Text style={styles.contentText}>{contentText}</Text>

            {/* Buttons */}
            {renderButtons()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'white',
    padding: 14,
    paddingTop: 18,
    borderRadius: 15,
    width: '60%',
    zIndex: 100000,
  },
  titleText: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.foreground,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 2,
    top: -2,
    padding: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D3D3D3',
    marginBottom: 10,
    marginTop: 5,
  },
  contentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  contentText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: colors.foreground,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnConfirm: {
    flexDirection: 'row',
    gap: 10,
  },
  btnNoti: {
    alignSelf: 'flex-end',
  },
});

export default ModalPopup;
