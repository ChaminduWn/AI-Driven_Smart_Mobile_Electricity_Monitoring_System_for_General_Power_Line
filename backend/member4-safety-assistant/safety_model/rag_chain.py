from sentence_transformers import SentenceTransformer
from transformers import pipeline


import faiss
import numpy as np
import json
from pathlib import Path

INDEX_DIR = Path("electricity_safety_db")


def load_chain():
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    # use a small causal language model that works with text-generation
    generator = pipeline(
        "text-generation",
        model="distilgpt2",
        max_new_tokens=256
    )
    llm = generator

    # always use manual faiss search
    idx_path = INDEX_DIR / "electricity.index"
    meta_path = INDEX_DIR / "metadata.json"
    if not idx_path.exists() or not meta_path.exists():
        raise RuntimeError("Index not found. Run build_index.py to create the index and metadata.json")
    index = faiss.read_index(str(idx_path))
    with open(meta_path, "r", encoding="utf-8") as f:
        METADATA = json.load(f)

    def ask(question: str):
        q_vec = embedding_model.encode(question, convert_to_numpy=True)
        q_arr = np.array([q_vec], dtype="float32")
        D, I = index.search(q_arr, 3)
        docs = []
        for idx in I[0]:
            if idx < 0:
                continue
            meta = METADATA[int(idx)]
            docs.append({"content": meta.get("answer", ""), "metadata": meta})
        return docs

    return llm, ask


if __name__ == "__main__":
    llm, ask = load_chain()
    docs = ask("What should I do if I see a fallen power line?")
    context = "\n\n".join([d['content'] for d in docs])
    prompt = f"Context:\n{context}\n\nQuestion: What should I do if I see a fallen power line?\n\nAnswer:"
    out = llm(prompt)
    # pipeline returns a list of dicts; extract text if possible
    if isinstance(out, list) and out and 'generated_text' in out[0]:
        print(out[0]['generated_text'])
    else:
        print(out)