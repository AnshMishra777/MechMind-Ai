
import { useState } from "react";
import { predictMachineFailure } from "../services/api";

const initialValues = {
  Type: "M",
  air_temperature: "300",
  process_temperature: "310",
  rotational_speed: "1500",
  torque: "40",
  tool_wear: "100",
};

const fields = [
  {
    name: "air_temperature",
    label: "Air Temperature",
    unit: "K",
    min: 0.1,
    step: "any",
  },
  {
    name: "process_temperature",
    label: "Process Temperature",
    unit: "K",
    min: 0.1,
    step: "any",
  },
  {
    name: "rotational_speed",
    label: "Rotational Speed",
    unit: "rpm",
    min: 0.1,
    step: "any",
  },
  {
    name: "torque",
    label: "Torque",
    unit: "Nm",
    min: 0,
    step: "any",
  },
  {
    name: "tool_wear",
    label: "Tool Wear",
    unit: "min",
    min: 0,
    step: "any",
  },
];

export default function Predict() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const sensorData = {
        Type: values.Type,
        air_temperature: Number(values.air_temperature),
        process_temperature: Number(values.process_temperature),
        rotational_speed: Number(values.rotational_speed),
        torque: Number(values.torque),
        tool_wear: Number(values.tool_wear),
      };

      const prediction = await predictMachineFailure(sensorData);
      setResult(prediction);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to get a prediction. Check that the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            MechMind AI / Predictive Maintenance
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Machine Fault Prediction
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Enter machine sensor readings to estimate the likelihood of
            failure using your trained machine-learning model.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
          >
            <h2 className="mb-6 text-xl font-semibold">
              Machine Parameters
            </h2>

            <div className="mb-6">
              <label
                htmlFor="Type"
                className="mb-2 block text-sm text-slate-300"
              >
                Machine Type
              </label>

              <select
                id="Type"
                name="Type"
                value={values.Type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
              >
                <option value="L">L — Low</option>
                <option value="M">M — Medium</option>
                <option value="H">H — High</option>
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm text-slate-300"
                  >
                    {field.label}{" "}
                    <span className="text-slate-500">
                      ({field.unit})
                    </span>
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={field.min}
                    step={field.step}
                    required
                    value={values[field.name]}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing Machine..." : "Predict Machine Failure"}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              This is a prototype trained on synthetic data. Predictions
              are estimates and must not be used as a substitute for
              industrial safety inspections.
            </p>
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Prediction Results</h2>

            {!result && !error && (
              <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-slate-300">Awaiting sensor readings</p>
                <p className="mt-2 text-sm text-slate-500">
                  Submit the form to see the model's prediction.
                </p>
              </div>
            )}

            {loading && (
              <p className="mt-8 animate-pulse text-cyan-400">
                Analyzing sensor readings...
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300"
              >
                {error}
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-5">
                <div
                  className={`rounded-xl border p-5 ${
                    result.failure_prediction === 1
                      ? "border-red-700 bg-red-950/40"
                      : "border-emerald-700 bg-emerald-950/30"
                  }`}
                >
                  <p className="text-sm text-slate-300">Predicted Status</p>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      result.failure_prediction === 1
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {result.status}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">
                      Estimated Failure Probability
                    </p>

                    <p className="text-2xl font-bold text-cyan-400">
                      {(result.failure_probability * 100).toFixed(2)}%
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, result.failure_probability * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-400">
                  This result comes from the trained model and reflects
                  its estimate for the supplied readings, not a guarantee
                  of actual machine condition.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
