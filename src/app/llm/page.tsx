'use client';

import React, { useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface GeminiError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

function isGeminiError(error: unknown): error is GeminiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'response' in error)
  );
}

// Extract text from .docx files
async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) {
      alert('Could not find document.xml in this DOCX file.');
      console.error('No document.xml found in DOCX file.');
      return '';
    }

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
    alert('Failed to extract text from DOCX file. Please try a different file.');
    console.error('DOCX extraction error:', err);
    return '';
  }
}

interface DocxFile {
  name: string;
  text: string;
}

const LLMPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [docxCollection, setDocxCollection] = useState<DocxFile[]>([]);

  const handleSend = async () => {
    if ((!input.trim() && !file) || !GEMINI_API_KEY) return;

    let userMessage = input;
    let parts = [{ text: input }];

    if (file) {
      let fileText = '';
      if (file.name.toLowerCase().endsWith('.docx')) {
        fileText = await extractDocxText(file);
        console.log('Extracted DOCX text:', fileText);
        if (!fileText.trim()) {
          setLoading(false);
          return; // Stop if extraction failed
        }
        // Add to DOCX collection if not already present
        if (!docxCollection.some(doc => doc.name === file.name)) {
          setDocxCollection(prev => [...prev, { name: file.name, text: fileText }]);
        }
      } else {
        fileText = await file.text();
        console.log('Plain file text:', fileText);
      }
      // If no input, just use file text
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
      // Optionally, you can send the docxCollection as context to Gemini here
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts }]
        }
      );
      const botReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      setChat(prev => [...prev, { role: 'gemini', content: botReply }]);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (isGeminiError(err)) {
        message = err.response?.data?.error?.message || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setChat(prev => [...prev, { role: 'gemini', content: 'Error: ' + message }]);
    } finally {
      setInput('');
      setFile(null);
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  return (
    <div className="max-w-3xl mx-auto min-h-screen flex flex-col bg-white rounded-2xl shadow-lg p-8 mt-10">
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

      {/* DOCX Collection Section */}
      {docxCollection.length > 0 && (
        <div className="mb-6 bg-indigo-50 rounded-lg p-4">
          <h3 className="font-bold text-indigo-700 mb-2 text-lg">DOCX Collection</h3>
          <ul className="list-disc pl-5 space-y-1 text-indigo-900 text-sm">
            {docxCollection.map(doc => (
              <li key={doc.name}>
                <span className="font-semibold">{doc.name}</span>
                <span className="ml-2 text-gray-500">
                  ({doc.text.slice(0, 60)}{doc.text.length > 60 ? '...' : ''})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-6 mb-4 min-h-[500px] max-h-[700px] flex flex-col gap-3">
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
    </div>
  );
};

export default LLMPage;