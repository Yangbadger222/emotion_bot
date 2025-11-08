# rag/build_index.py
import os
import chromadb

def load_docs(folder="data/kb"):
    docs = []
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"Created folder: {folder}")
        return docs
    
    for fname in os.listdir(folder):
        path = os.path.join(folder, fname)
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
            docs.append({"id": fname, "text": text})
    return docs

def main():
    client = chromadb.PersistentClient(path="chroma_db")
    collection = client.get_or_create_collection("emotion_kb")

    docs = load_docs()
    if not docs:
        print("Warning: No documents found in data/kb folder!")
        return
    
    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]

    # 简单：一整个文件当成一个文档
    collection.add(documents=texts, ids=ids)
    print(f"RAG index built with {len(docs)} documents.")

if __name__ == "__main__":
    main()
