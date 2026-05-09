import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalPopup from '../../components/ModalPopup';
import * as ImagePicker from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { Asset } from 'react-native-image-picker';
import {
  getOrderById,
  cancelOrder,
  createOrderReturn,
  getOrderTracking,
  getReturnByOrder,
  getReturnReasons,
  review,
} from '../../services/order';

const placeholderImg = require('../../assets/placeholderAvatar.png');

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#B7791F',
  warningBg: '#FEF3C7',
  soft: '#FFF7ED',
};

const statusColor = (status?: string) => {
  switch (String(status)) {
    case 'PROCESSING':
    case 'PENDING':
    case 'CONFIRMED':
      return { backgroundColor: '#FFF7ED', color: '#D97706' };
    case 'READY_FOR_PICK':
    case 'SHIPPED':
      return { backgroundColor: '#E0F2FE', color: '#0369A1' };
    case 'DELIVERED':
    case 'COMPLETED':
      return { backgroundColor: '#ECFDF5', color: '#065F46' };
    case 'CANCELLED':
    case 'RETURNED':
    case 'REFUNDED':
    case 'FAILED_DELIVERY':
      return { backgroundColor: '#FFF1F2', color: '#BE123C' };
    default:
      return { backgroundColor: '#F3F4F6', color: '#111827' };
  }
};

// ─── Return status helpers ────────────────────────────────────────────────────

const returnStatusColor = (status?: string) => {
  switch (String(status).toUpperCase()) {
    case 'PENDING':
    case 'REQUESTED':
      return { bg: '#FFF7ED', color: '#D97706', icon: 'time-outline' };
    case 'APPROVED':
    case 'PROCESSING':
      return { bg: '#E0F2FE', color: '#0369A1', icon: 'checkmark-circle-outline' };
    case 'COMPLETED':
    case 'REFUNDED':
      return { bg: '#ECFDF5', color: '#047857', icon: 'checkmark-done-circle-outline' };
    case 'REJECTED':
    case 'CANCELLED':
      return { bg: '#FFF1F2', color: '#BE123C', icon: 'close-circle-outline' };
    default:
      return { bg: '#F3F4F6', color: '#111827', icon: 'help-circle-outline' };
  }
};

const mapReturnStatusLabel = (status?: string) => {
  switch (String(status).toUpperCase()) {
    case 'PENDING':    return 'Chờ duyệt';
    case 'REQUESTED':  return 'Đã gửi yêu cầu';
    case 'APPROVED':   return 'Đã duyệt';
    case 'PROCESSING': return 'Đang xử lý';
    case 'COMPLETED':  return 'Hoàn tất';
    case 'REFUNDED':   return 'Đã hoàn tiền';
    case 'REJECTED':   return 'Bị từ chối';
    case 'CANCELLED':  return 'Đã huỷ';
    default:           return String(status ?? 'N/A');
  }
};

const mapOrderStatusLabel = (status?: string) => {
  switch (String(status)) {
    case 'PENDING': return 'Chờ xử lý';
    case 'PROCESSING': return 'Đang xử lý';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'READY': return 'Sẵn sàng giao';
    case 'SHIPPED': return 'Đang giao';
    case 'DELIVERED': return 'Đã giao';
    case 'COMPLETED': return 'Hoàn tất';
    case 'CANCELLED': return 'Đã huỷ';
    case 'RETURNED': return 'Đã trả hàng';
    case 'REFUNDED': return 'Đã hoàn tiền';
    case 'FAILED_DELIVERY': return 'Giao thất bại';
    default: return String(status ?? 'N/A');
  }
};

const formatCurrency = (amount: any) => {
  try {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  } catch {
    return String(amount ?? 0);
  }
};

// ─── FORMAT THỜI GIAN +7 GIỜ ──────────────────────────────────────────────
const add7Hours = (date: Date): Date => {
  const newDate = new Date(date.getTime());
  newDate.setHours(newDate.getHours() + 7);
  return newDate;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    const adjusted = add7Hours(date);
    return adjusted.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    const adjusted = add7Hours(date);
    return adjusted.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
};
// ─── Types ────────────────────────────────────────────────────────────────────

type ReturnableDetail = {
  orderDetailId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  returnQty: number;
  checked: boolean;
};

// Map reason code → tiếng Việt (fallback sang description nếu không khớp)
const REASON_CODE_VI: Record<string, string> = {
  DAMAGED:           'Sản phẩm bị hư hỏng',
  WRONG_ITEM:        'Giao sai sản phẩm',
  MISSING_ITEM:      'Thiếu sản phẩm',
  NOT_AS_DESCRIBED:  'Không đúng mô tả',
  POOR_QUALITY:      'Chất lượng kém',
  CHANGED_MIND:      'Đổi ý, không muốn mua',
  DUPLICATE_ORDER:   'Đặt trùng đơn',
  LATE_DELIVERY:     'Giao hàng quá trễ',
  OTHER:             'Lý do khác',
};

const mapReasonCodeVI = (code?: string, description?: string): string => {
  if (!code) return description ?? 'Không rõ lý do';
  return REASON_CODE_VI[String(code).toUpperCase()] ?? description ?? String(code);
};

// Build a map: orderDetailId → total returned quantity across all return requests
// API trả về field "itemReturns" (không phải "items")
const buildReturnedQtyMap = (returns: any[]): Record<string, number> => {
  const map: Record<string, number> = {};
  if (!Array.isArray(returns)) return map;
  for (const ret of returns) {
    // Hỗ trợ cả "itemReturns" (schema mới) và "items" (fallback)
    const items = Array.isArray(ret.itemReturns) ? ret.itemReturns
                : Array.isArray(ret.items)       ? ret.items
                : [];
    for (const item of items) {
      const id = String(item.orderDetailId ?? item.id ?? '');
      if (!id) continue;
      // Chỉ tính các return chưa bị từ chối/huỷ
      const retStatus = String(ret.status ?? '').toUpperCase();
      if (['REJECTED', 'CANCELLED'].includes(retStatus)) continue;
      map[id] = (map[id] ?? 0) + Number(item.quantity ?? 0);
    }
  }
  return map;
};

// ─── Component ────────────────────────────────────────────────────────────────

const OrderDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation: any = useNavigation();
  const { orderId } = (route.params as any) ?? { orderId: '' };

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [tracking, setTracking] = useState<any | null>(null);

  // Return data
  const [orderReturns, setOrderReturns] = useState<any[]>([]);
  const [expandedReturn, setExpandedReturn] = useState<Record<string, boolean>>({});

  // Return reasons from API
  const [returnReasons, setReturnReasons] = useState<any[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [returnReasonOther, setReturnReasonOther] = useState(''); // chỉ dùng khi chọn OTHER

  // Cancel modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Return bottom-sheet
  const [returnSheetVisible, setReturnSheetVisible] = useState(false);
  const [returnItems,        setReturnItems]        = useState<ReturnableDetail[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState<Record<string, boolean>>({});

  // ModalPopup state
  const [modalState, setModalState] = useState<any>({ visible: false, mode: 'noti', message: '' });

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const handleSelectMedia = async () => {
    const result = await ImagePicker.launchImageLibrary({
      mediaType: 'photo', // Hoặc 'mixed' nếu backend hỗ trợ video
      quality: 0.8,
      selectionLimit: 5 - selectedAssets.length, // Giới hạn tổng 5 file
    });

    if (result.assets) {
      setSelectedAssets(prev => [...prev, ...result.assets!]);
    }
  };

  const uploadAllToFirebase = async (assets: Asset[]): Promise<string[]> => {
    const uploadPromises = assets.map(async (asset) => {
      const { uri, fileName, type } = asset;
      if (!uri) return null;

      const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const path = `reviews/${Date.now()}_${fileName || 'image.jpg'}`;
      const reference = storage().ref(path);

      try {
        await reference.putFile(uploadUri);
        return await reference.getDownloadURL();
      } catch (e) {
        console.error("Firebase Upload Error: ", e);
        return null;
      }
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter((url): url is string => url !== null); // Loại bỏ các request thất bại
  };

  const submitReview = async () => {
    // 1. Validate dữ liệu đầu vào
    if (!comment.trim()) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập bình luận', mode: 'noti' });
      return;
    }

    setActionLoading(true);

    try {
      // 2. Upload toàn bộ ảnh lên Firebase và lấy danh sách URLs
      let uploadedUrls: string[] = [];
      if (selectedAssets.length > 0) {
        uploadedUrls = await uploadAllToFirebase(selectedAssets);

        if (uploadedUrls.length === 0 && selectedAssets.length > 0) {
          throw new Error("Không thể tải ảnh lên máy chủ.");
        }
      }

      // 3. Chuẩn bị Payload
      // Nếu backend chỉ nhận 1 string imageUrl, ta lấy cái đầu tiên: uploadedUrls[0]
      // Nếu backend nhận mảng, ta gửi: uploadedUrls.join(',') hoặc gửi cả mảng
      const payload = {
        productId: selectedProduct.productId,
        rating: rating,
        comment: comment.trim(),
        imageUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : "",
      };

      // 4. Gọi API review
      await review(payload);

      // 5. Thành công
      showModal({
        title: 'Thành công',
        message: 'Cảm ơn bạn đã đánh giá sản phẩm!',
        mode: 'noti'
      });

      setReviewModalVisible(false);
      resetForm();

    } catch (err: any) {
      console.error("Submit Review Error:", err);
      showModal({
        title: 'Lỗi',
        message: err.message || 'Không thể gửi đánh giá',
        mode: 'noti'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setComment('');
    setSelectedAssets([]);
    setRating(5);
  };

  const removeAsset = (index: number) => {
    setSelectedAssets(prev => prev.filter((_, i) => i !== index));
  };



  const showModal = (opts: {
    title?: string; message: string;
    mode?: 'noti' | 'confirm' | 'toast';
    onConfirm?: () => void;
  }) => {
    setModalState({
      visible: true,
      mode: opts.mode ?? 'noti',
      title: opts.title,
      message: opts.message,
      onConfirm: () => {
        try { setModalState((s: any) => ({ ...s, visible: false })); } catch { }
        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closeModal = () => setModalState((s: any) => ({ ...s, visible: false }));

  // Deduplicate order details
  const uniqueOrderDetails = React.useMemo(() => {
    const arr = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const detail of arr) {
      const id = String(detail?.orderDetailId ?? detail?.id ?? JSON.stringify(detail));
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(detail);
    }
    return out;
  }, [order]);

  // Map: orderDetailId → returned quantity (non-rejected)
  const returnedQtyMap = React.useMemo(() => buildReturnedQtyMap(orderReturns), [orderReturns]);

  // Items eligible for return (DELIVERED or COMPLETED at detail level, or fall back to order status)
  const returnableDetails = React.useMemo(() => {
    return uniqueOrderDetails.filter((d: any) => {
      const s = String(d.status ?? '');
      const orderS = String(order?.status ?? '');
      return (
        s === 'DELIVERED' || s === 'COMPLETED' ||
        orderS === 'DELIVERED' || orderS === 'COMPLETED'
      );
    });
  }, [uniqueOrderDetails, order]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch { }
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);

      if (data?.orderNumber) {
        try {
          const trackingData = await getOrderTracking(data.orderNumber);
          setTracking(trackingData);
        } catch (e) {
          console.warn('getOrderTracking', e);
          setTracking(null);
        }
      }

      // Load return requests for this order
      try {
        const returnData = await getReturnByOrder(orderId);
        setOrderReturns(Array.isArray(returnData) ? returnData : returnData ? [returnData] : []);
      } catch (e) {
        console.warn('getReturnByOrder', e);
        setOrderReturns([]);
      }

      // Load return reasons (chỉ fetch 1 lần là đủ)
      try {
        const reasons = await getReturnReasons();
        setReturnReasons(Array.isArray(reasons) ? reasons.filter((r: any) => r.enabled !== false) : []);
      } catch (e) {
        console.warn('getReturnReasons', e);
      }
    } catch (e) {
      console.warn('getOrderById', e);
      showModal({ title: 'Lỗi', message: 'Không thể tải thông tin đơn hàng', mode: 'noti' });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  // ── Cancel ────────────────────────────────────────────────────────────────

  const openCancelModal = () => {
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const performCancelOrder = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập lý do', mode: 'noti' });
      return;
    }
    try {
      setActionLoading(true);
      await cancelOrder(order.orderId, reason);
      showModal({ title: 'Thành công', message: 'Đơn hàng đã được hủy', mode: 'noti' });
      setCancelModalVisible(false);
      await load();
    } catch (err: any) {
      console.error('cancelOrder', err);
      showModal({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Không thể hủy đơn',
        mode: 'noti',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Return sheet ──────────────────────────────────────────────────────────

  const openReturnSheet = () => {
    const items: ReturnableDetail[] = returnableDetails.map((d: any) => ({
      orderDetailId: d.orderDetailId,
      productName: d.productName,
      productImageUrl: d.productImageUrl,
      quantity: Number(d.quantity ?? 1),
      unitPrice: Number(d.unitPrice ?? 0),
      returnQty: Number(d.quantity ?? 1),
      checked: false,
    }));
    setReturnItems(items);
    setSelectedReasonId('');
    setReturnReasonOther('');
    setReturnSheetVisible(true);
  };

  const toggleReturnItem = (orderDetailId: string) => {
    setReturnItems(prev =>
      prev.map(it =>
        it.orderDetailId === orderDetailId ? { ...it, checked: !it.checked } : it
      )
    );
  };

  const setReturnQty = (orderDetailId: string, qty: number) => {
    setReturnItems(prev =>
      prev.map(it => {
        if (it.orderDetailId !== orderDetailId) return it;
        const clamped = Math.max(1, Math.min(qty, it.quantity));
        return { ...it, returnQty: clamped };
      })
    );
  };

  const selectedReturnItems = returnItems.filter(it => it.checked);

  const performReturn = async () => {
    // Resolve lý do: nếu chọn reason từ API thì dùng description/code, nếu OTHER thì cần nhập thêm
    const selectedReason = returnReasons.find(r => r.reasonId === selectedReasonId);
    const isOther = selectedReason?.code?.toUpperCase() === 'OTHER' || !selectedReasonId;
    const finalReason = isOther
      ? returnReasonOther.trim()
      : (selectedReason ? mapReasonCodeVI(selectedReason.code, selectedReason.description) : '');

    if (!selectedReasonId && !returnReasonOther.trim()) {
      showModal({ title: 'Lỗi', message: 'Vui lòng chọn lý do trả hàng', mode: 'noti' });
      return;
    }
    if (isOther && !returnReasonOther.trim()) {
      showModal({ title: 'Lỗi', message: 'Vui lòng nhập lý do cụ thể', mode: 'noti' });
      return;
    }
    if (selectedReturnItems.length === 0) {
      showModal({ title: 'Lỗi', message: 'Vui lòng chọn ít nhất 1 sản phẩm để trả', mode: 'noti' });
      return;
    }
    try {
      setActionLoading(true);
      await createOrderReturn({
        reason: finalReason,
        items: selectedReturnItems.map(it => ({
          orderDetailId: it.orderDetailId,
          quantity: it.returnQty,
        })),
      });
      showModal({ title: 'Đã gửi', message: 'Yêu cầu trả hàng đã được gửi', mode: 'noti' });
      setReturnSheetVisible(false);
      await load();
    } catch (err: any) {
      console.error('createOrderReturn', err);
      showModal({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Không thể gửi yêu cầu trả hàng',
        mode: 'noti',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Misc ──────────────────────────────────────────────────────────────────

  const toggleShipment = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedShipments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReturnSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedReturn(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      let copied = false;
      try {
        const Clipboard = require('@react-native-clipboard/clipboard');
        Clipboard.setString(String(text));
        copied = true;
      } catch { }
      if (copied) {
        showModal({ title: 'Đã sao chép', message: 'Mã vận đơn đã được sao chép', mode: 'noti' });
      } else {
        showModal({ title: 'Không hỗ trợ', message: 'Không thể sao chép trên thiết bị này', mode: 'noti' });
      }
    } catch (e) {
      console.warn('copyToClipboard', e);
      showModal({ title: 'Lỗi', message: 'Không thể sao chép', mode: 'noti' });
    }
  };

  // ── Loading / empty guards ────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
              <Text style={styles.headerSub}>Không tìm thấy đơn hàng</Text>
            </View>
            <View style={styles.headerPlaceholder} />
          </View>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>Không tìm thấy đơn hàng</Text>
          <Text style={styles.emptyDesc}>Vui lòng quay lại và thử lại sau.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderStatus = statusColor(order.status);
  const canCancel = String(order.status) === 'PROCESSING' || String(order.status) === 'PENDING';
  const canReturn = (
    String(order.status) === 'DELIVERED' ||
    returnableDetails.length > 0
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {order.orderNumber ?? order.orderId}
            </Text>
          </View>
          <TouchableOpacity onPress={load} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.heroOrderNo} numberOfLines={1}>
                Đơn {order.orderNumber ?? order.orderId}
              </Text>
              <Text style={styles.heroDate}>Tạo: {formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={[styles.orderStatusBadge, { backgroundColor: orderStatus.backgroundColor }]}>
              <Text style={[styles.orderStatusText, { color: orderStatus.color }]}>
                {mapOrderStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <View style={styles.heroSummaryRow}>
            <View style={styles.heroSummaryItem}>
              <Text style={styles.summarySmall}>Tổng tiền</Text>
              <Text style={styles.summaryStrong}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroSummaryItem}>
              <Text style={styles.summarySmall}>Thanh toán</Text>
              <Text style={styles.summaryStrong}>
                {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipping info */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin giao nhận</Text>
          </View>
          <Text style={styles.receiverText}>
            {order.recipientName} • {order.recipientPhone}
          </Text>
          <Text style={styles.shippingAddress}>{order.shippingAddress}</Text>
        </View>

        {/* Products */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
          </View>

          {uniqueOrderDetails.map((detail: any) => {
            const returnedQty = returnedQtyMap[String(detail.orderDetailId)] ?? 0;
            const totalQty = Number(detail.quantity ?? 0);
            const hasReturn = returnedQty > 0;
            const isFullReturn = hasReturn && returnedQty >= totalQty;

            return (
              <View key={detail.orderDetailId} style={styles.itemRow}>
                <View style={styles.thumbWrapper}>
                  <Image
                    source={detail.productImageUrl ? { uri: detail.productImageUrl } : placeholderImg}
                    style={[styles.thumb, isFullReturn && styles.thumbDimmed]}
                  />
                  {isFullReturn && (
                    <View style={styles.thumbReturnOverlay}>
                      <Ionicons name="arrow-undo" size={16} color="#fff" />
                    </View>
                  )}
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {detail.productName}
                  </Text>

                  {/* Quantity row — show returned breakdown */}
                  <View style={styles.itemQtyRow}>
                    <Text style={styles.meta}>
                      {totalQty} × {formatCurrency(detail.unitPrice)}
                    </Text>
                    {hasReturn && (
                      <View style={styles.returnedQtyBadge}>
                        <Ionicons name="arrow-undo-outline" size={10} color="#B7791F" />
                        <Text style={styles.returnedQtyText}>
                          Đã trả {returnedQty}/{totalQty}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quantity progress bar for partial return */}
                  {hasReturn && !isFullReturn && (
                    <View style={styles.returnProgressBar}>
                      <View
                        style={[
                          styles.returnProgressFill,
                          { width: `${(returnedQty / totalQty) * 100}%` as any },
                        ]}
                      />
                    </View>
                  )}

                  <View style={styles.detailStatusPill}>
                    <Text style={styles.detailStatusText}>{String(detail.status)}</Text>
                  </View>

                  {detail.installationRequest ? (
                    <View style={styles.installPill}>
                      <Ionicons name="construct-outline" size={13} color={COLORS.success} />
                      <Text style={styles.installText}>Có yêu cầu lắp đặt</Text>
                    </View>
                  ) : null}
                </View>
                ) : null}
                {/* Trong vòng lặp uniqueOrderDetails.map */}
                {(detail.status === 'DELIVERED' || detail.status === 'COMPLETED') && (
                  <TouchableOpacity
                    style={styles.reviewTriggerBtn}
                    onPress={() => {
                      setSelectedProduct(detail);
                      setReviewModalVisible(true);
                    }}
                  >
                    <Ionicons name="star-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.reviewTriggerText}>Đánh giá sản phẩm</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Return Requests Section ────────────────────────────────────────── */}
        {orderReturns.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="arrow-undo-circle-outline" size={19} color={COLORS.warning} />
              <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
                Yêu cầu trả hàng ({orderReturns.length})
              </Text>
            </View>

            {orderReturns.map((ret: any, idx: number) => {
              const retKey = `return-${ret.returnId ?? ret.id ?? idx}`;
              const isExpanded = expandedReturn[retKey] ?? false;
              const sc = returnStatusColor(ret.status);
              // Hỗ trợ cả "itemReturns" (schema API) và "items" (fallback cũ)
              const retItems: any[] = Array.isArray(ret.itemReturns) ? ret.itemReturns
                                    : Array.isArray(ret.items)       ? ret.items
                                    : [];

              // refundAmount đã có sẵn từng item theo schema mới
              const totalRefund = retItems.reduce(
                (sum: number, item: any) => sum + Number(item.refundAmount ?? 0),
                0
              );

              return (
                <View key={retKey} style={styles.returnRequestCard}>
                  {/* Return request header — always visible */}
                  <Pressable
                    style={styles.returnRequestHeader}
                    onPress={() => toggleReturnSection(retKey)}
                  >
                    {/* Status icon + label */}
                    <View style={[styles.returnStatusDot, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon as any} size={16} color={sc.color} />
                    </View>

                    <View style={styles.flex1}>
                      <View style={styles.returnRequestTitleRow}>
                        <Text style={styles.returnRequestTitle}>
                          Yêu cầu #{idx + 1}
                        </Text>
                        <View style={[styles.returnStatusBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.returnStatusBadgeText, { color: sc.color }]}>
                            {mapReturnStatusLabel(ret.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.returnRequestDate}>
                        {formatDateTime(ret.createdAt ?? ret.requestedAt)}
                      </Text>
                      {/* Quick summary */}
                      <Text style={styles.returnRequestSummary} numberOfLines={1}>
                        {retItems.length} sản phẩm
                        {totalRefund > 0 ? ` · Hoàn ${formatCurrency(totalRefund)}` : ''}
                      </Text>
                    </View>

                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.muted}
                    />
                  </Pressable>

                  {/* Expandable detail */}
                  {isExpanded && (
                    <View style={styles.returnRequestBody}>
                      {/* Reason */}
                      {ret.reason ? (
                        <View style={styles.returnReasonBox}>
                          <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.muted} />
                          <Text style={styles.returnReasonBoxText}>{ret.reason}</Text>
                        </View>
                      ) : null}

                      {/* Rejection reason */}
                      {ret.rejectionReason ? (
                        <View style={[styles.returnReasonBox, styles.rejectionBox]}>
                          <Ionicons name="alert-circle-outline" size={13} color="#BE123C" />
                          <Text style={[styles.returnReasonBoxText, { color: '#BE123C' }]}>
                            Lý do từ chối: {ret.rejectionReason}
                          </Text>
                        </View>
                      ) : null}

                      {/* Items list */}
                      <Text style={styles.returnItemsHeading}>Sản phẩm trả</Text>
                      {retItems.map((item: any, itemIdx: number) => {
                        // Try to find product info from order details
                        const matched = uniqueOrderDetails.find(
                          (d: any) => String(d.orderDetailId) === String(item.orderDetailId ?? item.id)
                        );
                        const productName  = item.productName ?? matched?.productName ?? `Sản phẩm #${itemIdx + 1}`;
                        const imageUrl     = item.productImageUrl ?? matched?.productImageUrl;
                        // refundAmount đã có sẵn từ API; fallback tính lại nếu thiếu
                        const refundAmt    = Number(item.refundAmount ?? 0);
                        const unitPrice    = Number(matched?.unitPrice ?? 0);
                        const qty          = Number(item.quantity ?? 0);
                        const totalQtyInOrder = Number(matched?.quantity ?? qty);
                        const displayAmount = refundAmt > 0 ? refundAmt : unitPrice * qty;

                        return (
                          <View key={itemIdx} style={styles.returnDetailItem}>
                            <Image
                              source={imageUrl ? { uri: imageUrl } : placeholderImg}
                              style={styles.returnDetailThumb}
                            />
                            <View style={styles.flex1}>
                              <Text style={styles.returnDetailName} numberOfLines={2}>
                                {productName}
                              </Text>
                              {/* Qty fraction + amount */}
                              <View style={styles.returnDetailQtyRow}>
                                <Text style={styles.returnDetailQtyLabel}>
                                  Trả {qty}/{totalQtyInOrder} cái
                                </Text>
                                {displayAmount > 0 && (
                                  <Text style={styles.returnDetailAmount}>
                                    {formatCurrency(displayAmount)}
                                  </Text>
                                )}
                              </View>
                              {/* Visual fraction bar */}
                              <View style={styles.returnDetailBar}>
                                <View
                                  style={[
                                    styles.returnDetailBarFill,
                                    { width: `${Math.min((qty / totalQtyInOrder) * 100, 100)}%` as any },
                                  ]}
                                />
                              </View>
                              {/* Per-item reason (nếu có) */}
                              {item.reason ? (
                                <Text style={styles.returnDetailItemReason} numberOfLines={2}>
                                  {item.reason}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}

                      {/* Refund summary */}
                      {totalRefund > 0 && (
                        <View style={styles.refundSummaryRow}>
                          <Ionicons name="wallet-outline" size={14} color={COLORS.success} />
                          <Text style={styles.refundSummaryLabel}>Tổng hoàn trả:</Text>
                          <Text style={styles.refundSummaryAmount}>
                            {formatCurrency(totalRefund)}
                          </Text>
                        </View>
                      )}

                      {/* Resolved date */}
                      {(ret.resolvedAt ?? ret.processedAt) && (
                        <Text style={styles.returnResolvedDate}>
                          Xử lý lúc: {formatDateTime(ret.resolvedAt ?? ret.processedAt)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Shipment tracking */}
        {tracking && Array.isArray(tracking.shipments) && tracking.shipments.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube-outline" size={19} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Vận chuyển</Text>
            </View>

            {tracking.shipments.map((shipment: any, shipmentIdx: number) => {
              const shipmentKey = `shipment-${shipmentIdx}`;
              const isExpanded = expandedShipments[shipmentKey] ?? false;

              const allStatuses = [
                { value: 'READY_TO_PICK', label: 'Chuẩn bị giao' },
                { value: 'PICKING', label: 'Đang chuẩn bị' },
                { value: 'PICKED', label: 'Đã chuẩn bị' },
                { value: 'TRANSPORTING', label: 'Đang vận chuyển' },
                { value: 'DELIVERING', label: 'Đang giao hàng' },
                { value: 'DELIVERED', label: 'Đã giao' },
              ];

              const currentStatus = String(shipment.status).toUpperCase();
              const currentIdx = allStatuses.findIndex(s => s.value === currentStatus);

              const getStatusColor = (_idx: number, isCurrent: boolean, isPast: boolean) => {
                if (isPast)    return { dotColor: '#10B981', lineColor: '#10B981', dotBg: '#ECFDF5' };
                if (isCurrent) return { dotColor:'#10B981', lineColor: '#10B981', dotBg: '#ECFDF5' };
                return           { dotColor: '#94A3B8', lineColor: '#CBD5E1', dotBg: '#F1F5F9' };
              };

              return (
                <View key={shipmentKey} style={styles.shipmentTimelineWrap}>
                  <Pressable
                    style={styles.shipmentTimelineHeader}
                    onPress={() => toggleShipment(shipmentKey)}
                  >
                    <View style={styles.flex1}>
                      <Text style={styles.vendorTitle}>
                        {shipment.vendor || `Lô hàng ${shipmentIdx + 1}`}
                      </Text>
                      {shipment.trackingNumber ? (
                        <Text style={styles.trackingNo}>Mã: {shipment.trackingNumber}</Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.primary}
                    />
                  </Pressable>

                  <View style={styles.timelineVertical}>
                    {allStatuses.slice(0, isExpanded ? allStatuses.length : 3).map((status, idx) => {
                      const isPast = currentIdx > idx;
                      const isCurrent = currentIdx === idx;
                      const colors = getStatusColor(idx, isCurrent, isPast);
                      return (
                        <View key={status.value} style={styles.timelineRowWrap}>
                          <View style={styles.timelineLeftCol}>
                            {idx > 0 && (
                              <View style={[styles.timelineLineBefore, { backgroundColor: colors.lineColor }]} />
                            )}
                            <View style={[styles.timelineDotLarge, { backgroundColor: colors.dotBg, borderColor: colors.dotColor }]}>
                              {isPast ? (
                                <Ionicons name="checkmark" size={12} color={colors.dotColor} />
                              ) : isCurrent ? (
                                <View style={styles.timelineActiveDot} />
                              ) : (
                                <View style={styles.timelineInactiveDot} />
                              )}
                            </View>
                            {idx < allStatuses.length - 1 && (
                              <View style={[styles.timelineLineAfter, { backgroundColor: currentIdx > idx ? colors.lineColor : '#E2E8F0' }]} />
                            )}
                          </View>
                          <View style={styles.timelineRightCol}>
                            <Text style={[
                              styles.timelineStepLabel,
                              {
                                color: isCurrent ? COLORS.primary : isPast ? '#047857' : '#94A3B8',
                                fontWeight: isCurrent ? '900' : isPast ? '800' : '700',
                                fontSize: isCurrent ? 14 : 13,
                              },
                            ]}>
                              {status.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}

                    {!isExpanded && allStatuses.length > 3 && (
                      <View style={styles.timelineMoreHint}>
                        <Text style={styles.timelineMoreText}>+{allStatuses.length - 3} bước khác</Text>
                      </View>
                    )}
                  </View>

                  {isExpanded && (
                    <View style={styles.shipmentExpandedDetails}>
                      {(shipment.provider || shipment.shippedAt || shipment.estimatedDeliveryDate || shipment.deliveredAt) ? (
                        <View style={styles.detailsGrid}>
                          {shipment.provider ? (
                            <View style={styles.detailsBox}>
                              <Text style={styles.detailsLabel}>Nhà cung cấp</Text>
                              <Text style={styles.detailsValue}>{shipment.provider}</Text>
                            </View>
                          ) : null}
                          {shipment.shippedAt ? (
                            <View style={styles.detailsBox}>
                              <Text style={styles.detailsLabel}>Ngày gửi</Text>
                              <Text style={styles.detailsValue}>{formatDate(shipment.shippedAt)}</Text>
                            </View>
                          ) : null}
                          {shipment.estimatedDeliveryDate ? (
                            <View style={styles.detailsBox}>
                              <Text style={styles.detailsLabel}>Dự kiến</Text>
                              <Text style={styles.detailsValue}>{formatDate(shipment.estimatedDeliveryDate)}</Text>
                            </View>
                          ) : null}
                          {shipment.deliveredAt ? (
                            <View style={styles.detailsBox}>
                              <Text style={styles.detailsLabel}>Giao thực tế</Text>
                              <Text style={styles.detailsValue}>{formatDate(shipment.deliveredAt)}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      {shipment.trackingNumber ? (
                        <Pressable
                          style={styles.copyTrackBtn}
                          onPress={() => copyToClipboard(shipment.trackingNumber)}
                        >
                          <Ionicons name="copy-outline" size={14} color="#fff" />
                          <Text style={styles.copyTrackText}>Sao chép mã vận đơn</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Payment summary */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={19} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng tiền</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.shippingFee)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phương thức</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod ?? '—'}</Text>
          </View>
          <View style={styles.paymentDivider} />
          <View style={styles.paymentRow}>
            <Text style={styles.paymentTotalLabel}>Trạng thái thanh toán</Text>
            <Text style={styles.paymentTotalValue}>
              {order.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
        </View>

        <Modal visible={reviewModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đánh giá sản phẩm</Text>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {/* Thông tin sản phẩm */}
                <View style={styles.reviewProductInfo}>
                  <Image source={{ uri: selectedProduct?.productImageUrl }} style={styles.reviewThumb} />
                  <Text style={styles.reviewProductName} numberOfLines={2}>{selectedProduct?.productName}</Text>
                </View>

                {/* Chọn Rating bằng Icon */}
                <View className='flex flex-row justify-center'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Ionicons
                        name={star <= rating ? "happy" : "happy-outline"}
                        size={40}
                        color={star <= rating ? COLORS.accent : COLORS.muted}
                      />
                    </TouchableOpacity>
                  ))}

                </View>
                <Text className='text-center mt-2'>
                  {rating === 5 ? 'Rất hài lòng' : rating >= 3 ? 'Hài lòng' : 'Chưa hài lòng'}
                </Text>
                {/* Input Comment */}
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Chất lượng sản phẩm tuyệt vời..."
                  multiline
                  value={comment}
                  onChangeText={setComment}
                />

                {/* Upload Ảnh */}
                <Text style={styles.uploadTitle}>Hình ảnh thực tế ({selectedAssets.length}/5)</Text>
                <View style={styles.imageGrid}>
                  {selectedAssets.map((asset, idx) => (
                    <View key={idx} style={styles.imageWrapper}>
                      <Image source={{ uri: asset.uri }} style={styles.previewImg} />
                      <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeAsset(idx)}>
                        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedAssets.length < 5 && (
                    <TouchableOpacity style={styles.addImgBtn} onPress={handleSelectMedia}>
                      <Ionicons name="camera-outline" size={30} color={COLORS.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              <Pressable style={styles.submitReviewBtn} onPress={submitReview} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitReviewText}>Gửi đánh giá</Text>}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Cancel button */}
        {canCancel ? (
          <View style={styles.card}>
            <Pressable style={styles.fullDangerBtn} onPress={openCancelModal} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator /> : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#C53030" />
                  <Text style={styles.fullDangerText}>Hủy đơn</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Return button */}
        {canReturn ? (
          <View style={styles.card}>
            <Pressable style={styles.fullWarningBtn} onPress={openReturnSheet} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator /> : (
                <>
                  <Ionicons name="arrow-undo-outline" size={18} color={COLORS.warning} />
                  <Text style={styles.fullWarningText}>Yêu cầu trả hàng</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

      </ScrollView>

      {/* ── Cancel Modal ── */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Nhập lý do..."
              value={cancelReason}
              onChangeText={setCancelReason}
              style={styles.modalInput}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCancelModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </Pressable>
              <Pressable onPress={performCancelOrder} style={styles.modalSend} disabled={actionLoading}>
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSendText}>Gửi</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Return Bottom Sheet ── */}
      <Modal
        visible={returnSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReturnSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.returnSheetCard}>
            {/* Sheet header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn sản phẩm trả hàng</Text>
              <TouchableOpacity onPress={() => setReturnSheetVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.returnItemList} showsVerticalScrollIndicator={false}>
              {returnItems.length === 0 ? (
                <Text style={styles.returnEmptyText}>Không có sản phẩm nào có thể trả.</Text>
              ) : (
                returnItems.map(item => (
                  <View key={item.orderDetailId} style={styles.returnItemRow}>
                    {/* Checkbox */}
                    <Pressable
                      style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                      onPress={() => toggleReturnItem(item.orderDetailId)}
                    >
                      {item.checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </Pressable>

                    {/* Thumbnail */}
                    <Image
                      source={item.productImageUrl ? { uri: item.productImageUrl } : placeholderImg}
                      style={styles.returnThumb}
                    />

                    {/* Info + qty stepper */}
                    <View style={styles.flex1}>
                      <Text style={styles.returnItemName} numberOfLines={2}>
                        {item.productName}
                      </Text>
                      <Text style={styles.returnItemMeta}>
                        {formatCurrency(item.unitPrice)} × {item.quantity} cái
                      </Text>

                      {/* Already returned notice */}
                      {(returnedQtyMap[item.orderDetailId] ?? 0) > 0 && (
                        <Text style={styles.alreadyReturnedNote}>
                          Đã có {returnedQtyMap[item.orderDetailId]} cái trong yêu cầu trước
                        </Text>
                      )}

                      {/* Quantity stepper — only if checked & quantity > 1 */}
                      {item.checked && item.quantity > 1 && (
                        <View style={styles.qtyStepper}>
                          <Text style={styles.qtyLabel}>Số lượng trả:</Text>
                          <View style={styles.qtyControls}>
                            <Pressable
                              style={styles.qtyBtn}
                              onPress={() => setReturnQty(item.orderDetailId, item.returnQty - 1)}
                            >
                              <Ionicons name="remove" size={14} color={COLORS.primary} />
                            </Pressable>
                            <TextInput
                              style={styles.qtyInput}
                              value={String(item.returnQty)}
                              keyboardType="number-pad"
                              maxLength={4}
                              selectTextOnFocus
                              onChangeText={text => {
                                const digits = text.replace(/[^0-9]/g, '');
                                if (digits === '') {
                                  setReturnItems(prev =>
                                    prev.map(it =>
                                      it.orderDetailId === item.orderDetailId
                                        ? { ...it, returnQty: 0 }
                                        : it
                                    )
                                  );
                                  return;
                                }
                                const parsed = parseInt(digits, 10);
                                setReturnQty(item.orderDetailId, parsed);
                              }}
                              onBlur={() => {
                                setReturnQty(item.orderDetailId, Math.max(1, item.returnQty));
                              }}
                            />
                            <Pressable
                              style={styles.qtyBtn}
                              onPress={() => setReturnQty(item.orderDetailId, item.returnQty + 1)}
                            >
                              <Ionicons name="add" size={14} color={COLORS.primary} />
                            </Pressable>
                          </View>
                          <Text style={styles.qtyMax}>tối đa {item.quantity}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}

              {/* ── Lý do trả hàng — chips từ API ── */}
              <Text style={styles.returnReasonLabel}>Lý do trả hàng *</Text>

              {returnReasons.length > 0 ? (
                <View style={styles.reasonChipsWrap}>
                  {returnReasons.map((r: any) => {
                    const isSelected = selectedReasonId === r.reasonId;
                    const label = mapReasonCodeVI(r.code, r.description);
                    return (
                      <Pressable
                        key={r.reasonId}
                        style={[styles.reasonChip, isSelected && styles.reasonChipSelected]}
                        onPress={() => setSelectedReasonId(isSelected ? '' : r.reasonId)}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={13} color="#fff" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextSelected]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                // Fallback: không có API reasons thì cho nhập tay
                <TextInput
                  placeholder="Nhập lý do trả hàng..."
                  value={returnReasonOther}
                  onChangeText={setReturnReasonOther}
                  style={styles.modalInput}
                  multiline
                  textAlignVertical="top"
                />
              )}

              {/* Ô nhập thêm — hiện khi chọn "OTHER" hoặc không có reasons từ API */}
              {returnReasons.length > 0 && (() => {
                const sel = returnReasons.find(r => r.reasonId === selectedReasonId);
                const isOther = !sel || sel?.code?.toUpperCase() === 'OTHER';
                return isOther ? (
                  <TextInput
                    placeholder="Mô tả thêm lý do của bạn..."
                    value={returnReasonOther}
                    onChangeText={setReturnReasonOther}
                    style={[styles.modalInput, { marginTop: 10 }]}
                    multiline
                    textAlignVertical="top"
                  />
                ) : null;
              })()}

              {/* Selected summary */}
              {selectedReturnItems.length > 0 && (
                <View style={styles.returnSummaryBadge}>
                  <Ionicons name="bag-check-outline" size={15} color={COLORS.warning} />
                  <Text style={styles.returnSummaryText}>
                    Đã chọn {selectedReturnItems.length} sản phẩm •{' '}
                    {formatCurrency(
                      selectedReturnItems.reduce((s, it) => s + it.unitPrice * it.returnQty, 0)
                    )}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setReturnSheetVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </Pressable>
              <Pressable
                onPress={performReturn}
                style={[
                  styles.modalSend,
                  selectedReturnItems.length === 0 && styles.modalSendDisabled,
                ]}
                disabled={actionLoading || selectedReturnItems.length === 0}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSendText}>Gửi yêu cầu</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, paddingBottom: 32 },

  headerWrap: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBackBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { color: COLORS.text, fontWeight: '900', fontSize: 20 },
  headerSub: { color: COLORS.muted, fontSize: 12, marginTop: 3, fontWeight: '600' },
  refreshBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  headerPlaceholder: { width: 42 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: '600' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, color: COLORS.text, fontSize: 18, fontWeight: '900' },
  emptyDesc: { marginTop: 6, color: COLORS.muted, textAlign: 'center' },

  heroCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroOrderNo: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  heroDate: { marginTop: 5, color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  orderStatusBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  orderStatusText: { fontWeight: '900', fontSize: 11 },
  heroSummaryRow: { marginTop: 16, backgroundColor: COLORS.soft, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  heroSummaryItem: { flex: 1 },
  heroDivider: { width: 1, height: 36, backgroundColor: COLORS.border, marginHorizontal: 12 },
  summarySmall: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  summaryStrong: { marginTop: 4, color: COLORS.text, fontSize: 14, fontWeight: '900' },

  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { marginLeft: 8, color: COLORS.text, fontWeight: '900', fontSize: 16 },
  receiverText: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  shippingAddress: { marginTop: 7, color: '#334155', fontSize: 13, lineHeight: 20, fontWeight: '600' },

  // Product item
  itemRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  thumbWrapper: { position: 'relative', marginRight: 12 },
  thumb:    { width: 66, height: 66, borderRadius: 14, backgroundColor: '#F1F5F9' },
  thumbDimmed: { opacity: 0.55 },
  thumbReturnOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(183,121,31,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  flex1:    { flex: 1 },
  itemTitle:{ fontSize: 14, fontWeight: '900', color: COLORS.text },
  itemQtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap', gap: 6 },
  meta:     { color: COLORS.muted, fontSize: 12, fontWeight: '600' },

  // Returned qty badge on product
  returnedQtyBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 999,
  },
  returnedQtyText: { marginLeft: 3, color: COLORS.warning, fontSize: 10, fontWeight: '800' },

  // Progress bar for partial return
  returnProgressBar: {
    marginTop: 6, height: 4, backgroundColor: '#F1E7DC',
    borderRadius: 999, overflow: 'hidden',
  },
  returnProgressFill: {
    height: '100%', backgroundColor: COLORS.warning, borderRadius: 999,
  },

  detailStatusPill: { marginTop: 7, backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  detailStatusText: { color: '#334155', fontSize: 10, fontWeight: '800' },
  installPill: { marginTop: 7, backgroundColor: COLORS.successBg, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  installText: { marginLeft: 5, color: COLORS.success, fontSize: 11, fontWeight: '800' },

  // ── Return Requests ──────────────────────────────────────────────────────

  returnRequestCard: {
    borderWidth: 1,
    borderColor: '#F3E7D9',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFBF7',
  },
  returnRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  returnStatusDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  returnRequestTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  returnRequestTitle: {
    color: COLORS.text, fontWeight: '800', fontSize: 14,
  },
  returnStatusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  returnStatusBadgeText: {
    fontSize: 10, fontWeight: '900',
  },
  returnRequestDate: {
    color: COLORS.muted, fontSize: 11, fontWeight: '600', marginTop: 2,
  },
  returnRequestSummary: {
    color: COLORS.muted, fontSize: 11, fontWeight: '600', marginTop: 1,
  },

  returnRequestBody: {
    borderTopWidth: 1, borderTopColor: '#F3E7D9',
    paddingHorizontal: 12, paddingVertical: 12,
  },

  returnReasonBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10, padding: 10, marginBottom: 10, gap: 7,
  },
  rejectionBox: {
    backgroundColor: '#FFF1F2',
  },
  returnReasonBoxText: {
    flex: 1, color: COLORS.muted, fontSize: 12, fontWeight: '600', lineHeight: 18,
  },

  returnItemsHeading: {
    color: COLORS.text, fontWeight: '800', fontSize: 12,
    marginBottom: 8, marginTop: 2,
  },

  returnDetailItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  returnDetailThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: '#F1F5F9', marginRight: 10,
  },
  returnDetailName: {
    color: COLORS.text, fontWeight: '800', fontSize: 13,
  },
  returnDetailQtyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 5,
  },
  returnDetailQtyLabel: {
    color: COLORS.muted, fontSize: 11, fontWeight: '700',
  },
  returnDetailAmount: {
    color: COLORS.warning, fontSize: 12, fontWeight: '900',
  },
  returnDetailBar: {
    marginTop: 6, height: 4,
    backgroundColor: '#F1E7DC',
    borderRadius: 999, overflow: 'hidden',
  },
  returnDetailBarFill: {
    height: '100%', backgroundColor: COLORS.warning, borderRadius: 999,
  },

  refundSummaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 10, padding: 10,
    marginTop: 10, gap: 6,
  },
  refundSummaryLabel: {
    color: COLORS.success, fontWeight: '700', fontSize: 12, flex: 1,
  },
  refundSummaryAmount: {
    color: COLORS.success, fontWeight: '900', fontSize: 13,
  },

  returnResolvedDate: {
    marginTop: 8, color: COLORS.muted, fontSize: 11, fontWeight: '600', textAlign: 'right',
  },

  // ── Shipment timeline ───────────────────────────────────────────────────

  shipmentTimelineWrap: { backgroundColor: '#FFFBF7', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3E7D9', overflow: 'hidden' },
  shipmentTimelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3E7D9' },
  timelineVertical:  { paddingVertical: 12, paddingHorizontal: 12 },
  timelineRowWrap:   { flexDirection: 'row', marginBottom: 12 },
  timelineLeftCol:   { width: 50, alignItems: 'center' },
  timelineLineBefore:{ width: 2, height: 10, marginBottom: 2 },
  timelineDotLarge:  { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timelineActiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  timelineInactiveDot:{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  timelineLineAfter: { width: 2, height: 10, marginTop: 2 },
  timelineRightCol: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  timelineStepLabel: { fontSize: 13 },
  timelineMoreHint: { paddingVertical: 8, alignItems: 'center' },
  timelineMoreText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  shipmentExpandedDetails: { borderTopWidth: 1, borderTopColor: '#F3E7D9', paddingTop: 12, paddingHorizontal: 12, paddingBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detailsBox: { flex: 1, minWidth: '48%', backgroundColor: COLORS.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  detailsLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  detailsValue: { marginTop: 5, color: COLORS.text, fontSize: 12, fontWeight: '800' },
  copyTrackBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  copyTrackText:{ color: '#fff', fontWeight: '900', fontSize: 13, marginLeft: 6 },
  vendorTitle:  { color: COLORS.text, fontWeight: '900', fontSize: 14 },
  trackingNo:   { marginTop: 4, color: COLORS.muted, fontSize: 12, fontWeight: '600' },

  // ── Payment ─────────────────────────────────────────────────────────────

  paymentRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  paymentLabel:      { color: COLORS.muted, fontWeight: '700' },
  paymentValue:      { color: COLORS.text, fontWeight: '800' },
  paymentDivider:    { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  paymentTotalLabel: { color: COLORS.text, fontWeight: '900' },
  paymentTotalValue: { color: COLORS.primary, fontWeight: '900' },

  fullDangerBtn: { backgroundColor: COLORS.dangerBg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullDangerText: { marginLeft: 7, color: '#C53030', fontWeight: '900' },
  fullWarningBtn: { backgroundColor: COLORS.warningBg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWarningText: { marginLeft: 7, color: COLORS.warning, fontWeight: '900' },

  // ── Modals ──────────────────────────────────────────────────────────────

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { backgroundColor: COLORS.card, padding: 18, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalTitle: { flex: 1, fontWeight: '900', fontSize: 18, color: COLORS.text },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, minHeight: 90, color: COLORS.text, backgroundColor: '#FFFBF7' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 11, marginRight: 8 },
  modalCancelText: { color: COLORS.muted, fontWeight: '800' },
  modalSend: { minWidth: 88, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: COLORS.primary },
  modalSendDisabled: { backgroundColor: '#CBD5E1' },
  modalSendText: { color: '#fff', fontWeight: '900' },

  // Return sheet
  returnSheetCard: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
  },
  returnItemList: { marginBottom: 4 },
  returnEmptyText: { color: COLORS.muted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  returnItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 2,
    backgroundColor: COLORS.card,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  returnThumb: { width: 52, height: 52, borderRadius: 10, marginRight: 10, backgroundColor: '#F1F5F9' },
  returnItemName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  returnItemMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontWeight: '600' },
  alreadyReturnedNote: {
    marginTop: 4, color: COLORS.warning, fontSize: 10, fontWeight: '700',
    fontStyle: 'italic',
  },

  qtyStepper: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 },
  qtyLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.soft, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { minWidth: 36, maxWidth: 52, height: 40, textAlign: 'center', fontWeight: '900', color: COLORS.text, fontSize: 13, paddingHorizontal: 4, borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  qtyMax: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },

  returnReasonLabel: { marginTop: 14, marginBottom: 6, color: COLORS.text, fontWeight: '800', fontSize: 13 },

  // Reason chips
  reasonChipsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
  },
  reasonChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonChipText: {
    color: COLORS.text, fontSize: 12, fontWeight: '700',
  },
  reasonChipTextSelected: {
    color: '#fff',
  },

  // Per-item reason in return detail
  returnDetailItemReason: {
    marginTop: 5, color: COLORS.muted, fontSize: 11,
    fontWeight: '600', fontStyle: 'italic', lineHeight: 16,
  },
  returnSummaryBadge: {
    marginTop: 12,
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnSummaryText: {
    marginLeft: 7,
    color: COLORS.warning,
    fontWeight: '800',
    fontSize: 12,
    flex: 1,
  },
  reviewTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  reviewTriggerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  reviewProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.soft,
    padding: 10,
    borderRadius: 12,
  },
  reviewThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  reviewProductName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },

  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  uploadTitle: {
    marginTop: 20,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  previewImg: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  removeImgBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addImgBtn: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});

export default OrderDetailScreen;