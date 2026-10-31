
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


def ask_maintenance_assistant(
    question: str,
    machine_context: dict | None = None
):
    # Prepare machine information
    machine_information = ""

    if machine_context:
        machine_information = "\n".join(
            f"{key}: {value}"
            for key, value in machine_context.items()
        )

    # Include machine context in the retrieval query
    retrieval_query = question

    if machine_information:
        retrieval_query += "\nMachine information:\n" + machine_information

    # Retrieve relevant document chunks
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 4}
    )

    retrieved_docs = retriever.invoke(retrieval_query)

    if not retrieved_docs:
        return {
            "answer": "I couldn't find relevant information in the maintenance documents.",
            "sources": []
        }

    # Prepare context from retrieved chunks
    document_context = "\n\n".join(
        [
            f"Source: {doc.metadata.get('source', 'Unknown')}\n"
            f"Page: {doc.metadata.get('page', 'Unknown')}\n"
            f"Content: {doc.page_content}"
            for doc in retrieved_docs
        ]
    )

    prompt = f"""
You are MechMind AI, an industrial predictive maintenance assistant.

Your task is to explain the machine's ML prediction and provide
maintenance guidance using the supplied information.

IMPORTANT RULES:
1. Use ONLY the maintenance document context for maintenance recommendations.
2. Treat machine readings and ML predictions as supplied data, not confirmed diagnoses.
3. Never claim that a particular component has failed.
4. Explain what the predicted probability means without treating it as certainty.
5. Do not invent technical specifications, operating limits, or repair procedures.
6. If the documents do not support a recommendation, clearly say so.
7. Recommend following OEM instructions and approved site safety procedures.
8. Mention relevant document page numbers.

MACHINE INFORMATION:

{machine_information if machine_information else "No machine information provided."}

MAINTENANCE DOCUMENT CONTEXT:

{document_context}

USER QUESTION:

{question}

Provide your response using these sections:

1. Prediction Overview
2. Interpretation of Machine Readings
3. Relevant Maintenance Checks
4. Recommended Next Steps
5. Document References

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