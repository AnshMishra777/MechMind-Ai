import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing from environment variables.")

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

database = client["mechmind_ai"]
predictions_collection = database["predictions"]


def check_database_connection():
    client.admin.command("ping")
    return True