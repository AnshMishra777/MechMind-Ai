import { useState } from "react";
import { askMaintenanceAssistant } from "../services/api";

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm MechMind AI, your predictive maintenance assistant. Ask me about machine failures, temperature abnormalities, troubleshooting, or maintenance procedures.",
      sources: [],
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) return;

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const result = await askMaintenanceAssistant(trimmedQuestion);

      const assistantMessage = {
        role: "assistant",
        content: result.answer,
        sources: result.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to connect to MechMind AI. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm MechMind AI. How can I help you troubleshoot your machine today?",
        sources: [],
      },
    ]);

    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              AI Maintenance Assistant
            </h1>

            <p className="text-slate-400 mt-2 text-sm">
              Intelligent troubleshooting powered by RAG and Groq AI.
            </p>
          </div>

          <button
            onClick={clearChat}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
          >
            Clear Chat
          </button>
        </div>

        {/* Assistant Status */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>

          <div>
            <p className="font-semibold text-sm">MechMind AI</p>
            <p className="text-xs text-slate-400">
              Maintenance knowledge base connected
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-4 md:p-6 space-y-6">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="max-w-[90%] md:max-w-[80%]">

                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-2 opacity-70">
                      {message.role === "user" ? "You" : "MechMind AI"}
                    </p>

                    <div className="text-sm leading-7 whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>

                  {/* Sources */}
                  {message.role === "assistant" &&
                    message.sources?.length > 0 && (
                      <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-400 mb-2">
                          Knowledge Sources
                        </p>

                        {message.sources.map((source, sourceIndex) => (
                          <div
                            key={sourceIndex}
                            className="text-xs text-slate-400 mb-1"
                          >
                            📄 {source.document} — Page {source.page}
                          </div>
                        ))}
                      </div>
                    )}

                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300">
                  <span className="animate-pulse">
                    MechMind AI is analysing your question...
                  </span>
                </div>
              </div>
            )}

            <div />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 p-4 flex gap-3"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about machine failures, overheating, maintenance..."
              className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold transition"
            >
              {loading ? "..." : "Send"}
            </button>
          </form>

        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-500 mt-5">
          AI-generated maintenance guidance. Always follow approved safety
          procedures and manufacturer recommendations.
        </p>

      </div>
    </main>
  );
}