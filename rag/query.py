# rag/query.py
import chromadb

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_or_create_collection("emotion_kb")

def retrieve_context(query: str, k=3):
    try:
        results = collection.query(query_texts=[query], n_results=k)
        # results 里有 documents、ids、distances
        if results["documents"] and len(results["documents"]) > 0:
            return results["documents"][0]
        return ["No relevant context found."]
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return ["No context available."]

if __name__ == "__main__":
    ctx = retrieve_context("how to do cognitive restructuring?")
    for c in ctx:
        print("----")
        print(c[:200])
