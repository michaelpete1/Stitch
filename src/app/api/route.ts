import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userMessage } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY; // Store your API key in an environment variable!
  const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;

  const body = {
    contents: [
      { parts: [{ text: userMessage }] }
    ]
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  // Gemini API returns content as data.candidates[0].content.parts[0].text
  const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

  return NextResponse.json({ aiText });
}