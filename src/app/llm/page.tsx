'use client';

import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/navbar";
import styles from "./llm.module.css";

type ChatMessage = {
  sender: "ai" | "user";
  text: string;
  time: string;
  id: number;
};

async function fetchGeminiResponse(userMessage: string): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage })
  });
  const data = await res.json();
  return data.aiText;
}

const welcomeMessage: ChatMessage = {
  sender: "ai",
  text:
    "Hi! I'm your AI study assistant for Introduction to Psychology. I have access to your Lecture 1 Notes and can help you understand concepts, answer questions, and create study materials. What would you like to know about today's lecture?",
  time: "Just now",
  id: 0,
};

const suggestedQuestionsArr = [
  "What are the main concepts in this lecture?",
  "Create a summary of key points",
  "Generate practice questions",
];

export default function LLMPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    if (!showScrollBtn) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, showScrollBtn]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handler = () => {
      const isNearBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      setShowScrollBtn(!isNearBottom);
    };
    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  async function handleSend(e?: React.FormEvent) {
  if (e) e.preventDefault();
  const message = input.trim();
  if (!message || isTyping) return;
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  setMessages((prev) => [
    ...prev,
    { sender: "user", text: message, time, id: Date.now() },
  ]);
  setInput("");
  setShowSuggestions(false);
  setIsTyping(true);

  // Call Gemini
  try {
    const aiText = await fetchGeminiResponse(message);
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: aiText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        id: Date.now() + 1,
      },
    ]);
  } catch (err) {
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "There was an error connecting to Gemini.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        id: Date.now() + 2,
      },
    ]);
  }
  setIsTyping(false);
}

  function handleSuggestionClick(question: string) {
    setInput(question);
  }

  function handleClearChat() {
    setMessages([welcomeMessage]);
    setShowSuggestions(true);
    setInput("");
  }

  function handleScrollToBottom() {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden ${styles.llmPageRoot}`}>
      <Navbar />
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center justify-between p-4 lg:p-6 pt-16 lg:pt-6 border-b border-[#d4dbe2] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#eaedf1] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V88H40ZM40,200V104H216v96Z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-[#101418] text-lg font-bold">Lecture 1 Notes</h1>
              <p className="text-[#5c728a] text-sm">Introduction to Psychology</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-[#5c728a] hover:text-[#101418] hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleClearChat}
              aria-label="Clear chat"
              title="Clear chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 ${styles.customScrollbar}`}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${styles.messageFadeIn}`}
              >
                <div className={`w-8 h-8 ${msg.sender === "user" ? "bg-[#dce7f3]" : "bg-[#eaedf1]"} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z"></path>
                  </svg>
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className={`bg-${msg.sender === "user" ? "[#f0f4f8]" : "gray-50"} rounded-2xl ${msg.sender === "user" ? "rounded-tr-md" : "rounded-tl-md"} p-4`}>
                    <p className="text-[#101418] text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <p className="text-[#5c728a] text-xs mt-2">{msg.time}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={`flex items-start gap-3 ${styles.messageFadeIn}`}>
                <div className="w-8 h-8 bg-[#eaedf1] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z"></path>
                  </svg>
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md p-4">
                    <div className={styles.typingIndicator}>
                      <div className={styles.typingDot}></div>
                      <div className={styles.typingDot}></div>
                      <div className={styles.typingDot}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <button
            className={`${styles.scrollToBottom} absolute bottom-4 right-4 bg-white border border-[#d4dbe2] text-[#5c728a] hover:text-[#101418] hover:bg-gray-50 p-2 rounded-full shadow-lg transition-colors ${!showScrollBtn ? styles.scrollToBottomHidden : ""}`}
            onClick={handleScrollToBottom}
            aria-label="Scroll to latest message"
            tabIndex={showScrollBtn ? 0 : -1}
            type="button"
            title="Scroll to latest message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"></path>
            </svg>
          </button>
          <div className="border-t border-[#d4dbe2] p-4 lg:p-6 bg-white">
            <div className="max-w-4xl mx-auto">
              <form className="flex items-end gap-3" onSubmit={handleSend}>
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask me anything about your course content..."
                    className="w-full min-h-[44px] max-h-32 px-4 py-3 pr-12 border border-[#d4dbe2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#dce7f3] focus:border-transparent text-[#101418] text-sm resize-none"
                    rows={1}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    aria-label="Type your message"
                  />
                  <button
                    className="absolute right-2 bottom-2 p-2 bg-[#eaedf1] hover:bg-[#dce7f3] disabled:bg-gray-100 disabled:text-gray-400 text-[#101418] rounded-lg transition-colors"
                    disabled={!input.trim() || isTyping}
                    type="submit"
                    aria-label="Send message"
                    title="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" transform="rotate(180 128 128)"></path>
                    </svg>
                  </button>
                </div>
              </form>
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestedQuestionsArr.map(question => (
                    <button
                      key={question}
                      className="suggestion-btn px-3 py-2 bg-gray-50 hover:bg-gray-100 text-[#101418] text-sm rounded-lg border border-[#d4dbe2] transition-colors"
                      type="button"
                      onClick={() => handleSuggestionClick(question)}
                      aria-label={`Use suggested question: ${question}`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}