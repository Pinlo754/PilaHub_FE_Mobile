```markdown
# 🧘 Pose Correction Model - Quick Start Guide

## 📦 What's This?

AI model that checks if your Pilates exercise form is correct and tells you which body part needs adjustment.

**Input:** User selects exercise + 132 keypoints from MediaPipe  
**Output:** Correct/Incorrect + Body part error + Side (left/right/both)

---

## 🎯 How It Works

```
User selects "Plank" 
    ↓
Camera captures pose → MediaPipe extracts 132 keypoints
    ↓
Model analyzes keypoints for "Plank"
    ↓
Result: "Incorrect - Lower Back (both sides)"
```

**Key Point:** Model only checks body parts relevant to the selected exercise.

---

## 📁 Files You Need

```
pose_correction_model.tflite      ← The AI model (300KB)
model_metadata.json                ← Configuration
label_mappings.json                ← Exercise & body part names
inference.py                       ← Python code to use the model
```

---

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```bash
pip install tensorflow>=2.13.0 numpy mediapipe opencv-python
```

### 2. Get Keypoints from MediaPipe

```python
import cv2
import mediapipe as mp

# Setup MediaPipe
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# Process image
image = cv2.imread("user_pose.jpg")
results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

# Extract 132 keypoints
keypoints = []
if results.pose_landmarks:
    for landmark in results.pose_landmarks.landmark:
        keypoints.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])
    # keypoints now has 132 values (33 landmarks × 4)
```

### 3. Use Model

```python
from inference import PoseCorrectionModel

# Load model
model = PoseCorrectionModel(
    model_path="pose_correction_model.tflite",
    metadata_path="model_metadata.json",
    mappings_path="label_mappings.json"
)

# User selects exercise
selected_exercise = "plank"  # User's choice

# Predict
result = model.predict(keypoints, exercise=selected_exercise)

print(result)
# {
#     "exercise": "plank",
#     "label": "incorrect",
#     "confidence": 0.92,
#     "body_part_error": "Lower Back",
#     "side": "both"
# }
```

---

## 📊 Response Format

### When Form is Correct ✅
```json
{
    "exercise": "plank",
    "label": "correct",
    "confidence": 0.95,
    "body_part_error": null,
    "side": null
}
```

### When Form is Incorrect ❌
```json
{
    "exercise": "plank",
    "label": "incorrect",
    "confidence": 0.92,
    "body_part_error": "Lower Back",
    "side": "both"
}
```

**Fields:**
- `exercise`: The exercise name (from user selection)
- `label`: "correct" or "incorrect"
- `confidence`: How confident the model is (0-1)
- `body_part_error`: Which body part is wrong (only if incorrect)
- `side`: "left", "right", or "both" (only if incorrect)

---

## 🎓 Supported Exercises

| Exercise | Key Body Parts Monitored |
|----------|-------------------------|
| **Plank** | Core, Lower Back, Shoulders |
| **Side Plank** | Core, Hips, Shoulders |
| **Hundred Hold** | Core, Neck, Lower Back |
| **Bridge Hold** | Hips, Glutes, Lower Back, Knees |
| **Shoulder Bridge Single Leg** | Hips, Glutes, Lower Back |
| **Swan Hold** | Upper Back, Lower Back, Shoulders |
| **Side Kick Kneeling** | Core, Hips, Shoulders |
| **Superman Hold** | Lower Back, Core, Neck |

---

## 🔍 Complete Example

```python
import cv2
import mediapipe as mp
from inference import PoseCorrectionModel

# 1. Initialize
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
model = PoseCorrectionModel(
    model_path="pose_correction_model.tflite",
    metadata_path="model_metadata.json",
    mappings_path="label_mappings.json"
)

# 2. User selects exercise
selected_exercise = "plank"  # From your UI

# 3. Get image from camera/upload
image = cv2.imread("user_plank.jpg")
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# 4. Extract keypoints
results = pose.process(image_rgb)

if results.pose_landmarks:
    # Get 132 keypoints
    keypoints = []
    for lm in results.pose_landmarks.landmark:
        keypoints.extend([lm.x, lm.y, lm.z, lm.visibility])
    
    # 5. Check form
    result = model.predict(keypoints, exercise=selected_exercise)
    
    # 6. Show feedback
    if result['label'] == 'correct':
        print("✅ Perfect form!")
    else:
        print(f"❌ Adjust your {result['body_part_error']} ({result['side']})")
else:
    print("⚠️ No person detected in image")

pose.close()
```

---

## 📱 Integration Patterns

### Pattern 1: Web API (Flask)

```python
from flask import Flask, request, jsonify

app = Flask(__name__)
model = PoseCorrectionModel(...)

@app.route('/check_pose', methods=['POST'])
def check_pose():
    data = request.json
    keypoints = data['keypoints']  # 132 values
    exercise = data['exercise']     # User selected
    
    result = model.predict(keypoints, exercise=exercise)
    return jsonify(result)

app.run(port=5000)
```

**Client request:**
```javascript
fetch('/check_pose', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        exercise: 'plank',
        keypoints: [0.5, 0.3, ...] // 132 values
    })
})
```

### Pattern 2: Real-time Video

```python
cap = cv2.VideoCapture(0)  # Webcam
selected_exercise = "plank"  # User chose this

while cap.isOpened():
    ret, frame = cap.read()
    
    # Extract keypoints
    results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if results.pose_landmarks:
        keypoints = [...]  # Extract as shown above
        result = model.predict(keypoints, exercise=selected_exercise)
        
        # Show feedback on frame
        status = "✅ Correct" if result['label'] == 'correct' else f"❌ {result['body_part_error']}"
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    
    cv2.imshow('Pose Check', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
```

### Pattern 3: Mobile (Android Kotlin)

```kotlin
class PoseChecker(context: Context) {
    private val interpreter = Interpreter(loadModel(context))
    
    fun checkPose(keypoints: FloatArray, exercise: String): Result {
        // 1. Convert exercise to one-hot
        val exerciseOneHot = exerciseToOneHot(exercise)
        
        // 2. Prepare inputs
        val inputs = arrayOf(keypoints, exerciseOneHot)
        
        // 3. Run model
        val outputs = runInference(inputs)
        
        // 4. Parse results
        return Result(
            exercise = exercise,
            label = if (outputs.label > 0.5) "incorrect" else "correct",
            bodyPartError = getBodyPart(outputs.bodyPart),
            side = getSide(outputs.side)
        )
    }
}
```

---

## ⚙️ Model Details

### Input Requirements

**Keypoints (132 values):**
- 33 MediaPipe landmarks × 4 values each
- Values: `x, y, z, visibility`
- Range: Normalized (0-1 for x,y; relative for z)
- Order: Must match MediaPipe Pose landmark order

**Exercise (string):**
- One of: `plank`, `side_plank`, `hundred_hold`, `bridge_hold`, `shoulder_bridge_single_leg`, `swan_hold`, `side_kick_kneeling_hold`, `superman_hold`
- Model will only check body parts relevant to this exercise

### Performance

| Metric | Accuracy |
|--------|----------|
| Correct/Incorrect | 95.0% |
| Body Part Detection | 96.9% |
| Side Detection | 96.9% |

**Inference Speed:**
- Model: ~5-10ms
- MediaPipe: ~20-30ms
- **Total: ~30-50ms** (real-time capable)

---

## 🐛 Common Issues

### Issue: "No pose detected"
**Cause:** Person not fully visible or poor lighting  
**Fix:**
- Ensure full body is in frame
- Improve lighting
- Lower MediaPipe confidence threshold

### Issue: "Wrong predictions"
**Cause:** Incorrect keypoint order or preprocessing  
**Fix:**
- Verify 132 values in correct order
- Use provided preprocessing in `inference.py`
- Check MediaPipe is returning all landmarks

### Issue: "Slow performance"
**Cause:** Running on CPU without optimization  
**Fix:**
- Use TFLite GPU delegate if available
- Reduce camera resolution
- Process every N frames (not every frame)

---

## 📞 Need Help?

**Check these first:**
1. Are you passing exactly 132 keypoints?
2. Is the exercise name spelled correctly?
3. Is MediaPipe detecting the pose? (check `results.pose_landmarks`)

**Still stuck?**
- Check `inference.py` for working example
- Review `model_metadata.json` for model specs
- Test with sample data first

---

## 🔄 Workflow Summary

```
┌─────────────────┐
│  User selects   │
│   "Plank"       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Camera/Image   │
│   capture       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MediaPipe     │
│ extracts 132 kp │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI Model      │
│ checks "Plank"  │
│   form only     │
└────���───┬────────┘
         │
         ▼
┌─────────────────┐
│   Feedback:     │
│ "Lower Back     │
│  needs adjust"  │
└─────────────────┘
```

---

## 📄 License

**Proprietary** - For authorized use only

---

## 📚 File Sizes

- Model: ~300 KB
- Metadata: ~5 KB
- Mappings: ~2 KB
- **Total: ~307 KB** (very lightweight!)

---

**Model Version:** 1.0.0  
**Last Updated:** 2025-02-18  
**Python:** 3.8+  
**TensorFlow:** 2.13+
```cd "c:\Users\Cong Tuong\Downloads\pose_correction_v2.0_exercise_aware"
python -m pip install tensorflow numpy mediapipe opencv-python

**This README is:**
- ✅ Short and focused (vs 500 lines before)
- ✅ Shows working code first
- ✅ Explains the "user selects exercise" workflow
- ✅ Includes all essential info
- ✅ Easy to scan and find what you need
