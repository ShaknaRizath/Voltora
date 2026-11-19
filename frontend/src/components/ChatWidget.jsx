import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiSend, FiX, FiZap } from "react-icons/fi";

const SUGGESTIONS = ["Which laptop is best for gaming?", "How do repairs work?", "How do I check my warranty?"];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setMessages((prev) => [...prev, { text: content, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are a friendly assistant for a website called Voltora. Only answer simple general greetings or questions about mobiles, laptops, accessories, repair, warranty, and services. If asked about anything else, respond with: 'I'm here to assist only with Voltora's electronics and services 😊'. Keep answers short and plain.",
            },
            { role: "user", content },
          ],
          temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      );
      const reply = res.data.choices[0].message.content;
      setMessages((prev) => [...prev, { text: reply, sender: "bot" }]);
    } catch (err) {
      console.error("Groq API error:", err.response?.data || err.message);
      setMessages((prev) => [
        ...prev,
        {
          text:
            "Sorry, I couldn't reach the assistant. " +
            (err.response?.data?.error?.message || err.message || ""),
          sender: "bot",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex h-[32rem] max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-pop ring-1 ring-zinc-200"
          >
            <div className="flex items-center justify-between bg-zinc-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700">
                  <FiZap />
                </span>
                <div>
                  <p className="text-sm font-semibold">Voltora Assistant</p>
                  <p className="text-xs text-zinc-400">Ask about products, repairs & warranty</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="text-zinc-400 transition hover:text-white">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4 text-sm">
              {messages.length === 0 && (
                <div>
                  <p className="mb-3 text-zinc-600">Hi 👋 How can I help you today?</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.sender === "user"
                        ? "rounded-br-md bg-zinc-900 text-white"
                        : m.error
                        ? "rounded-bl-md bg-red-50 text-red-700 ring-1 ring-red-200"
                        : "rounded-bl-md bg-white text-zinc-800 ring-1 ring-zinc-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-zinc-200">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-zinc-100 bg-white p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 rounded-full border-0 bg-zinc-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-900 text-white transition hover:bg-brand-600 disabled:opacity-40"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open chat assistant"
            className="grid h-14 w-14 place-items-center rounded-full bg-zinc-900 text-white shadow-lift transition hover:scale-105 hover:bg-brand-600"
          >
            <FiMessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
