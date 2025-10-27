from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
cors = CORS(app, origins="*")

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/images', methods=['GET'])
def get_images():  
    images = os.listdir(UPLOAD_FOLDER)
    return jsonify({"images": images})

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    return jsonify({"success": True, "filename": filename})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)