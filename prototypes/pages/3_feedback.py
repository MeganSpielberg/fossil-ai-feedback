import streamlit as st
from PIL import Image
import numpy as np
import cv2
from sklearn.cluster import KMeans
from datetime import date
import os

st.set_page_config(page_title="Post-capture feedback", layout="wide")
st.title("Post-capture feedback prototype")

st.markdown("""
<style>
div[data-testid="stCameraInput"] video {
    width: 100% !important;
    height: 80vh !important;
    object-fit: cover;
    border-radius: 8px;
}
</style>
""", unsafe_allow_html=True)

st.components.v1.html("""
<script>
document.documentElement.requestFullscreen().catch(()=>{});
</script>
""")

# --- Session state ---
if "photos" not in st.session_state:
    st.session_state.photos = []
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}


# --- Helper: Scale / Coin Detection ---
def detect_ruler_like_object(image: np.ndarray) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100,
                            minLineLength=100, maxLineGap=15)
    if lines is None:
        return False
    angles = [np.degrees(np.arctan2(y2 - y1, x2 - x1)) for [[x1, y1, x2, y2]] in lines]
    hist, _ = np.histogram(angles, bins=18, range=(-90, 90))
    return hist.max() > 10


def detect_coin_like_object(image: np.ndarray) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 7)
    circles = cv2.HoughCircles(
        blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
        param1=50, param2=30, minRadius=15, maxRadius=100
    )
    return circles is not None


def detect_scale_in_image(image: np.ndarray):
    """Return (bool, str) indicating scale type."""
    ruler = detect_ruler_like_object(image)
    coin = detect_coin_like_object(image)
    if ruler:
        return True, "📏 Ruler or scale bar detected"
    if coin:
        return True, "🪙 Coin detected (size reference)"
    return False, "⚠️ No scale or ruler detected"


# --- Fossil quality analysis ---
def analyze_fossil_quality(image: Image.Image):
    img = np.array(image.convert("RGB"))
    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    feedback, metrics = [], {}

    # Lighting
    dark_pct = np.mean(gray < 50)
    bright_pct = np.mean(gray > 220)
    metrics['dark_pct'] = round(dark_pct * 100, 1)
    metrics['bright_pct'] = round(bright_pct * 100, 1)
    feedback.append("Too dark" if dark_pct > 0.2 else "Lighting OK")
    feedback.append("Overexposed" if bright_pct > 0.2 else "No overexposure")

    # Sharpness
    h, w = gray.shape
    patch_size = 100
    min_var = 1e9
    for y in range(0, h, patch_size):
        for x in range(0, w, patch_size):
            patch = gray[y:y + patch_size, x:x + patch_size]
            if patch.size == 0:
                continue
            var = cv2.Laplacian(patch, cv2.CV_64F).var()
            if var < min_var:
                min_var = var
    metrics['min_sharpness'] = round(min_var, 1)
    feedback.append("Blurry regions" if min_var < 100 else "✅ Sharpness OK")

    # Background uniformity
    small_img = cv2.resize(img, (100, 100))
    reshaped = small_img.reshape(-1, 3)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
    labels = kmeans.fit_predict(reshaped)
    counts = np.bincount(labels)
    dominant_pct = counts.max() / counts.sum()
    metrics['dominant_bg_pct'] = round(dominant_pct * 100, 1)
    feedback.append("Cluttered background" if dominant_pct < 0.7 else "Background OK")

    # Scale detection (ruler or coin)
    has_scale, msg = detect_scale_in_image(img_bgr)
    feedback.append("✅ " + msg if has_scale else msg)

    return feedback, metrics


# --- Submission fields ---
st.subheader("Submission Details")
title = st.text_input("Title", value=st.session_state.form_data["title"])
find_date = st.date_input("Date of Find", value=st.session_state.form_data["date"])
location = st.text_input("Location", value=st.session_state.form_data["location"])
st.session_state.form_data.update({"title": title, "date": find_date, "location": location})


# --- Camera input ---
st.subheader("📷 Take Fossil Photos")
st.markdown("""
**Instructions:**  
- Ensure good lighting, uniform background, and sharp focus.  
- Include a ruler or a coin for scale.  
""")

photo = st.camera_input("Capture a photo", key="camera_input")

if photo:
    image = Image.open(photo)
    st.image(image, caption="Captured Photo", use_container_width=True)

    # Quality & scale feedback
    feedback, metrics = analyze_fossil_quality(image)
    st.subheader("Image Feedback (Quality + Scale)")
    for line in feedback:
        st.write(line)
    st.caption(f"Metrics: {metrics}")

    cols = st.columns([1, 1])
    if cols[0].button("✅ Keep Photo"):
        st.session_state.photos.append(image)
        st.success("Photo saved!")
    if cols[1].button("🔁 Discard Photo"):
        st.warning("Photo discarded.")


# --- Display saved photos ---
if st.session_state.photos:
    st.subheader("📸 Saved Photos")
    for idx, img in enumerate(st.session_state.photos):
        st.image(img, caption=f"Image {idx+1}", use_container_width=True)
        if st.button(f"🗑 Remove {idx+1}", key=f"remove_{idx}"):
            st.session_state.photos.pop(idx)
            st.rerun()


# --- Submit button ---
if st.button("Submit"):
    if not title or not location:
        st.warning("Please provide title and location.")
    elif not st.session_state.photos:
        st.warning("Please take at least one photo.")
    else:
        folder_name = f"{title.replace(' ', '_')}_{location.replace(' ', '_')}_{find_date}"
        os.makedirs("submissions", exist_ok=True)
        save_dir = os.path.join("submissions", folder_name)
        os.makedirs(save_dir, exist_ok=True)
        for i, img in enumerate(st.session_state.photos, start=1):
            img.save(os.path.join(save_dir, f"img_{i}.jpg"))
        st.success(f"✅ Submission saved in `{save_dir}`")

        st.session_state.photos.clear()
        st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
