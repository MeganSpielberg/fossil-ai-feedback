from turtle import title
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
import io
import base64
from database import supabase, upload_image_to_supabase

app = Flask(__name__)
cors = CORS(app, origins="*")

def analyze_fossil_quality(image_data):
    """Analyze image quality and return feedback"""
    # Convert base64 to PIL Image
    img_bytes = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    img = np.array(image)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    feedback = []
    metrics = {}

    # Lighting analysis
    dark_pct = np.mean(gray < 50)
    bright_pct = np.mean(gray > 220)
    metrics['dark_pct'] = round(dark_pct * 100, 1)
    metrics['bright_pct'] = round(bright_pct * 100, 1)
    
    if dark_pct > 0.2:
        feedback.append({"type": "warning", "message": "Too dark - increase lighting"})
    else:
        feedback.append({"type": "success", "message": "Lighting is good"})
    
    if bright_pct > 0.2:
        feedback.append({"type": "warning", "message": "Overexposed - reduce lighting"})
    else:
        feedback.append({"type": "success", "message": "No overexposure"})

    # Sharpness analysis
    h, w = gray.shape
    patch_size = 100
    min_var = 1e9
    for y in range(0, h, patch_size):
        for x in range(0, w, patch_size):
            patch = gray[y:y+patch_size, x:x+patch_size]
            var = cv2.Laplacian(patch, cv2.CV_64F).var()
            if var < min_var:
                min_var = var
    
    metrics['min_sharpness'] = round(min_var, 1)
    
    if min_var < 100:
        feedback.append({"type": "warning", "message": "Image is blurry - hold steady"})
    else:
        feedback.append({"type": "success", "message": "Sharpness is good"})

    # Background uniformity
    small_img = cv2.resize(img, (100, 100))
    reshaped = small_img.reshape(-1, 3)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
    labels = kmeans.fit_predict(reshaped)
    counts = np.bincount(labels)
    dominant_pct = counts.max() / counts.sum()
    metrics['dominant_bg_pct'] = round(dominant_pct * 100, 1)
    
    if dominant_pct < 0.7:
        feedback.append({"type": "warning", "message": "Background is cluttered - use plain surface"})
    else:
        feedback.append({"type": "success", "message": "Background is uniform"})

    return {"feedback": feedback, "metrics": metrics}

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze a single image and return quality feedback"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        result = analyze_fossil_quality(image_data)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/submit", methods=["POST"])
def submit_images():
    try:
        title = request.form.get("title")
        location = request.form.get("location")
        prototype = request.form.get("prototype")

        if not all([title, location, prototype]):
            return jsonify({"error": "Missing required fields"}), 400

        submission_row = supabase.table("submissions").insert({
            "title": title,
            "location": location,
            "prototype": prototype
        }).execute()

        # Use data directly, no .error or .status_code checks
        submission_id = submission_row.data[0]["id"]

        images = request.files.getlist("images")
        saved_count = 0

        for idx, image in enumerate(images):
            if image:
                file_bytes = image.read()
                safe_filename = f"{submission_id}_{idx + 1}.jpg"
                url = upload_image_to_supabase(file_bytes, safe_filename)
                image_row = supabase.table("images").insert({
                    "submission_id": submission_id,
                    "filename": safe_filename,
                    "image_url": url,
                    "feedback": {},
                    "metrics": {}
                }).execute()

                # Assume success if no exception
                saved_count += 1

        return jsonify({
            "success": True,
            "submission_id": submission_id,
            "images_saved": saved_count
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)