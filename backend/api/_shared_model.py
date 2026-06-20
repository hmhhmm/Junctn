from sentence_transformers import SentenceTransformer

print("Loading embedding model…")
_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model ready.")
