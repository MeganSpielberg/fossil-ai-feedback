# main.py
import streamlit as st
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase, WebRtcMode
from av import VideoFrame
import cv2
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from datetime import date
import os
import threading

st.set_page_config(page_title="Real time AI feedback", layout="wide")
st.title("Real time AI feedback prototype")

# --- Initialize form state ---
if "form_data" not in st.session_state:
    st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}

st.subheader("Submission Details")
title = st.text_input(
    "Title",
    placeholder="e.g., Rock fossil",
    value=st.session_state.form_data["title"],
    key="title_input"
)
find_date = st.date_input(
    "Date of Find",
    value=st.session_state.form_data["date"],
    key="date_input"
)
location = st.text_input(
    "Location",
    placeholder="e.g., City, Country or GPS coordinates",
    value=st.session_state.form_data["location"],
    key="location_input"
)
st.session_state.form_data["title"] = title
st.session_state.form_data["date"] = find_date
st.session_state.form_data["location"] = location
# ---------- Session State ----------
if "photos" not in st.session_state:
    st.session_state.photos = []  # list of PIL images
if "form" not in st.session_state:
    st.session_state.form = {"title": "", "date": date.today(), "location": ""}
if "mode" not in st.session_state:
    st.session_state.mode = "Baseline"

# For signaling capture from main thread to transformer callback
CaptureLock = threading.Lock()
capture_next_frame = {"flag": False}  # mutable container accessible from both threads
# Stores captured frames (numpy BGR images) placed by transformer
captured_frames_buffer = []

# ---------- Quality Analysis (robust/local) ----------
def analyze_fossil_quality_pil(pil_img: Image.Image):
    """
    Returns (feedback_list, metrics_dict).
    Robust metrics: local sharpness (patch), percent dark/bright pixels, cluster-based background uniformity.
    """
    img = np.array(pil_img.convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    metrics = {}
    feedback = []

    # Lighting: percent of too-dark / too-bright pixels
    dark_pct = float(np.mean(gray < 50))
    bright_pct = float(np.mean(gray > 240))
    metrics["dark_pct"] = round(dark_pct * 100, 2)
    metrics["bright_pct"] = round(bright_pct * 100, 2)
    if dark_pct > 0.15:
        feedback.append("Significant dark regions — add more even light.")
    else:
        feedback.append("Lighting OK")
    if bright_pct > 0.10:
        feedback.append("Overexposed regions detected — reduce glare.")
    else:
        feedback.append("No major overexposure")

    # Sharpness: local Laplacian variance (minimum patch)
    h, w = gray.shape
    patch = 120  # patch size — tune to your use case
    min_var = np.inf
    for y in range(0, h, patch):
        for x in range(0, w, patch):
            p = gray[y : y + patch, x : x + patch]
            if p.size == 0:
                continue
            var = cv2.Laplacian(p, cv2.CV_64F).var()
            if var < min_var:
                min_var = var
    if not np.isfinite(min_var):
        min_var = 0.0
    metrics["min_sharpness"] = round(float(min_var), 2)
    if min_var < 120:  # tuned threshold; raise if you want stricter
        feedback.append("Local blur detected — refocus or steady the camera.")
    else:
        feedback.append("Sharpness OK")

    # Background uniformity via KMeans clustering on a small resize
    small = cv2.resize(img, (150, 150))
    reshaped = small.reshape(-1, 3).astype(np.float32)
    try:
        kmeans = KMeans(n_clusters=3, n_init=10, random_state=0).fit(reshaped)
        counts = np.bincount(kmeans.labels_)
        dominant_pct = float(counts.max()) / counts.sum()
    except Exception:
        dominant_pct = 1.0
    metrics["dominant_bg_pct"] = round(dominant_pct * 100, 2)
    if dominant_pct < 0.7:
        feedback.append("Background looks cluttered — use a uniform background.")
    else:
        feedback.append("Background OK")

    return feedback, metrics

# ---------- Video Transformer for real-time feedback ----------
class RealTimeTransformer(VideoTransformerBase):
    def __init__(self):
        self.last_metrics = None
        self.last_frame = None
        self._transform_lock = threading.Lock()
        # Throttle analysis to at most once every N seconds to save CPU/GPU
        self.last_analysis_time = 0.0
        self.analysis_interval = 0.5  # seconds; change to 1.0 for once-per-second
        self.last_feedback = ["No analysis yet"]

        # Background analysis thread control
        self._stop_event = threading.Event()
        self._analysis_thread = threading.Thread(target=self._analysis_loop, daemon=True)
        self._analysis_thread.start()

    def _analysis_loop(self):
        import time
        while not self._stop_event.is_set():
            time.sleep(self.analysis_interval)
            # grab a copy of the latest frame (BGR numpy) without holding the lock while analyzing
            with self._transform_lock:
                frame = None if self.last_frame is None else self.last_frame.copy()
            if frame is None:
                continue
            try:
                img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(img_rgb)
                feedback, metrics = analyze_fossil_quality_pil(pil_img)
                # update shared state under lock
                with self._transform_lock:
                    self.last_metrics = metrics
                    self.last_feedback = feedback
                    self.last_analysis_time = time.time()
            except Exception:
                with self._transform_lock:
                    self.last_feedback = ["Analysis error"]
                    self.last_metrics = {}

    def recv(self, frame: VideoFrame) -> VideoFrame:
        img = frame.to_ndarray(format="bgr24")
        with self._transform_lock:
            self.last_frame = img.copy()

        # Use last computed metrics/feedback (analysis happens in background thread)
        with self._transform_lock:
            feedback = self.last_feedback
            metrics = self.last_metrics

        # Draw overlay: place first 3 feedback items
        y = 30
        for i, f in enumerate(feedback[:3]):
            text = f
            # decide color based on positive keywords instead of emoji
            positive_keywords = ["OK", "No major", "Lighting OK", "Sharpness OK", "Background OK"]
            color = (0, 200, 0) if any(k in text for k in positive_keywords) else (0, 165, 255)
            cv2.putText(img, text, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)
            y += 30

        # If main thread set capture flag, copy frame into buffer
        if capture_next_frame["flag"]:
            with CaptureLock:
                captured_frames_buffer.append(img.copy())
                capture_next_frame["flag"] = False

        return VideoFrame.from_ndarray(img, format="bgr24")

# ---------- Streamlit UI Workflow ----------
st.divider()
st.markdown("#### Live Webcam Stream with Real-Time Quality Feedback")

ctx = webrtc_streamer(
    key="fossil-capture",
    mode=WebRtcMode.SENDRECV,
    video_transformer_factory=RealTimeTransformer,
    media_stream_constraints={"video": True, "audio": False},
    async_processing=True,
)

if ctx.video_transformer and st.button("Capture Frame", type="primary"):
    with ctx.video_transformer._transform_lock:
        if ctx.video_transformer.last_frame is not None:
            img_bgr = ctx.video_transformer.last_frame.copy()
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(img_rgb)
            st.session_state.photos.append(pil_image)
            st.success("Frame captured!")
        else:
            st.warning("No video frame available yet.")

st.markdown("Captured Photos and Analysis")
if st.session_state.photos:
    for idx, pil_image in enumerate(st.session_state.photos):
        cols = st.columns([3, 1])
        with cols[0]:
            st.image(pil_image, caption=f"Image {idx+1}", width=220)
            feedback, metrics = analyze_fossil_quality_pil(pil_image)
            st.markdown("Quality Feedback:")
            for f in feedback:
                st.write(f)
            # Removed metrics printing to hide JSON
            # st.markdown("**Metrics:**")
            # st.json(metrics)
        with cols[1]:
            if st.button(f"Remove {idx+1}", key=f"remove_{idx}"):
                st.session_state.photos.pop(idx)
                st.rerun()
else:
    st.write("No photos captured yet.")


# --- Submit Section ---
st.divider()
if st.button("Submit"):
    title = st.session_state.form_data["title"].strip()
    location = st.session_state.form_data["location"].strip()
    find_date = st.session_state.form_data["date"]

    if not title or not location:
        st.warning("Please provide a title and location before submitting.")
    elif not st.session_state.photos:
        st.warning("Please take at least one image before submitting.")
    else:
        base_dir = "submissions"
        os.makedirs(base_dir, exist_ok=True)
        folder_name = f"{title.replace(' ', '_')}_{location.replace(' ', '_')}_{find_date}"
        save_dir = os.path.join(base_dir, folder_name)
        os.makedirs(save_dir, exist_ok=True)

        # Save all captured images
        for i, pil_image in enumerate(st.session_state.photos, start=1):
            filepath = os.path.join(save_dir, f"img_{i}.jpg")
            pil_image.save(filepath)

        st.success(f"Submission '{title}' saved successfully in `{save_dir}`")
        # Reset all
        st.session_state.photos.clear()
        st.session_state.form_data = {"title": "", "date": date.today(), "location": ""}
        st.rerun()