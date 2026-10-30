# To run this type= python -m backend.genai.ingest



from pathlib import Path
from pypdf import PdfReader

# Project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# PDF location
PDF_PATH = (
    BASE_DIR
    / "docs"
    / "maintenance"
    / "MechMind_AI_Predictive_Maintenance_Guide_Expanded.pdf"
)


def extract_pdf_text():
    reader = PdfReader(str(PDF_PATH))

    documents = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()

        if text and text.strip():
            documents.append({
                "page": page_number,
                "text": text
            })

    return documents


if __name__ == "__main__":
    pages = extract_pdf_text()

    print("Total pages extracted:", len(pages))
    print("\nFirst page content:\n")
    print(pages[0]["text"])
