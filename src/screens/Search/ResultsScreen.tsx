import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, Modal, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getProducts, ProductItem, PagedResult } from '../../services/products';
import { formatVND } from '../../utils/number';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/Toast';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.round((width - 48) / 2);
const IMAGE_H = 132;

// Simple, modern search results screen with filter bar and sort dropdown
export default function ResultsScreen() {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const q = route.params?.q ?? '';

  const [query] = useState(q);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const presets = [
    { id: 'p1', label: 'Dưới 100k', min: 0, max: 100000 },
    { id: 'p2', label: '100k - 200k', min: 100000, max: 200000 },
    { id: 'p3', label: '200k - 500k', min: 200000, max: 500000 },
    { id: 'p4', label: 'Trên 500k', min: 500000, max: null },
  ];

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('success');

  const [appliedFilter, setAppliedFilter] = useState<{ minPrice?: number; maxPrice?: number } | undefined>(undefined);

  const { addToCart } = useCart();

  const load = useCallback(async (p = 0) => {
    if (p > 0) setLoadingMore(true);
    try {
      const filters = appliedFilter ? { minPrice: appliedFilter.minPrice, maxPrice: appliedFilter.maxPrice } : undefined;
      const r: PagedResult<ProductItem> = await getProducts(p, 12, query || undefined, filters as any, 'price', sortDir);
      if (p === 0) setItems(r.items || []);
      else setItems(prev => [...prev, ...(r.items || [])]);
      setTotal(r.total || 0);
      setPage(r.page ?? p);
    } catch (e) {
      console.warn('load results err', e);
    } finally {
      setLoadingMore(false);
    }
  }, [query, sortDir, appliedFilter]);

  useEffect(() => { load(0); }, [load]);

  const applyPreset = (p: { min: number; max: number | null }) => {
    setAppliedFilter({ minPrice: p.min, maxPrice: p.max ?? undefined });
    setFilterOpen(false);
  };

  const applyCustomFilter = () => {
    const min = Number(minPrice) || undefined;
    const max = Number(maxPrice) || undefined;
    setAppliedFilter({ minPrice: min, maxPrice: max });
    setFilterOpen(false);
  };

  const onAdd = async (item: ProductItem) => {
    try {
      await addToCart({ product_id: item.product_id, product_name: item.product_name, thumnail_url: item.thumnail_url, price: item.price }, 1);
      setToastMsg('Đã thêm vào giỏ hàng'); setToastType('success'); setToastVisible(true);
    } catch (e) {
      console.warn('add to cart failed', e);
      setToastMsg('Không thể thêm vào giỏ'); setToastType('error'); setToastVisible(true);
    }
  };

  const renderCard = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })} style={[styles.card, { width: CARD_WIDTH }]}>
      <View style={styles.innerCard}>
        <Image source={{ uri: item.thumnail_url }} style={styles.thumb} />
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>{item.product_name}</Text>
          <Text style={styles.price}>{formatVND(item.price)}</Text>
          <View style={styles.rowBottom}>
            <View style={styles.ratingWrap}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{(item.raw?.avgRating ?? 0).toFixed(1)}</Text>
            </View>
            <TouchableOpacity onPress={() => onAdd(item)} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><Ionicons name="chevron-back" size={22} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả tìm kiếm</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.controlsRow}>
          <Text style={styles.resultText}>Kết quả cho "{query}"</Text>

          <View style={styles.controlsRight}>
            <TouchableOpacity onPress={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')} style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>{sortDir === 'desc' ? 'Giá: Cao→Thấp' : 'Giá: Thấp→Cao'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterOpen(true)} style={styles.filterBtn}>
              <Ionicons name="filter" size={18} color="#111" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={i => i.product_id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={() => { if (items.length < total) load(page + 1); }}
          onEndReachedThreshold={0.6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <Modal visible={filterOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}><Ionicons name="close" size={20} /></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Mức giá</Text>
            <View style={styles.presetRow}>
              {presets.map(p => (
                <TouchableOpacity key={p.id} onPress={() => applyPreset(p as any)} style={styles.presetBtn}>
                  <Text style={styles.presetText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Tùy chỉnh</Text>
            <View style={styles.customRow}>
              <TextInput placeholder="Giá từ" keyboardType="number-pad" value={minPrice} onChangeText={setMinPrice} style={styles.input} />
              <TextInput placeholder="Giá đến" keyboardType="number-pad" value={maxPrice} onChangeText={setMaxPrice} style={styles.input} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); setAppliedFilter(undefined); setFilterOpen(false); }} style={styles.clearBtn}><Text>Xóa</Text></TouchableOpacity>
              <TouchableOpacity onPress={applyCustomFilter} style={styles.applyBtn}><Text style={{ color: '#fff' }}>Áp dụng</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#D97706' },
  content: { paddingHorizontal: 16, flex: 1 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultText: { color: '#6B7280' },
  controlsRight: { flexDirection: 'row', alignItems: 'center' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  sortBtnText: { color: '#111' },
  filterBtn: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  listContent: { paddingBottom: 140 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  card: { marginRight: 8 },
  innerCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', width: '100%', elevation: 2 },
  thumb: { width: '100%', height: IMAGE_H },
  cardBody: { padding: 12 },
  title: { fontSize: 13, fontWeight: '600', color: '#111' },
  price: { marginTop: 8, color: '#D97706', fontWeight: '800' },
  rowBottom: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 6, fontSize: 12, color: '#6B7280' },
  addBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { marginTop: 8, marginBottom: 8, fontWeight: '600' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap' },
  presetBtn: { backgroundColor: '#FFF8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#FDE68A' },
  presetText: { color: '#A16207' },
  customRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8, marginRight: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  clearBtn: { padding: 12 },
  applyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
});
