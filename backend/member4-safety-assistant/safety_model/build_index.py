import json
from pathlib import Path


from sentence_transformers import SentenceTransformer

# Fallback to plain faiss
import numpy as np
import faiss

DATA_PATH = Path(__file__).parent / "dataset_expanded.json"
INDEX_DIR = Path(__file__).parent / "electricity_safety_db"
INDEX_DIR.mkdir(parents=True, exist_ok=True)


def load_dataset(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}. Place dataset_expanded.json next to this script.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)




def build_index_faiss(dataset, index_dir: Path):
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = []
    metadatas = []
    for entry in dataset:
        text = f"Context: {entry.get('context','')}\nQuestion: {entry.get('question','')}\nAnswer: {entry.get('answer','')}"
        texts.append(text)
        metadatas.append({
            "hazard_type": entry.get("hazard_type","Unknown"),
            "source": entry.get("source","Unknown"),
            "question": entry.get("question",""),
            "answer": entry.get("answer","")
        })

    # compute embeddings
    embeddings = embedding_model.encode(texts, convert_to_numpy=True)
    # some SentenceTransformer versions return 2d list, ensure numpy
    embeddings = np.array(embeddings, dtype="float32")
    arr = np.array(embeddings, dtype="float32")

    dim = arr.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(arr)

    faiss.write_index(index, str(index_dir / "electricity.index"))
    with open(index_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadatas, f, ensure_ascii=False, indent=2)

    print(f"Saved faiss index to {index_dir / 'electricity.index'} and metadata.json")


def build_index(dataset, index_dir: Path):
    # always use direct faiss method (simpler and avoids extra dependencies)
    build_index_faiss(dataset, index_dir)


if __name__ == "__main__":
    dataset = load_dataset(DATA_PATH)
    print(f"Loaded {len(dataset)} entries")
    build_index(dataset, INDEX_DIR)