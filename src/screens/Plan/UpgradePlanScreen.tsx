import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getActivePackages,
  subscribeToPackage,
  getMySubscriptions,
  upgradeSubscription,
  getUpgradeablePackages,
} from '../../hooks/apiClient';
import { fetchMyWallet } from '../../services/wallet';
import ModalPopup from '../../components/ModalPopup';
import Ionicons from '@react-native-vector-icons/ionicons';
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.round(width * 0.78);
const SPACING = 16;

type ActionType = 'ACTIVE' | 'UPGRADED' | 'EXPIRED' | 'UPGRADE' | 'SUBSCRIBE';

const Card: React.FC<{
  plan: any;
  actionType: ActionType;
  onPrimary: () => void;
  buyLoading?: boolean;
  upgradeInfo?: any;
}> = ({ plan, actionType, onPrimary, buyLoading = false, upgradeInfo }) => {
  const raw = plan.raw ?? {};
  const priceNum =
    typeof raw.price === 'number'
      ? raw.price
      : parseFloat(plan.price as any) || 0;

  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat('vi-VN').format(v) + 'đ';
    } catch {
      return v.toString();
    }
  };

  const duration = raw.durationInDays ?? null;
  const pkgType = raw.packageType ?? null;

  return (
    <View style={styles.cardFull}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{plan.title}</Text>

          <View style={styles.metaRow}>
            {pkgType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{pkgType}</Text>
              </View>
            )}

            {duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{duration} ngày</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.priceLarge}>{formatCurrency(priceNum)}</Text>

          {upgradeInfo?.finalPrice ? (
            <View style={styles.upgradePriceWrapper}>
              <Text style={[styles.priceLarge, styles.upgradeFinalPriceSmall]}>
                {formatCurrency(Number(upgradeInfo.finalPrice))}
              </Text>
              <Text style={styles.pricePeriod}>/ tháng</Text>
              <Text style={styles.upgradeProrationText}>
                Giảm: {formatCurrency(Number(upgradeInfo.prorationCredit ?? 0))}
              </Text>
            </View>
          ) : (
            <Text style={styles.pricePeriod}>/ tháng</Text>
          )}
        </View>
      </View>

      <Text style={styles.cardDesc}>{plan.desc}</Text>

      <View style={styles.bullets}>
        {(plan.bullets ?? []).map((b: string, i: number) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardActions} />

      {actionType === 'ACTIVE' ? (
        <TouchableOpacity style={[styles.buyNowButton, styles.activeButton]} disabled>
          <Text style={styles.buyNowText}>Đang sử dụng</Text>
        </TouchableOpacity>
      ) : actionType === 'UPGRADED' ? (
        <TouchableOpacity style={[styles.buyNowButton, styles.ownedButton]} disabled>
          <Text style={styles.buyNowText}>Không khả dụng</Text>
        </TouchableOpacity>
      ) : actionType === 'EXPIRED' ? (
        <TouchableOpacity style={[styles.buyNowButton, styles.expiredButton]} disabled>
          <Text style={styles.buyNowText}>Hết hạn</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.buyNowButton, buyLoading && styles.buttonDisabled]}
          onPress={onPrimary}
          disabled={buyLoading}
        >
          {buyLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyNowText}>
              {actionType === 'UPGRADE' ? '🔼 Nâng cấp ngay' : '🔥 Mua ngay'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const UpgradePlanScreen: React.FC = () => {
  const navigation: any = useNavigation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [buyLoading, setBuyLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any | null>(null);
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [upgradeablePackages, setUpgradeablePackages] = useState<any[]>([]);

  const [modalProps, setModalProps] = useState<any>({ visible: false });

  const closeModal = () => {
    setModalProps({ visible: false });
  };

  const showModal = (p: any) => {
    setModalProps({
      ...p,
      visible: true,
      onClose: p?.onClose ?? closeModal,
      onCancel: p?.onCancel ?? closeModal,
      onConfirm:
        p?.onConfirm ??
        (() => {
          closeModal();
        }),
    });
  };

  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat('vi-VN').format(v) + 'đ';
    } catch {
      return String(v);
    }
  };

  const getPackageIdFromPlan = (plan: any) => {
    return (
      plan?.id ??
      plan?.raw?.packageId ??
      plan?.packageId ??
      plan?.raw?.id ??
      null
    );
  };

  const getPackageIdFromSubscription = (sub: any) => {
    if (!sub) return null;

    const pkg =
      sub?.subscribedPackage ??
      sub?.package ??
      sub?.packageInfo ??
      sub?.subscriptionPackage ??
      sub?.packageData ??
      sub;

    return (
      pkg?.packageId ??
      pkg?.id ??
      sub?.packageId ??
      sub?.subscribedPackageId ??
      sub?.packageInfo?.packageId ??
      sub?.subscribedPackage?.packageId ??
      sub?.subscribedPackage?.id ??
      null
    );
  };

  const getSubscriptionStatusByPackageId = (packageId: any) => {
    if (!packageId) return null;

    const matched = (mySubscriptions || [])
      .filter((sub: any) => {
        const subPkgId = getPackageIdFromSubscription(sub);

        return subPkgId && String(subPkgId) === String(packageId);
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(
          a?.updatedAt ?? a?.createdAt ?? a?.startDate ?? 0,
        ).getTime();

        const bTime = new Date(
          b?.updatedAt ?? b?.createdAt ?? b?.startDate ?? 0,
        ).getTime();

        return bTime - aTime;
      })[0];

    const status = String(matched?.status ?? '').toUpperCase();

    if (status === 'ACTIVE') return 'ACTIVE';
    if (status === 'UPGRADED') return 'UPGRADED';
    if (status === 'EXPIRED') return 'EXPIRED';

    return null;
  };

  const findActiveSubscription = (subs: any[]) => {
    const list = Array.isArray(subs) ? subs : [];

    const activeList = list
      .filter((s: any) => {
        const status = String(s?.status ?? '').toUpperCase();
        return status === 'ACTIVE';
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(a?.updatedAt ?? a?.createdAt ?? a?.startDate ?? 0).getTime();
        const bTime = new Date(b?.updatedAt ?? b?.createdAt ?? b?.startDate ?? 0).getTime();

        return bTime - aTime;
      });

    const active = activeList[0] ?? null;

    console.log('[UpgradePlan] active subscription found:', active);
    console.log('[UpgradePlan] active subscription package id:', getPackageIdFromSubscription(active));

    return active;
  };

  const dedupePlans = (list: any[]) => {
    const seen = new Set<string>();
    const deduped: any[] = [];

    for (const p of list ?? []) {
      const itemPkgId = getPackageIdFromPlan(p);
      const key = String(itemPkgId ?? p?.id ?? '');

      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      }
    }

    return deduped;
  };

  const refreshSubscriptionAndPlans = async () => {
    let active: any = null;

    try {
      const subs = await getMySubscriptions();

      console.log('[UpgradePlan] getMySubscriptions response:', subs);

      setMySubscriptions(subs || []);

      active = findActiveSubscription(subs || []);

      console.log('[UpgradePlan] active after refresh:', active);

      setActiveSubscription(active);
    } catch (err) {
      console.warn('[UpgradePlan] refresh subscriptions failed', err);
      setMySubscriptions([]);
      setActiveSubscription(null);
    }

    try {
      const mapped = await getActivePackages();

      console.log('[UpgradePlan] getActivePackages response:', mapped);

      const deduped = dedupePlans(mapped ?? []);

      setPlans(deduped);
    } catch (err) {
      console.warn('[UpgradePlan] refresh packages failed', err);
    }

    try {
      if (active) {
        const up = await getUpgradeablePackages();

        console.log('[UpgradePlan] getUpgradeablePackages response:', up);

        setUpgradeablePackages(up ?? []);
      } else {
        setUpgradeablePackages([]);
      }
    } catch (err) {
      console.warn('[UpgradePlan] refresh upgradeable packages failed', err);
      setUpgradeablePackages([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        let active: any = null;

        try {
          const subs = await getMySubscriptions();

          console.log('[UpgradePlan] initial getMySubscriptions response:', subs);

          if (mounted) {
            setMySubscriptions(subs || []);
          }

          active = findActiveSubscription(subs || []);

          console.log('[UpgradePlan] initial activeSubscription:', active);
          console.log(
            '[UpgradePlan] initial active package id:',
            getPackageIdFromSubscription(active),
          );

          if (mounted) {
            setActiveSubscription(active);
          }
        } catch (err) {
          console.warn('[UpgradePlan] getMySubscriptions failed', err);

          if (mounted) {
            setMySubscriptions([]);
            setActiveSubscription(null);
          }
        }

        try {
          const mapped = await getActivePackages();

          console.log('[UpgradePlan] initial getActivePackages response:', mapped);

          const deduped = dedupePlans(mapped ?? []);

          if (mounted) {
            setPlans(deduped);
          }
        } catch (err) {
          console.warn('[UpgradePlan] Fetch active packages failed', err);
        }

        try {
          if (active) {
            const up = await getUpgradeablePackages();

            console.log('[UpgradePlan] initial getUpgradeablePackages response:', up);

            if (mounted) {
              setUpgradeablePackages(up ?? []);
            }
          } else if (mounted) {
            setUpgradeablePackages([]);
          }
        } catch (err) {
          console.warn('[UpgradePlan] getUpgradeablePackages failed', err);

          if (mounted) {
            setUpgradeablePackages([]);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const translateServerMessage = (msg?: string | null) => {
    if (!msg) return null;

    const m = String(msg || '').toLowerCase();

    const map: Record<string, string> = {
      'subscription created successfully': 'Đăng ký gói thành công',
      'subscription created': 'Đăng ký gói thành công',
      'subscription upgraded': 'Nâng cấp gói thành công',
      'upgrade successful': 'Nâng cấp gói thành công',
      'insufficient balance': 'Số dư không đủ',
      'insufficient funds': 'Số dư không đủ',
      'already subscribed': 'Bạn đã có gói đang hoạt động',
    };

    for (const k of Object.keys(map)) {
      if (m.includes(k)) return map[k];
    }

    return msg;
  };

  const extractSubscriptionFromResponse = (res: any) => {
    const subscription =
      res?.data?.subscription ??
      res?.data?.data?.subscription ??
      res?.data ??
      res?.subscription ??
      res?.data?.data ??
      null;

    console.log('[UpgradePlan] extracted subscription from purchase response:', subscription);
    console.log(
      '[UpgradePlan] extracted subscription package id:',
      getPackageIdFromSubscription(subscription),
    );

    return subscription;
  };

  const handleBuyFlow = async (packageId: string, action: 'subscribe' | 'upgrade') => {
    if (buyLoading) return;

    setBuyLoading(true);

    try {
      showModal({
        mode: 'noti',
        titleText: 'Đang kiểm tra số dư',
        contentText: 'Vui lòng chờ...',
      });

      const w = await fetchMyWallet();

      console.log('[UpgradePlan] wallet response:', w);

      let balance = 0;

      if (w?.ok) {
        balance = Number(w.data?.balanceVND ?? w.data?.balance ?? 0);
      } else {
        balance = Number((w as any)?.balance ?? 0);
      }

      const plan = plans.find(p => String(p.id) === String(packageId)) ?? null;
      const price = Number(plan?.raw?.price ?? plan?.price ?? 0);
      const newBalance = balance - price;

      console.log('[UpgradePlan] payment check:', {
        packageId,
        action,
        balance,
        price,
        newBalance,
      });

      if (newBalance < 0) {
        showModal({
          mode: 'confirm',
          titleText: 'Số dư không đủ',
          contentText:
            `Bạn cần ${formatCurrency(price)} để mua gói này.\n` +
            `Số dư hiện tại: ${formatCurrency(balance)}\n` +
            `Bạn còn thiếu: ${formatCurrency(Math.abs(newBalance))}\n\n` +
            `Bạn có muốn nạp thêm tiền không?`,

          onConfirm: () => {
            closeModal();
            setBuyLoading(false);
            navigation.navigate('Wallet' as never);
          },

          onCancel: () => {
            closeModal();
            setBuyLoading(false);
          },

          onClose: () => {
            closeModal();
            setBuyLoading(false);
          },
        });

        return;
      }

      showModal({
        mode: 'confirm',
        titleText: action === 'upgrade' ? 'Xác nhận nâng cấp gói' : 'Xác nhận mua gói',
        contentText:
          `Giá: ${formatCurrency(price)}\n` +
          `Số dư hiện tại: ${formatCurrency(balance)}\n` +
          `Số dư sau khi trừ: ${formatCurrency(newBalance)}`,

        onCancel: () => {
          closeModal();
          setBuyLoading(false);
        },

        onClose: () => {
          closeModal();
          setBuyLoading(false);
        },

        onConfirm: async () => {
          closeModal();
          setBuyLoading(true);

          try {
            const res =
              action === 'subscribe'
                ? await subscribeToPackage(packageId)
                : await upgradeSubscription(packageId);

            console.log('[UpgradePlan] purchase response:', res);

            const subscription = extractSubscriptionFromResponse(res);

            if (subscription) {
              setActiveSubscription(
                String(subscription?.status ?? '').toUpperCase() === 'ACTIVE'
                  ? subscription
                  : activeSubscription,
              );
            }

            await refreshSubscriptionAndPlans();

            showModal({
              mode: 'noti',
              titleText: 'Thành công',
              contentText:
                translateServerMessage(res?.message) ??
                (action === 'subscribe'
                  ? 'Đăng ký gói thành công'
                  : 'Nâng cấp gói thành công'),

              onClose: () => {
                closeModal();
                setBuyLoading(false);
              },

              onConfirm: () => {
                closeModal();
                setBuyLoading(false);
              },
            });
          } catch (err: any) {
            const serverMsg = err?.response?.data?.message ?? err?.message ?? null;

            console.warn('[UpgradePlan] purchase failed', err);

            if (serverMsg && /insufficient balance|insufficient funds/i.test(serverMsg)) {
              showModal({
                mode: 'confirm',
                titleText: 'Số dư không đủ',
                contentText: translateServerMessage(serverMsg) ?? serverMsg,

                onConfirm: () => {
                  closeModal();
                  setBuyLoading(false);
                  navigation.navigate('Wallet' as never);
                },

                onCancel: () => {
                  closeModal();
                  setBuyLoading(false);
                },

                onClose: () => {
                  closeModal();
                  setBuyLoading(false);
                },
              });

              return;
            }

            showModal({
              mode: 'noti',
              titleText: 'Lỗi',
              contentText: serverMsg
                ? translateServerMessage(serverMsg) ?? 'Thao tác thất bại'
                : 'Thao tác thất bại',

              onClose: () => {
                closeModal();
                setBuyLoading(false);
              },

              onConfirm: () => {
                closeModal();
                setBuyLoading(false);
              },
            });
          } finally {
            setBuyLoading(false);
          }
        },
      });
    } catch (err) {
      console.warn('[UpgradePlan] check wallet failed', err);

      showModal({
        mode: 'noti',
        titleText: 'Lỗi',
        contentText: 'Không thể kiểm tra số dư',

        onClose: () => {
          closeModal();
          setBuyLoading(false);
        },

        onConfirm: () => {
          closeModal();
          setBuyLoading(false);
        },
      });
    }
  };

  const closeDetail = () => {
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSelectedId(null));
  };

  const selectedPlan = plans.find(p => p.id === selectedId);

  const detailTranslate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const backdropOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#FEF6ED]">
      <View style={styles.header}>
        <TouchableOpacity
  onPress={() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Profile' as never);
    }
  }}
  style={styles.backButton}
  activeOpacity={0.7}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
>
  <Ionicons name="arrow-back" size={24} color="#A0522D" />
</TouchableOpacity>

        <Text className="text-lg font-semibold text-[#A0522D]">
          Gói nâng cấp AI
        </Text>
      </View>

      <Text className="text-center mt-2 text-base font-semibold text-[#111]">
        Lựa chọn gói AI phù hợp với bản thân
      </Text>

      <View style={styles.carouselHolder}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải gói...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={plans}
            keyExtractor={item => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_WIDTH) / 2,
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
            )}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + SPACING),
                index * (CARD_WIDTH + SPACING),
                (index + 1) * (CARD_WIDTH + SPACING),
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.92, 1, 0.92],
                extrapolate: 'clamp',
              });

              const translateY = scrollX.interpolate({
                inputRange,
                outputRange: [14, 0, 14],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.6, 1, 0.6],
                extrapolate: 'clamp',
              });

              const itemPkgId = getPackageIdFromPlan(item);
              const subscriptionStatus = getSubscriptionStatusByPackageId(itemPkgId);

              const canUpgrade = upgradeablePackages.some((u: any) => {
                const upPkgId =
                  u?.packageInfo?.packageId ??
                  u?.packageId ??
                  u?.id ??
                  null;

                return itemPkgId && upPkgId && String(upPkgId) === String(itemPkgId);
              });

              const actionType: ActionType =
                subscriptionStatus === 'ACTIVE'
                  ? 'ACTIVE'
                  : subscriptionStatus === 'UPGRADED'
                    ? 'UPGRADED'
                    : subscriptionStatus === 'EXPIRED'
                      ? 'EXPIRED'
                      : canUpgrade
                        ? 'UPGRADE'
                        : 'SUBSCRIBE';

              const upgradeInfo =
                upgradeablePackages.find((u: any) => {
                  const upPkgId =
                    u?.packageInfo?.packageId ??
                    u?.packageId ??
                    u?.id ??
                    null;

                  return itemPkgId && upPkgId && String(upPkgId) === String(itemPkgId);
                }) ?? null;

              console.log('[UpgradePlan] render plan status:', {
                title: item?.title,
                itemPkgId,
                subscriptionStatus,
                actionType,
              });

              return (
                <Animated.View
                  style={{
                    width: CARD_WIDTH,
                    marginRight: SPACING,
                    transform: [{ scale }, { translateY }],
                    opacity,
                  }}
                >
                  <Card
                    plan={item}
                    actionType={actionType}
                    onPrimary={() => {
                      if (
                        actionType === 'ACTIVE' ||
                        actionType === 'UPGRADED' ||
                        actionType === 'EXPIRED'
                      ) {
                        return;
                      }

                      if (actionType === 'UPGRADE') {
                        return handleBuyFlow(item.id, 'upgrade');
                      }

                      return handleBuyFlow(item.id, 'subscribe');
                    }}
                    buyLoading={buyLoading}
                    upgradeInfo={upgradeInfo}
                  />
                </Animated.View>
              );
            }}
          />
        )}
      </View>

      {selectedId && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={selectedId ? 'auto' : 'none'}
        />
      )}

      {selectedId && (
        <Animated.View
          style={[
            styles.detailSheet,
            {
              transform: [{ translateY: detailTranslate }],
            },
          ]}
        >
          <View style={styles.detailHandle} />

          <Text style={styles.detailTitle}>{selectedPlan?.title}</Text>
          <Text style={styles.detailPrice}>{selectedPlan?.price} vnd / tháng</Text>
          <Text style={styles.detailDesc}>{selectedPlan?.desc}</Text>

          {selectedPlan &&
            (() => {
              const itemPkgId = getPackageIdFromPlan(selectedPlan);

              const selUp = upgradeablePackages.find((u: any) => {
                const upPkgId =
                  u?.packageInfo?.packageId ??
                  u?.packageId ??
                  u?.id ??
                  null;

                return itemPkgId && upPkgId && String(upPkgId) === String(itemPkgId);
              });

              if (selUp) {
                return (
                  <View style={styles.upgradeDetailBox}>
                    <Text style={styles.upgradeDetailTitle}>
                      Giá sau khi áp dụng giảm/hoàn tiền:
                    </Text>
                    <Text style={styles.upgradeDetailFinalPrice}>
                      {formatCurrency(Number(selUp.finalPrice))}
                    </Text>
                    <Text style={styles.upgradeDetailProration}>
                      Miễn giảm do proration:{' '}
                      {formatCurrency(Number(selUp.prorationCredit ?? 0))}
                    </Text>
                  </View>
                );
              }

              return null;
            })()}

          <TouchableOpacity
            style={[styles.payButton, buyLoading && styles.buttonDisabled]}
            onPress={() => selectedPlan && handleBuyFlow(selectedPlan.id, 'subscribe')}
            disabled={buyLoading}
          >
            {buyLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Thanh toán</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={closeDetail}>
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ModalPopup {...(modalProps as any)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0522D',
  },
  hint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },

  listHolder: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },

  cardFull: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  typeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  typeBadgeText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
  durationBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 12,
  },

  priceBlock: {
    alignItems: 'flex-end',
  },
  priceLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A0522D',
  },
  pricePeriod: {
    fontSize: 12,
    color: '#A0522D',
  },

  cardDesc: {
    marginTop: 8,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  payButton: {
    backgroundColor: '#A0522D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  payButtonSmall: {
    backgroundColor: '#A0522D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonTextSmall: {
    color: '#fff',
    fontWeight: '700',
  },
  learnButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  learnButtonText: {
    color: '#A0522D',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  activeButton: {
    backgroundColor: '#10B981',
    opacity: 1,
  },
  ownedButton: {
    backgroundColor: '#6B7280',
    opacity: 1,
  },
  expiredButton: {
    backgroundColor: '#9CA3AF',
    opacity: 1,
  },

  bullets: {
    marginTop: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  bulletText: {
    color: '#333',
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  detailSheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    maxHeight: height * 0.75,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  detailHandle: {
    width: 40,
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailPrice: {
    marginTop: 6,
    fontSize: 20,
    color: '#A0522D',
    fontWeight: '700',
  },
  detailDesc: {
    marginTop: 8,
    color: '#666',
  },
  detailList: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
    marginRight: 10,
  },
  detailText: {
    color: '#333',
  },

  skipButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    color: '#A0522D',
    fontWeight: '700',
  },

  buyNowButton: {
    marginTop: 12,
    backgroundColor: '#A0522D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#A0522D',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  buyNowText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  carouselHolder: {
    flex: 1,
    marginTop: 12,
  },
  upgradePriceWrapper: {
    alignItems: 'flex-end',
  },
  upgradeFinalPriceSmall: {
    fontSize: 14,
  },
  upgradeProrationText: {
    fontSize: 12,
    color: '#059669',
  },
  upgradeDetailBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEFBF8',
    borderRadius: 8,
  },
  upgradeDetailTitle: {
    color: '#059669',
    fontWeight: '700',
  },
  upgradeDetailFinalPrice: {
    marginTop: 6,
    fontSize: 18,
    color: '#A0522D',
    fontWeight: '800',
  },
  upgradeDetailProration: {
    fontSize: 12,
    color: '#6B7280',
  },
  backButton: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
});

export default UpgradePlanScreen;