# Electricity Safety RAG

This module provides a small Retrieval-Augmented-Generation (RAG) pipeline for electricity safety.

Files:
- `requirements.txt` — Python dependencies
- `build_index.py` — Build FAISS vectorstore from `dataset_expanded.json`
- `rag_chain.py` — Load RAG chain (local LLM) for testing
- `app.py` — FastAPI endpoint to query the index
- `ui.py` — Streamlit UI that calls the FastAPI backend

Quick start:
1. Create a virtualenv and install requirements:
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
2. Place your `dataset_expanded.json` next to these scripts (same folder).
3. Build the index:
```bash
python build_index.py
```
4. Run the API:
```bash
uvicorn app:app --reload --port 8000
```
5. Run the UI (in a separate terminal):
```bash
streamlit run ui.py
```

Notes:
- The default local model in `rag_chain.py` is a small causal LLM (`distilgpt2`) to keep downloads under ~~1 GB and avoid disk‑space issues. You can swap in other models (e.g. `gpt2`, `google/flan-t5-small`, or an API-hosted LLM), but be mindful of size and compatibility with the chosen pipeline (`text-generation` works with causal models).
- The FastAPI service listens on port 8000 by default; if that port is already used you can run it on another (we exercised 8001 during testing).
- Some models or environments may need extra CPU/GPU configuration or caching strategies; consult the Hugging Face transformers and sentence-transformers documentation for further guidance.