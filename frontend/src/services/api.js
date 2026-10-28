
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const predictMachineFailure = async (sensorData) => {
  const response = await api.post("/predict", sensorData);
  return response.data;
};

export default api;
