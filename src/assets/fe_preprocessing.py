
# ============================================================
# FRONTEND PREPROCESSING — Dán vào code FE để dùng model
# ============================================================
# Input từ MediaPipe: raw_kps (list 132 phần tử: x,y,z,vis * 33 điểm)
# Output: feature vector 144 chiều để đưa vào model

import numpy as np, pickle

LEFT_SHOULDER=11; RIGHT_SHOULDER=12; LEFT_ELBOW=13; RIGHT_ELBOW=14
LEFT_WRIST=15; RIGHT_WRIST=16; LEFT_HIP=23; RIGHT_HIP=24
LEFT_KNEE=25; RIGHT_KNEE=26; LEFT_ANKLE=27; RIGHT_ANKLE=28
LEFT_EAR=7; RIGHT_EAR=8; NOSE=0

def get_xyz(kps, idx):
    return np.array([kps[idx*4], kps[idx*4+1], kps[idx*4+2]])

def calc_angle(a, b, c):
    ba = a - b; bc = c - b
    cos_a = np.dot(ba, bc) / (np.linalg.norm(ba)*np.linalg.norm(bc)+1e-8)
    return np.degrees(np.arccos(np.clip(cos_a, -1, 1)))

def preprocess_for_inference(raw_kps, scaler):
    # 1. Normalize
    kps = np.array(raw_kps)
    hip_c = (get_xyz(kps, LEFT_HIP) + get_xyz(kps, RIGHT_HIP)) / 2
    sh_c  = (get_xyz(kps, LEFT_SHOULDER) + get_xyz(kps, RIGHT_SHOULDER)) / 2
    scale = np.linalg.norm(sh_c - hip_c) + 1e-8
    norm = []
    for i in range(33):
        xyz = (get_xyz(kps, i) - hip_c) / scale
        norm.extend([xyz[0], xyz[1], xyz[2], kps[i*4+3]])
    # 2. Angles
    angles = [
        calc_angle(get_xyz(kps,LEFT_SHOULDER),get_xyz(kps,LEFT_HIP),get_xyz(kps,LEFT_ANKLE)),
        calc_angle(get_xyz(kps,RIGHT_SHOULDER),get_xyz(kps,RIGHT_HIP),get_xyz(kps,RIGHT_ANKLE)),
        calc_angle(get_xyz(kps,LEFT_SHOULDER),get_xyz(kps,LEFT_ELBOW),get_xyz(kps,LEFT_WRIST)),
        calc_angle(get_xyz(kps,RIGHT_SHOULDER),get_xyz(kps,RIGHT_ELBOW),get_xyz(kps,RIGHT_WRIST)),
        calc_angle(get_xyz(kps,LEFT_HIP),get_xyz(kps,LEFT_SHOULDER),get_xyz(kps,LEFT_ELBOW)),
        calc_angle(get_xyz(kps,RIGHT_HIP),get_xyz(kps,RIGHT_SHOULDER),get_xyz(kps,RIGHT_ELBOW)),
        calc_angle(get_xyz(kps,LEFT_EAR),get_xyz(kps,LEFT_SHOULDER),get_xyz(kps,LEFT_HIP)),
        calc_angle(get_xyz(kps,RIGHT_EAR),get_xyz(kps,RIGHT_SHOULDER),get_xyz(kps,RIGHT_HIP)),
        calc_angle(get_xyz(kps,LEFT_HIP),get_xyz(kps,LEFT_KNEE),get_xyz(kps,LEFT_ANKLE)),
        calc_angle(get_xyz(kps,RIGHT_HIP),get_xyz(kps,RIGHT_KNEE),get_xyz(kps,RIGHT_ANKLE)),
        abs(get_xyz(kps,LEFT_HIP)[1]-get_xyz(kps,RIGHT_HIP)[1])*100,
        abs(get_xyz(kps,LEFT_SHOULDER)[1]-get_xyz(kps,RIGHT_SHOULDER)[1])*100,
    ]
    full = norm + angles  # 144 chiều
    return scaler.transform([full])[0]  # StandardScaler

# Dùng:
# scaler = pickle.load(open("feature_scaler.pkl","rb"))
# feat = preprocess_for_inference(raw_kps, scaler)
# X_ex = np.zeros((1, 8)); X_ex[0, 0] = 1.0
# pred = model.predict([feat[None,:], X_ex])
