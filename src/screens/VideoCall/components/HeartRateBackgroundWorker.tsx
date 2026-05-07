import React from "react";
import { View } from "react-native";
import { useBle } from "../../../services/BleProvider";

// 1. Tạo component chuyên trách gửi data, không hiển thị gì
const HeartRateBackgroundWorker = React.memo(({ liveId, hrIsConnected, sendHeartRate }: any) => {
  const { hr, isIotDeviceConnected } = useBle();
  const bleThrottleRef = React.useRef({ last: 0 });

  React.useEffect(() => {
    if (!hr || !isIotDeviceConnected || !hrIsConnected || !liveId) return;

    const now = Date.now();
    if (now - bleThrottleRef.current.last < 1000) return; // 1s throttle

    sendHeartRate({ liveSessionId: liveId, heartRate: hr });
    bleThrottleRef.current.last = now;
    console.log('📡 [Worker] Đang gửi HR ngầm:', hr);
  }, [hr, isIotDeviceConnected, hrIsConnected, liveId]);

  return null; // Component này không vẽ gì lên màn hình
});

export default HeartRateBackgroundWorker;

//
