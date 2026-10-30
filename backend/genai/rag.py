
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq


# Project configuration
BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

CHROMA_PATH = BASE_DIR / os.getenv(
    "CHROMA_PATH", "backend/genai/chroma_db"
)

COLLECTION_NAME = "maintenance_documents"

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"
)

GROQ_MODEL = os.getenv("GROQ_MODEL")

# Initialize embeddings using the SAME model used during ingestion
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)

# Connect to existing ChromaDB
vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
    persist_directory=str(CHROMA_PATH)
)

# Initialize Groq LLM
llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0.2,
    api_key=os.getenv("GROQ_API_KEY")
)


def ask_maintenance_assistant(question: str):
    # Retrieve relevant document chunks
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 4}
    )

    retrieved_docs = retriever.invoke(question)

    if not retrieved_docs:
        return {
            "answer": "I couldn't find relevant information in the maintenance documents.",
            "sources": []
        }

    # Prepare context from retrieved chunks
    context = "\n\n".join(
        [
            f"Source: {doc.metadata.get('source', 'Unknown')}\n"
            f"Page: {doc.metadata.get('page', 'Unknown')}\n"
            f"Content: {doc.page_content}"
            for doc in retrieved_docs
        ]
    )

    prompt = f"""
You are MechMind AI, an industrial maintenance troubleshooting assistant.

Answer the user's question using ONLY the provided maintenance document context.

Rules:
1. Do not invent technical specifications, operating limits, or repair procedures.
2. If the context does not contain enough information, clearly say so.
3. Give clear and practical explanations.
4. For safety-related issues, recommend following approved site procedures
   and consulting qualified maintenance personnel.
5. Do not claim that a predicted failure is a confirmed machine failure.
6. Cite relevant page numbers in your answer.

MAINTENANCE DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}

ANSWER:
"""

    response = llm.invoke(prompt)

    # Collect source information
    sources = []

    for doc in retrieved_docs:
        source = {
            "document": doc.metadata.get("source", "Unknown"),
            "page": doc.metadata.get("page", "Unknown")
        }

        if source not in sources:
            sources.append(source)

    return {
        "answer": response.content,
        "sources": sources
    }
