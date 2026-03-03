import numpy as np
import tensorflow as tf
import json

class PoseCorrectionModel:
    def __init__(self, model_path, metadata_path, mappings_path):
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        with open(mappings_path, 'r') as f:
            self.mappings = json.load(f)
        
        # Get indices from metadata
        self.exercise_input_idx = self.metadata['inputs']['exercise_input_index']
        self.keypoints_input_idx = self.metadata['inputs']['keypoints_input_index']
        
        self.label_output_idx = self.metadata['outputs']['label_output_index']
        self.body_part_output_idx = self.metadata['outputs']['body_part_output_index']
        self.side_output_idx = self.metadata['outputs']['side_output_index']
        
        # Preprocessing params
        self.scaler_mean = np.array(self.metadata['preprocessing']['scaler_mean'])
        self.scaler_scale = np.array(self.metadata['preprocessing']['scaler_scale'])
        
        print("✓ Model loaded")
        print(f"  Inputs: exercise=[{self.exercise_input_idx}], keypoints=[{self.keypoints_input_idx}]")
        print(f"  Outputs: label=[{self.label_output_idx}], body_part=[{self.body_part_output_idx}], side=[{self.side_output_idx}]")
    
    def preprocess_keypoints(self, keypoints):
        keypoints = np.array(keypoints, dtype=np.float32)
        keypoints_normalized = (keypoints - self.scaler_mean) / self.scaler_scale
        return keypoints_normalized.reshape(1, -1).astype(np.float32)
    
    def exercise_to_onehot(self, exercise):
        num_exercises = len(self.mappings['exercises'])
        onehot = np.zeros(num_exercises, dtype=np.float32)
        idx = list(self.mappings['exercises'].values()).index(exercise)
        onehot[idx] = 1.0
        return onehot.reshape(1, -1).astype(np.float32)
    
    def predict(self, keypoints, exercise):
        # Preprocess
        keypoints_input = self.preprocess_keypoints(keypoints)
        exercise_input = self.exercise_to_onehot(exercise)
        
        # Set inputs (correct order from metadata)
        self.interpreter.set_tensor(
            self.input_details[self.exercise_input_idx]['index'], 
            exercise_input
        )
        self.interpreter.set_tensor(
            self.input_details[self.keypoints_input_idx]['index'], 
            keypoints_input
        )
        
        # Invoke
        self.interpreter.invoke()
        
        # Get outputs (correct order from metadata)
        label_output = self.interpreter.get_tensor(
            self.output_details[self.label_output_idx]['index']
        )[0]
        body_part_output = self.interpreter.get_tensor(
            self.output_details[self.body_part_output_idx]['index']
        )[0]
        side_output = self.interpreter.get_tensor(
            self.output_details[self.side_output_idx]['index']
        )[0]
        
        # Process results
        label_prob = float(label_output[0])
        is_incorrect = label_prob > 0.5
        
        body_part_idx = int(np.argmax(body_part_output))
        body_part_name = self.mappings['body_parts'][str(body_part_idx)]
        body_part_confidence = float(body_part_output[body_part_idx])
        
        side_idx = int(np.argmax(side_output))
        side_name = self.mappings['sides'][str(side_idx)]
        
        return {
            "exercise": exercise,
            "label": "incorrect" if is_incorrect else "correct",
            "confidence": body_part_confidence,
            "body_part_error": body_part_name if is_incorrect and body_part_name != 'none' else None,
            "side": side_name if is_incorrect else None
        }
