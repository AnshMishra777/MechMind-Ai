
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">MechMind AI</h1>
      <p className="mt-2 text-slate-400">
        Intelligent Machine Troubleshooting & Predictive Maintenance
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 p-5">
          <p className="text-slate-400">System Status</p>
          <h2 className="mt-2 text-xl font-semibold">Ready to analyze</h2>
        </div>
        <Link to="/predict" className="rounded-xl border border-slate-700 p-5 hover:bg-slate-800">
          <h2 className="text-xl font-semibold">Fault Prediction</h2>
          <p className="mt-2 text-slate-400">Analyze machine readings</p>
        </Link>
        <Link to="/assistant" className="rounded-xl border border-slate-700 p-5 hover:bg-slate-800">
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <p className="mt-2 text-slate-400">Explore troubleshooting help</p>
        </Link>
      </div>
    </main>
  );
}
