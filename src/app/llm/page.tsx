'use client';

import React, { useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import Link from 'next/link';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

function isGeminiError(error: unknown): error is { response?: { data?: { error?: { message?: string } } }, message?: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) throw new Error('Missing document.xml in DOCX.');

    const xml = await parseStringPromise(documentXml);
    const paragraphs = xml['w:document']?.['w:body']?.[0]?.['w:p'] || [];
    const textArr: string[] = [];
    for (const p of paragraphs) {
      const runs = p['w:r'] || [];
      for (const r of runs) {
        const texts = r['w:t'] || [];
        for (const t of texts) {
          if (typeof t === 'string') textArr.push(t);
          else if (t._) textArr.push(t._);
        }
      }
    }
    return textArr.join(' ');
  } catch (err) {
    console.error('DOCX extraction error:', err);
    return '';
  }
}

const LLMPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if ((!input.trim() && !file) || !GEMINI_API_KEY) return;

    let userMessage = input;
    let parts = [{ text: input }];

    if (file) {
      let fileText = '';
      if (file.name.toLowerCase().endsWith('.docx')) {
        fileText = await extractDocxText(file);
        if (!fileText.trim()) {
          setChat(prev => [...prev, { role: 'gemini', content: 'Could not extract text from the uploaded DOCX file.' }]);
          return;
        }
      } else {
        fileText = await file.text();
      }
      if (!input.trim()) {
        userMessage = fileText;
        parts = [{ text: fileText }];
      } else {
        userMessage += `\n\nFile Content:\n${fileText}`;
        parts.push({ text: `File Content:\n${fileText}` });
      }
    }

    setChat(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        { contents: [{ parts }] }
      );
      const botReply = (response.data as GeminiResponse)?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      setChat(prev => [...prev, { role: 'gemini', content: botReply }]);
    } catch (err: unknown) {
      let errorMsg = 'An unknown error occurred';
      if (isGeminiError(err)) {
        errorMsg = err.response?.data?.error?.message || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setChat(prev => [...prev, { role: 'gemini', content: 'Error: ' + errorMsg }]);
    } finally {
      setInput('');
      setFile(null);
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-screen flex flex-col bg-white rounded-2xl shadow-lg p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">Gemini LLM Chat</h2>
      <div className="mb-4 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-gray-700">
          <span role="img" aria-label="upload">📎</span> Upload File:
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>
        {file && (
          <span className="text-sm text-gray-500 truncate max-w-xs">Selected: {file.name}</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 min-h-[250px] max-h-[350px] flex flex-col gap-3">
        {chat.length === 0 && (
          <div className="text-gray-400 text-center mt-10">Start the conversation with Gemini!</div>
        )}
        {chat.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-xl px-4 py-2 max-w-[80%] shadow ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-gray-900'}`}>
              <div className="text-xs font-semibold opacity-70 mb-1">{msg.role === 'user' ? 'You' : 'Gemini'}</div>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2 bg-indigo-100 text-gray-900 max-w-[80%] shadow">
              <div className="text-xs font-semibold opacity-70 mb-1">Gemini</div>
              <div>Typing...</div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Gemini anything..."
          className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
          disabled={loading}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold disabled:bg-indigo-300 transition"
          onClick={handleSend}
          disabled={loading || (!input.trim() && !file)}
        >
          Send
        </button>
      </div>
      <div className="mt-6 flex justify-center">
        <Link href="/" className="px-6 py-2 rounded-lg bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] font-semibold shadow transition-colors">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default LLMPage;
