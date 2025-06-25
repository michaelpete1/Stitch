"use client";

import React, { useState } from "react";
import axios from "axios";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

function isGeminiError(
  error: unknown
): error is { response?: { data?: { error?: { message?: string } } }; message?: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

const LLMChat: React.FC<{ context?: string }> = ({ context }) => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !GEMINI_API_KEY) return;

    let userMessage = input;
    let parts = [] as { text: string }[];

    // Add context (lecture notes) if provided
    if (context && context.trim()) {
      userMessage = `Lecture Notes Context:\n${context}\n\n${input}`;
      parts.push({ text: `Lecture Notes Context:\n${context}` });
      parts.push({ text: input });
    } else {
      parts = [{ text: input }];
    }

    setChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        { contents: [{ parts }] }
      );
      const botReply =
        (response.data as GeminiResponse)?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response";
      setChat((prev) => [...prev, { role: "gemini", content: botReply }]);
    } catch (err: unknown) {
      let errorMsg = "An unknown error occurred";
      if (isGeminiError(err)) {
        errorMsg = err.response?.data?.error?.message || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setChat((prev) => [...prev, { role: "gemini", content: "Error: " + errorMsg }]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col bg-white rounded-2xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full px-3 py-1 font-bold shadow">��</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-400 tracking-widest text-center animate-fade-in-down">
          STITCH.G
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-indigo-50/60 rounded-lg p-4 mb-4 min-h-[250px] max-h-[350px] flex flex-col gap-3 transition-all duration-300">
        {chat.length === 0 && (
          <div className="text-gray-400 text-center mt-10 animate-fade-in-up">Start the conversation with STITCH.G!</div>
        )}
        {chat.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
            <div className={`rounded-xl px-4 py-2 max-w-[80%] shadow transition-all duration-200 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-900 border border-indigo-100"}`}>
              <div className="text-xs font-semibold opacity-70 mb-1">{msg.role === "user" ? "You" : "STITCH.G"}</div>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="rounded-xl px-4 py-2 bg-white text-gray-900 max-w-[80%] shadow border border-indigo-100">
              <div className="text-xs font-semibold opacity-70 mb-1">STITCH.G</div>
              <div>Typing...</div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask STITCH.G anything..."
          className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-indigo-50/40 transition"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold disabled:bg-indigo-300 transition-transform duration-200 hover:scale-105 hover:from-indigo-600 hover:to-blue-600 shadow-lg"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </div>
  );
};

export default LLMChat; 