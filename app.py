from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import numpy as np
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
MODEL_PATH = 'brain_tumor_multiclass_model.h5'
model = load_model(MODEL_PATH)

# Class labels
CLASSES = ['glioma', 'meningioma', 'no_tumor', 'pituitary']

@app.route('/')
def home():
    return {'status': 'ok'}

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    scan_type = data.get('scanType', '')
    
    # Simple rule-based responses for demonstration
    # In production, replace with actual ML model inference
    if 'scan' in message.lower():
        response = f"I'll help you analyze the {scan_type} scan. Please upload an image."
    elif 'symptom' in message.lower():
        response = "Could you provide more details about the symptoms you're experiencing?"
    else:
        response = "I'm your medical AI assistant. How can I help you today?"

    return jsonify({
        'response': response,
        'timestamp': datetime.now().strftime('%H:%M')
    })

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        img = load_img(file, target_size=(224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        prediction = model.predict(img_array)
        predicted_class = CLASSES[np.argmax(prediction[0])]
        confidence = float(np.max(prediction[0]))
        
        return jsonify({
            'prediction': predicted_class,
            'confidence': confidence,
            'timestamp': datetime.now().strftime('%H:%M')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
