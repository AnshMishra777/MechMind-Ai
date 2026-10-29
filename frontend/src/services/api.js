
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Send sensor readings to the ML prediction endpoint
export const predictMachineFailure = async (sensorData) => {
  const response = await api.post("/predict", sensorData);
  return response.data;
};

// Fetch saved prediction history from MongoDB through FastAPI
export const getPredictionHistory = async (limit = 20) => {
  const response = await api.get("/predictions", {
    params: { limit },
  });

  return response.data;
};

export const deletePrediction = async (predictionId) => {
  const response = await api.delete(`/predictions/${predictionId}`);
  return response.data;
};

export const clearPredictionHistory = async () => {
  const response = await api.delete("/predictions");
  return response.data;
};


export default api;
