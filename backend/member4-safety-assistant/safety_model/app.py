from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from sentence_transformers import SentenceTransformer
import json
import numpy as np
import faiss
from pathlib import Path

app = FastAPI(title="Electricity Safety Assistant API")

# Add CORS middleware to allow Expo Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
INDEX_DIR = Path("electricity_safety_db")

# embedding model (sentence-transformers)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# load faiss index + metadata
idx_path = INDEX_DIR / "electricity.index"
meta_path = INDEX_DIR / "metadata.json"
if not idx_path.exists() or not meta_path.exists():
    raise RuntimeError(f"Index not found. Run build_index.py to create {idx_path} and {meta_path}.")
index = faiss.read_index(str(idx_path))
with open(meta_path, "r", encoding="utf-8") as f:
    METADATA = json.load(f)


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    question: str
    answer: str
    hazard_type: str
    source: str
    confidence: float


@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    # embed query and search with faiss
    q_vec = embedding_model.encode(request.question, convert_to_numpy=True)
    q_arr = np.array([q_vec], dtype="float32")
    D, I = index.search(q_arr, 3)
    if I.size == 0:
        return QueryResponse(
            question=request.question,
            answer="No relevant safety information found. Please consult a licensed electrician.",
            hazard_type="Unknown",
            source="N/A",
            confidence=0.0
        )
    top_idx = int(I[0][0])
    meta = METADATA[top_idx]
    return QueryResponse(
        question=request.question,
        answer=meta.get("answer", ""),
        hazard_type=meta.get("hazard_type", "Unknown"),
        source=meta.get("source", "Unknown"),
        confidence=0.95
    )


@app.get("/health")
def health_check():
    return {"status": "running", "model": "Electricity Safety RAG"}


# Run with: uvicorn app:app --reload --port 8000