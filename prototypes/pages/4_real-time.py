# unified_main.py
import cv2
import numpy as np
import streamlit as st
from PIL import Image
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase, WebRtcMode
from sklearn.cluster import KMeans
from datetime import date
import os
import threading

st.set_page_config(page_title="Real-time Fossil Feedback & Scale Checker", layout="wide")
st.title("Real-time AI Feedback with Scale Detection")

# ------------------ FORM SECTION ------------------
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
st.subheader("Submission Details")
title = st.text_input("Title", value=st.session_state.form_data["title"], key="title_in")
find_date = st.date_input("Date of Find", value=st.session_state.form_data["date"], key="date_in")
location = st.text_input("Location", value=st.session_state.form_data["location"], key="location_in")
st.session_state.form_data.update({"title": title, "date": find_date, "location": location})

if "photos" not in st.session_state:
    st.session_state.photos = []
if "mode" not in st.session_state:
    st.session_state.mode = "Baseline"

CaptureLock = threading.Lock()
capture_next_frame = {"flag": False}
captured_frames_buffer = []


# ------------------ QUALITY & SCALE ANALYSIS ------------------
def analyze_fossil_quality_pil(pil_img: Image.Image):
    img = np.array(pil_img.convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    metrics, feedback = {}, []

    dark_pct = float(np.mean(gray < 50))
    bright_pct = float(np.mean(gray > 240))
    metrics["dark_pct"], metrics["bright_pct"] = round(dark_pct * 100, 2), round(bright_pct * 100, 2)
    feedback.append("Lighting OK" if dark_pct < 0.15 else "Significant dark regions. Add more light.")
    feedback.append("No major overexposure" if bright_pct < 0.1 else "Overexposed regions detected. Reduce glare.")

    h, w = gray.shape
    patch = 120
    min_var = min(cv2.Laplacian(gray[y:y+patch, x:x+patch], cv2.CV_64F).var()
                  for y in range(0, h, patch) for x in range(0, w, patch) if gray[y:y+patch, x:x+patch].size)
    metrics["min_sharpness"] = round(min_var, 2)
    feedback.append("Sharpness OK" if min_var > 120 else "Local blur detected. Refocus needed.")

    small = cv2.resize(img, (150, 150))
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=0).fit(small.reshape(-1, 3).astype(np.float32))
    dominant_pct = float(np.bincount(kmeans.labels_).max()) / len(kmeans.labels_)
    feedback.append("Background OK" if dominant_pct > 0.7 else "Cluttered background. Use clean backdrop.")
    metrics["dominant_bg_pct"] = round(dominant_pct * 100, 2)

    # Scale check (ruler or coin)
    has_scale, scale_type = detect_scale_in_image(img)
    if has_scale:
        feedback.append(f"{scale_type} detected. Size reference OK.")
    else:
        feedback.append("No ruler or coin detected. Please include a scale.")
    return feedback, metrics


def detect_ruler_like_object(image: np.ndarray) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
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
    """Return (True, type) if ruler or coin detected."""
    ruler_detected = detect_ruler_like_object(image)
    coin_detected = detect_coin_like_object(image)
    if ruler_detected:
        return True, "Ruler or bar scale"
    if coin_detected:
        return True, "Coin reference"
    return False, ""


# ------------------ VIDEO TRANSFORMER ------------------
class RealTimeTransformer(VideoTransformerBase):
    def __init__(self):
        self.last_metrics, self.last_frame = None, None
        self._transform_lock = threading.Lock()
        self.last_feedback = ["Initializing..."]
        self._stop_event = threading.Event()
        threading.Thread(target=self._analysis_loop, daemon=True).start()

    def _analysis_loop(self):
        import time
        while not self._stop_event.is_set():
            time.sleep(0.7)
            with self._transform_lock:
                frame = None if self.last_frame is None else self.last_frame.copy()
            if frame is None:
                continue
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(img_rgb)
            fb, metrics = analyze_fossil_quality_pil(pil_img)
            with self._transform_lock:
                self.last_feedback, self.last_metrics = fb, metrics

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")
        with self._transform_lock:
            self.last_frame = img.copy()
            fb = self.last_feedback
        y = 30
        for text in fb[:4]:
            color = (0, 200, 0) if "OK" in text or "detected" in text else (0, 165, 255)
            cv2.putText(img, text, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            y += 30
        return frame.from_ndarray(img, format="bgr24")


# ------------------ STREAMLIT LIVE SECTION ------------------
st.divider()
st.markdown("### Live Video with AI Quality & Scale Detection")

ctx = webrtc_streamer(
    key="fossil-stream",
    mode=WebRtcMode.SENDRECV,
    video_transformer_factory=RealTimeTransformer,
    media_stream_constraints={"video": True, "audio": False},
    async_processing=True,
)

if ctx.video_transformer and st.button("Capture Frame"):
    with ctx.video_transformer._transform_lock:
        if ctx.video_transformer.last_frame is not None:
            rgb = cv2.cvtColor(ctx.video_transformer.last_frame, cv2.COLOR_BGR2RGB)
            st.session_state.photos.append(Image.fromarray(rgb))
            st.success("Frame captured!")
        else:
            st.warning("No video frame yet.")


# ------------------ PHOTO COLLECTION ------------------
st.divider()
if st.session_state.photos:
    for i, img in enumerate(st.session_state.photos):
        c1, c2 = st.columns([3, 1])
        with c1:
            st.image(img, caption=f"Image {i+1}", width=220)
            fb, _ = analyze_fossil_quality_pil(img)
            st.write("Feedback:")
            for f in fb:
                st.write("-", f)
        with c2:
            if st.button(f"Remove {i+1}", key=f"rem_{i}"):
                st.session_state.photos.pop(i)
                st.rerun()
else:
    st.write("No photos captured yet.")


# ------------------ SUBMIT SECTION ------------------
st.divider()
if st.button("Submit"):
    title = st.session_state.form_data["title"].strip()
    loc = st.session_state.form_data["location"].strip()
    if not title or not loc:
        st.warning("Please provide title and location before submitting.")
    elif not st.session_state.photos:
        st.warning("Please take at least one image before submitting.")
    else:
        base = "submissions"
        os.makedirs(base, exist_ok=True)
        dirn = os.path.join(base, f"{title.replace(' ', '_')}_{loc}_{find_date}")
        os.makedirs(dirn, exist_ok=True)
        for idx, img in enumerate(st.session_state.photos, 1):
            img.save(os.path.join(dirn, f"img_{idx}.jpg"))
        st.success(f"Submission saved to {dirn}.")
        st.session_state.photos.clear()
