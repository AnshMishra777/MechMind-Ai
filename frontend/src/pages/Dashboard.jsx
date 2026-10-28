
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPredictionHistory } from "../services/api";

function StatCard({ title, value, color }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className={`mt-2 text-3xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({
    total: 0,
    predictions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPredictionHistory(100);

      setData({
        total: response.total ?? 0,
        predictions: response.predictions ?? [],
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load history. Check that FastAPI and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const predictions = data.predictions;

  const failures = predictions.filter(
    (item) => item.failure_prediction === 1
  ).length;

  const noFailures = predictions.filter(
    (item) => item.failure_prediction === 0
  ).length;

  const averageProbability = predictions.length
    ? predictions.reduce(
        (sum, item) => sum + (item.failure_probability ?? 0),
        0
      ) / predictions.length
    : 0;

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            MechMind AI / Overview
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Intelligent Machine Troubleshooting
          </h1>

          <p className="mt-2 text-slate-400">
            Monitor machine predictions and review saved sensor readings.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Predictions"
            value={loading ? "..." : data.total}
            color="text-cyan-400"
          />

          <StatCard
            title="Failures Predicted"
            value={loading ? "..." : failures}
            color="text-red-400"
          />

          <StatCard
            title="No Failure Predicted"
            value={loading ? "..." : noFailures}
            color="text-emerald-400"
          />

          <StatCard
            title="Average Failure Probability"
            value={
              loading
                ? "..."
                : `${(averageProbability * 100).toFixed(2)}%`
            }
            color="text-amber-400"
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-slate-400">System Status</p>
            <h2 className="mt-2 text-xl font-semibold">
              {loading
                ? "Loading..."
                : error
                  ? "Connection issue"
                  : "Ready to analyze"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {error || "Prediction history is connected to the backend."}
            </p>
          </div>

          <Link
            to="/predict"
            className="rounded-xl border border-slate-700 bg-slate-900 p-5 transition hover:border-cyan-500 hover:bg-slate-800"
          >
            <h2 className="text-xl font-semibold">Fault Prediction</h2>
            <p className="mt-2 text-slate-400">
              Analyze machine sensor readings
            </p>
          </Link>

          <Link
            to="/assistant"
            className="rounded-xl border border-slate-700 bg-slate-900 p-5 transition hover:border-cyan-500 hover:bg-slate-800"
          >
            <h2 className="text-xl font-semibold">AI Assistant</h2>
            <p className="mt-2 text-slate-400">
              Explore troubleshooting assistance
            </p>
          </Link>
        </section>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Recent Predictions
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest records retrieved from MongoDB
              </p>
            </div>

            <button
              onClick={loadHistory}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && predictions.length === 0 && (
            <p className="py-8 text-center text-slate-400">
              No saved predictions yet. Visit Fault Prediction to get started.
            </p>
          )}

          {predictions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="px-3 py-3">Timestamp</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Air Temp.</th>
                    <th className="px-3 py-3">Speed</th>
                    <th className="px-3 py-3">Torque</th>
                    <th className="px-3 py-3">Tool Wear</th>
                    <th className="px-3 py-3">Probability</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {predictions.map((item, index) => (
                    <tr
                      key={item._id ?? `${item.created_at}-${index}`}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-3 py-4 text-slate-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-3 py-4">{item.Type}</td>
                      <td className="px-3 py-4">
                        {item.air_temperature} K
                      </td>
                      <td className="px-3 py-4">
                        {item.rotational_speed} rpm
                      </td>
                      <td className="px-3 py-4">{item.torque} Nm</td>
                      <td className="px-3 py-4">{item.tool_wear} min</td>
                      <td className="px-3 py-4 text-cyan-400">
                        {(
                          (item.failure_probability ?? 0) * 100
                        ).toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.failure_prediction === 1
                              ? "bg-red-950 text-red-300"
                              : "bg-emerald-950 text-emerald-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Failure counts and average probability use the latest 100 records.
            Total Predictions counts all saved records.
          </p>
        </section>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          MechMind AI uses a model trained on synthetic data. Its predictions
          are estimates, not a substitute for industrial safety inspections.
        </p>
      </div>
    </main>
  );
}
