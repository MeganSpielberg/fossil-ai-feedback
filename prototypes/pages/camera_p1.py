import streamlit as st
from streamlit.components.v1 import html
from streamlit_javascript import st_javascript
import base64, os
from datetime import datetime

st.set_page_config(page_title="Camera", layout="wide")

# Ensure folder exists
save_dir = "captures"
os.makedirs(save_dir, exist_ok=True)

if "photos" not in st.session_state:
    st.session_state.photos = []

# --- Retrieve captured photo from sessionStorage (browser side)
captured_photo = st_javascript("""
let photo = sessionStorage.getItem('streamlit_photo') || null;
photo;
""")

# --- If a new photo is found
if captured_photo and captured_photo != "null":
    # Decode Base64 -> Save to disk
    img_data = captured_photo.split(",")[1]  # remove data:image/jpeg;base64,
    img_bytes = base64.b64decode(img_data)
    filename = f"photo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    filepath = os.path.join(save_dir, filename)

    with open(filepath, "wb") as f:
        f.write(img_bytes)

    st.session_state.photos.append(filepath)
    st.success(f"📸 Saved image: {filename}")

    # Clear the JS sessionStorage so it doesn't repeat
    st_javascript("sessionStorage.removeItem('streamlit_photo')")

    # Redirect back to baseline page
    st.switch_page("pages/2_baseline.py")

# --- Camera Interface (runs inside browser)
html("""
<style>
html, body { margin:0; padding:0; height:100%; background:black; overflow:hidden; }
#camera-container { position:fixed; top:0; left:0; width:100vw; height:100dvh; display:flex; justify-content:center; align-items:center; }
video { width:100%; height:100%; object-fit:cover; }
#controls { position:absolute; bottom:8vh; width:100%; display:flex; justify-content:center; gap:20px; }
button { background:rgba(255,255,255,0.9); border:none; border-radius:50%; width:80px; height:80px; font-size:24px; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.5); }
.back-btn { width:60px; height:60px; font-size:20px; background:rgba(255,100,100,0.9); }
</style>
<div id="camera-container">
  <video id="camera" autoplay playsinline></video>
  <div id="controls">
    <button id="capture">📷</button>
  </div>
  <canvas id="snapshot" style="display:none;"></canvas>
</div>
<script>
const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const capture = document.getElementById('capture');

// Start camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
  .then(stream => { video.srcObject = stream; })
  .catch(err => alert("Camera error: " + err));

// Capture and save
capture.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const data = canvas.toDataURL('image/jpeg', 0.9);

  // Stop camera stream
  video.srcObject.getTracks().forEach(track => track.stop());

  // Save to sessionStorage
  sessionStorage.setItem('streamlit_photo', data);

  // Reload to trigger Streamlit read
  window.location.reload();
});
</script>
""", height=800)

# Optional back button
if st.button("← Return to Baseline"):
    st.switch_page("pages/2_baseline.py")
