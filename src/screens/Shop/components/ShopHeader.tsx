import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Keyboard, StyleSheet, DeviceEventEmitter, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCartSummary } from '../../../services/cart';

const RECENT_KEY = 'shop_recent_searches';

const stylesHeader = StyleSheet.create({
  cartWrap: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  badgeWrap: { position: 'absolute', right: -2, top: -4, backgroundColor: '#F59E0B', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

const stylesAvatar = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});

// reference to avoid unused variable lint in this edit block
export default function ShopHeader({ onSearch }: { onSearch?: (q: string) => void }) {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState<string>('guest');

  useEffect(() => {
    loadRecent();
  }, []);

  // load current user id and initial cart summary, and subscribe to cart updates
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawId = await AsyncStorage.getItem('id');
        let uid: string | null = null;
        try { uid = rawId ? JSON.parse(rawId) : rawId; } catch { uid = rawId; }
        const activeUser = uid ?? 'guest';
        if (mounted) setUserId(activeUser);
        const s = await getCartSummary(activeUser);
        if (mounted) setCartCount(s.totalItems ?? 0);
      } catch { /* ignore */ }
    })();

    const sub = DeviceEventEmitter.addListener('cartUpdated', (evt: any) => {
      try {
        // only update badge for the current user
        if (!evt) return;
        const evtUser = evt.userId ?? 'guest';
        if (evtUser === userId) setCartCount(evt.totalItems ?? 0);
        // if we are running as guest and event is for guest, update too
        if (userId === 'guest' && evtUser === 'guest') setCartCount(evt.totalItems ?? 0);
      } catch { /* ignore */ }
    });

    return () => { mounted = false; sub.remove(); };
  }, [userId]);

  // refresh cart count when header/screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const rawId = await AsyncStorage.getItem(RECENT_KEY);
          let userIdLocal: string | null = null;
          try { userIdLocal = rawId ? JSON.parse(rawId) : null; } catch { userIdLocal = rawId; }
          const s = await getCartSummary(userIdLocal ?? 'guest');
          if (mounted) setCartCount(s.totalItems ?? 0);
        } catch { }
      })();
      return () => { mounted = false; };
    }, [])
  );

  async function loadRecent() {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setRecent(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn('loadRecent err', e);
    }
  }

  async function saveRecent(arr: string[]) {
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(arr));
      setRecent(arr);
    } catch (e) {
      console.warn('saveRecent err', e);
    }
  }

  function addToRecent(q: string) {
    if (!q || !q.trim()) return;
    const normalized = q.trim();
    const filtered = [normalized, ...recent.filter(r => r !== normalized)].slice(0, 10);
    saveRecent(filtered);
  }

  function removeRecentItem(item: string) {
    const filtered = recent.filter(r => r !== item);
    saveRecent(filtered);
  }

  function clearAllRecent() {
    saveRecent([]);
  }

  function clearInput() {
    setQuery('');
    // if cleared while focused, also refresh to new products (handled by parent onSearch when empty)
    onSearch?.('');
    inputRef.current?.focus();
  }

  function handleSubmit() {
    if (!query || !query.trim()) return;
    const q = query.trim();
    addToRecent(q);
    onSearch?.(q);
    Keyboard.dismiss();
    setFocused(false);
  }

  function handleSelectRecent(item: string) {
    setQuery(item);
    onSearch?.(item);
    addToRecent(item);
    setFocused(false);
    Keyboard.dismiss();
  }

  return (
    <View className="px-4 pt-6 pb-3 bg-amber-50">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold color-foreground">Cửa hàng</Text>
        <View className="flex-row items-center gap-3">
          <Pressable className="p-2">
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </Pressable>

          {/* Profile button with avatar image: navigate to TraineeProfile */}
          <Pressable className="w-10 h-10 rounded-full overflow-hidden p-0" onPress={() => (navigation as any).navigate('TraineeProfile')}>
            <Image
              source={{ uri: 'https://www.toponseek.com/wp-content/uploads/2024/07/celeb-la-gi-6.jpg' }}
              style={stylesAvatar.img}
              resizeMode="cover"
            />
          </Pressable>

          <Pressable className="p-2" onPress={() => (navigation as any).navigate('Cart')}>
            <View style={stylesHeader.cartWrap}>
              <Ionicons name="cart-outline" size={22} color={colors.foreground} />
              {cartCount > 0 && (
                <View style={stylesHeader.badgeWrap}>
                  <Text style={stylesHeader.badgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      <View className="mt-3">
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-background-sub2">
          <Ionicons name="search-outline" size={18} color={colors.secondaryText} />
          <TextInput
            ref={inputRef}
            placeholder="Tìm kiếm sản phẩm"
            className="ml-2 flex-1 text-sm"
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              // attempt to navigate to root Search screen; fall back to local focus
              const parentNav: any = (navigation as any).getParent && (navigation as any).getParent();
              if (parentNav && typeof parentNav.navigate === 'function') {
                parentNav.navigate('Search');
                return;
              }
              try { (navigation as any).navigate('Search'); } catch { setFocused(true); }
            }}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />

          {query ? (
            <Pressable onPress={clearInput} className="p-2">
              <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
            </Pressable>
          ) : (
            <Pressable onPress={() => {
              const parentNav: any = (navigation as any).getParent && (navigation as any).getParent();
              if (parentNav && typeof parentNav.navigate === 'function') {
                parentNav.navigate('Search');
                return;
              }
              (navigation as any).navigate('Search');
            }} className="p-2">
              <Ionicons name="search" size={18} color={'#E07A4D'} />
            </Pressable>
          )}
        </View>

        {/* Recent searches dropdown */}
        {focused && (
          <View className="mt-3 bg-white rounded-xl overflow-hidden border border-background-sub2">
            {recent.length > 0 ? (
              <View className="flex-row items-center justify-between px-3 py-2 border-b border-background-sub2">
                <Text className="font-medium">Tìm gần đây</Text>
                <Pressable onPress={clearAllRecent} className="px-2 py-1">
                  <Text className="text-sm text-secondaryText">Xóa tất cả</Text>
                </Pressable>
              </View>
            ) : null}

            {recent.length > 0 ? (
              <FlatList
                data={recent}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between px-3 py-3">
                    <Pressable onPress={() => handleSelectRecent(item)} className="flex-row items-center">
                      <Ionicons name="time-outline" size={18} color={colors.warning.DEFAULT} />
                      <Text className="ml-3">{item}</Text>
                    </Pressable>

                    <Pressable onPress={() => removeRecentItem(item)} className="p-2">
                      <Ionicons name="close" size={18} color={colors.secondaryText} />
                    </Pressable>
                  </View>
                )}
              />
            ) : (
              <View className="p-4">
                <Text className="text-sm text-secondaryText">Không có tìm gần đây</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
