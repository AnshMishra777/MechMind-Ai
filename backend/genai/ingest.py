# To run this type= python -m backend.genai.ingest




from pathlib import Path

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


# Project root
BASE_DIR = Path(__file__).resolve().parents[2]

# PDF path
PDF_PATH = (
    BASE_DIR
    / "docs"
    / "maintenance"
    / "MechMind_AI_Predictive_Maintenance_Guide_Expanded.pdf"
)

# ChromaDB storage directory
CHROMA_PATH = BASE_DIR / "backend" / "genai" / "chroma_db"

COLLECTION_NAME = "maintenance_documents"


def load_pdf():
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"PDF not found: {PDF_PATH}")

    reader = PdfReader(str(PDF_PATH))
    documents = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()

        if text and text.strip():
            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": PDF_PATH.name,
                        "page": page_number
                    }
                )
            )

    print(f"Extracted {len(documents)} pages.")
    return documents


def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    chunks = splitter.split_documents(documents)

    print(f"Created {len(chunks)} chunks.")
    return chunks


def store_documents(chunks):
    
    embedding_function = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embedding_function,
        persist_directory=str(CHROMA_PATH)
    )

    # Remove previous copies of this PDF
    existing = vector_store.get(
        where={"source": PDF_PATH.name}
    )

    if existing["ids"]:
        vector_store.delete(ids=existing["ids"])

    vector_store.add_documents(chunks)

    print("Documents successfully stored in ChromaDB!")


def main():
    documents = load_pdf()
    chunks = split_documents(documents)
    store_documents(chunks)

    print("\nPDF ingestion completed successfully!")


if __name__ == "__main__":
    main()
