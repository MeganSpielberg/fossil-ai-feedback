import streamlit as st
# Run with: python -m streamlit run prototypes/main.py

main_page = st.Page("pages/1_home.py", title="Main Page")
page_2 = st.Page("pages/2_baseline.py", title="1 Baseline")
page_3 = st.Page("pages/3_feedback.py", title="2 Post Capture Feedback")
page_4 = st.Page("pages/4_real-time.py", title="3 Real-time Feedback")
page_5 = st.Page("pages/camera_p1.py", title="Camera Prototype 1")

pages = {
    "Home": [
        main_page
    ],
    "Prototypes": [
        page_2,
        page_3, 
        page_4,
        page_5
    ],
}

pg = st.navigation(pages,  position="top")
pg.run()
