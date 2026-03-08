import streamlit as st
import requests

API_URL = "http://localhost:8000/ask"

st.set_page_config(page_title="⚡ Electricity Safety Assistant", page_icon="⚡", layout="centered")
st.title("⚡ Electricity Safety Assistant")
st.markdown("Ask any question about **electrical safety**, hazards, and best practices.")

question = st.text_input("🔍 Enter your safety question:", placeholder="e.g. What should I do if someone is electrocuted?")

if st.button("Get Safety Advice") and question:
    with st.spinner("Searching safety knowledge base..."):
        try:
            response = requests.post(API_URL, json={"question": question}, timeout=120)
            data = response.json()
        except Exception as e:
            st.error(f"Request failed: {e}")
            data = None

    if data:
        st.success("✅ Answer Found")
        st.markdown(f"**Answer:** {data['answer']}")
        col1, col2 = st.columns(2)
        with col1:
            st.info(f"⚠️ **Hazard Type:** {data['hazard_type']}")
        with col2:
            st.info(f"📖 **Source:** {data['source']}")
        st.warning("⚠️ Always consult a licensed electrician for actual work.")