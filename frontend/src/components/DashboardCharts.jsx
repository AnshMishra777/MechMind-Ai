
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#f87171", "#34d399"];

export default function DashboardCharts({ history }) {
  const failures = history.filter(
    (item) => item.failure_prediction === 1
  ).length;

  const noFailures = history.filter(
    (item) => item.failure_prediction === 0
  ).length;

  const distribution = [
    { name: "Failure Predicted", value: failures },
    { name: "No Failure", value: noFailures },
  ];

  const recentPredictions = [...history]
    .slice(0, 10)
    .reverse()
    .map((item, index) => ({
      name: `Prediction ${index + 1}`,
      probability: Number(
        (item.failure_probability * 100).toFixed(2)
      ),
      machine: item.Type,
    }));

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold text-white">
          Failure Distribution
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Breakdown of saved model predictions
        </p>

        {history.length === 0 ? (
          <p className="py-20 text-center text-slate-400">
            No prediction data available yet.
          </p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {distribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold text-white">
          Recent Failure Probabilities
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Probability scores for the latest saved predictions
        </p>

        {history.length === 0 ? (
          <p className="py-20 text-center text-slate-400">
            No prediction data available yet.
          </p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recentPredictions}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Failure probability"]}
                  labelStyle={{ color: "#0f172a" }}
                />
                <Bar
                  dataKey="probability"
                  fill="#22d3ee"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
