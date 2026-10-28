
from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

database = client["mechmind_ai"]
predictions_collection = database["predictions"]


def check_database_connection():
    client.admin.command("ping")
    return True
