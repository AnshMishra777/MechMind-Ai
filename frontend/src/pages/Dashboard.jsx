// To start the server first activate env than type = python -m uvicorn backend.api.main:app --reload
import { useCallback, useEffect, useState } from "react";
import {
  getPredictionHistory,
  deletePrediction,
  clearPredictionHistory,
  getSystemHealth,
} from "../services/api";

import DashboardCharts from "../components/DashboardCharts";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthError, setHealthError] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setError("");
      const data = await getPredictionHistory();

      setHistory(data.predictions);
      setTotal(data.total);
    } catch (err) {
      setError("Unable to load prediction history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);



  const loadSystemHealth = useCallback(async () => {
    try {
      const data = await getSystemHealth();
      setSystemHealth(data);
      setHealthError(false);
    } catch (err) {
      setSystemHealth(null);
      setHealthError(true);
    }
  }, []);
    useEffect(() => {
    loadSystemHealth();

    const intervalId = setInterval(loadSystemHealth, 10000);

    return () => clearInterval(intervalId);
  }, [loadSystemHealth]);


  const handleDelete = async (predictionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prediction?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(predictionId);
      setError("");

      await deletePrediction(predictionId);
      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete this prediction."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to delete ALL prediction history? This cannot be undone."
  );

  if (!confirmed) return;

  try {
    setLoading(true);
    setError("");

    await clearPredictionHistory();
    await loadHistory();
  } catch (err) {
    setError(
      err.response?.data?.detail ||
        "Unable to clear prediction history."
    );
  } finally {
    setLoading(false);
  }
};

  const failures = history.filter(
    (item) => item.failure_prediction === 1
  ).length;

  const noFailures = history.filter(
    (item) => item.failure_prediction === 0
  ).length;

  const averageProbability = history.length
    ? (history.reduce(
        (sum, item) => sum + item.failure_probability,
        0
      ) / history.length) * 100
    : 0;

  const stats = [
    { label: "Total Predictions", value: total },
    { label: "Failures Predicted", value: failures },
    { label: "No Failure Predicted", value: noFailures },
    {
      label: "Average Failure Probability",
      value: `${averageProbability.toFixed(2)}%`,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">MechMind AI</h1>
          <p className="mt-2 text-slate-400">
            Intelligent Machine Troubleshooting & Predictive Maintenance
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <h2 className="mt-3 text-2xl font-bold">
                {stat.value}
              </h2>
            </div>
          ))}
        </section>
        <DashboardCharts history={history} />
<section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-semibold">System Health</h2>
      <p className="mt-1 text-sm text-slate-400">
        Live status of your application services
      </p>
    </div>

    <button
      onClick={loadSystemHealth}
      className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
    >
      Check Again
    </button>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    {[
      {
        label: "FastAPI Backend",
        key: "api",
        healthyValue: "online",
      },
      {
        label: "ML Model",
        key: "model",
        healthyValue: "loaded",
      },
      {
        label: "MongoDB",
        key: "database",
        healthyValue: "connected",
      },
    ].map((service) => {
      const value = systemHealth?.[service.key];
      const isHealthy = value === service.healthyValue;
      const isUnavailable = healthError || !systemHealth;

      return (
        <div
          key={service.key}
          className="rounded-xl border border-slate-800 bg-slate-950 p-4"
        >
          <p className="text-sm text-slate-400">{service.label}</p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isUnavailable
                  ? "bg-red-500"
                  : isHealthy
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
            />

            <span
              className={`text-sm font-semibold ${
                isUnavailable
                  ? "text-red-400"
                  : isHealthy
                    ? "text-emerald-400"
                    : "text-amber-400"
              }`}
            >
              {isUnavailable
                ? "Unavailable"
                : value.charAt(0).toUpperCase() + value.slice(1)}
            </span>
          </div>
        </div>
      );
    })}
  </div>

  {systemHealth && (
       <p className="mt-4 text-sm text-slate-400">
          Overall status:{" "}
          <span
            className={
            systemHealth.status === "healthy"
            ? "font-semibold text-emerald-400"
            : "font-semibold text-amber-400"
            }
          >
          {systemHealth.status.toUpperCase()}
          </span>
        </p>
        )}
      </section>


        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Prediction History
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                View and manage saved machine predictions.
              </p>
            </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            
             <button
              onClick={handleClearHistory}
              disabled={loading || history.length === 0}
              className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
              Clear History
              </button>
              </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-8 text-center text-slate-400">
              Loading predictions...
            </p>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              No predictions found. Run a prediction to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Machine</th>
                    <th className="px-4 py-3">Air Temp (K)</th>
                    <th className="px-4 py-3">Speed (rpm)</th>
                    <th className="px-4 py-3">Torque (Nm)</th>
                    <th className="px-4 py-3">Failure Probability</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-4 py-4">{item.Type}</td>
                      <td className="px-4 py-4">
                        {item.air_temperature}
                      </td>
                      <td className="px-4 py-4">
                        {item.rotational_speed}
                      </td>
                      <td className="px-4 py-4">{item.torque}</td>
                      <td className="px-4 py-4">
                        {(item.failure_probability * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            item.failure_prediction === 1
                              ? "text-red-400"
                              : "text-emerald-400"
                          }
                        >
                          {item.failure_prediction === 1
                            ? "Failure Predicted"
                            : "No Failure"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="rounded-lg bg-red-500/10 px-3 py-2 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
