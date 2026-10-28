from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import json
app=FastAPI(title='MechMind AI API')

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
    
    
@app.get('/')
def home():
    return {"Message":"MechMind AI API is running"}

@app.post('/predict')
def predict(data:MachineData):
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

        return {
            "failure_prediction": prediction,
            "failure_probability": round(probability, 4),
            "status": (
                "Failure predicted"
                if prediction == 1
                else "No failure predicted"
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check the model features and API logs.",
        ) from exc
