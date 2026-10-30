# To start backend = uvicorn backend.api.main:app --reload
from datetime import datetime, timezone
from pathlib import Path

from backend.database import client, predictions_collection
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId



from backend.database import predictions_collection

app = FastAPI(title="MechMind AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "ml"
    / "artifacts"
    / "mechmind_model.joblib"
)

model = joblib.load(MODEL_PATH)


class MachineData(BaseModel):
    Type: str = Field(pattern="^[LMH]$")
    air_temperature: float = Field(gt=0)
    process_temperature: float = Field(gt=0)
    rotational_speed: float = Field(gt=0)
    torque: float = Field(ge=0)
    tool_wear: float = Field(ge=0)


@app.get("/")
def home():
    return {"message": "MechMind AI API is running"}


@app.post("/predict")
def predict(data: MachineData):
    try:
        features = pd.DataFrame([{
            "Type": data.Type,
            "Air temperature [K]": data.air_temperature,
            "Process temperature [K]": data.process_temperature,
            "Rotational speed [rpm]": data.rotational_speed,
            "Torque [Nm]": data.torque,
            "Tool wear [min]": data.tool_wear,
        }])

        prediction = int(model.predict(features)[0])
        probability = float(model.predict_proba(features)[0][1])

        result = {
            "failure_prediction": prediction,
            "failure_probability": round(probability, 4),
            "status": (
                "Failure predicted"
                if prediction == 1
                else "No failure predicted"
            ),
        }

        # Save sensor readings and prediction to MongoDB
        record = {
            "Type": data.Type,
            "air_temperature": data.air_temperature,
            "process_temperature": data.process_temperature,
            "rotational_speed": data.rotational_speed,
            "torque": data.torque,
            "tool_wear": data.tool_wear,
            **result,
            "created_at": datetime.now(timezone.utc),
        }

        predictions_collection.insert_one(record)

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Prediction or database save failed. Check the backend logs.",
        ) from exc


@app.get("/predictions")
def get_predictions(limit: int = Query(default=20, ge=1, le=100)):
    try:
        records = predictions_collection.find().sort(
            "created_at", -1
        ).limit(limit)

        history = []

        for record in records:
            record["_id"] = str(record["_id"])
            record["created_at"] = record["created_at"].isoformat()
            history.append(record)

        return {
            "total": predictions_collection.count_documents({}),
            "predictions": history,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve prediction history.",
        ) from exc


@app.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: str):
    try:
        object_id = ObjectId(prediction_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid prediction ID"
        )

    result = predictions_collection.delete_one(
        {"_id": object_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return {"message": "Prediction deleted successfully"}


@app.delete("/predictions")
def clear_prediction_history():
    try:
        result = predictions_collection.delete_many({})
        return {
            "message": "Prediction history cleared successfully",
            "deleted_count": result.deleted_count
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to clear prediction history."
        ) from exc
        
        
@app.get("/health")
def health_check():
    model_status = "loaded" if model is not None else "not_loaded"

    try:
        client.admin.command("ping")
        database_status = "connected"
    except Exception:
        database_status = "disconnected"

    overall_status = (
        "healthy"
        if model_status == "loaded" and database_status == "connected"
        else "degraded"
    )

    return {
        "status": overall_status,
        "api": "online",
        "model": model_status,
        "database": database_status,
    }