"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AddCoursePage() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    instructor: "",
    semester: "",
    credits: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const creditsNumber = parseInt(form.credits, 10);
    if (isNaN(creditsNumber)) {
      setError("Credits must be a number.");
      setLoading(false);
      return;
    }
    const { name, code, instructor, semester, description } = form;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("courses").insert([
      {
        name,
        code,
        instructor,
        semester,
        credits: creditsNumber,
        description,
        user_id: user.id,
      },
    ]);
    setLoading(false);
    if (error) {
      setError("Failed to add course: " + error.message);
    } else {
      router.push("/mycoursepage");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center py-8 px-2 font-sans">
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-indigo-700 mb-8 tracking-tight drop-shadow-lg animate-fade-in-down">
          Add New Course
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400"
            placeholder="Course Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400"
            placeholder="Course Code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            required
          />
          <input
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400"
            placeholder="Instructor"
            value={form.instructor}
            onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
            required
          />
          <input
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400"
            placeholder="Semester"
            value={form.semester}
            onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
            required
          />
          <input
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400"
            placeholder="Credits"
            type="number"
            min={1}
            max={20}
            value={form.credits}
            onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
            required
          />
          <textarea
            className="px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 transition placeholder-gray-400 resize-none"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
            rows={4}
          />
          {error && <div className="text-red-600 font-semibold text-center animate-fade-in-up">{error}</div>}
          <div className="flex gap-4 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition-transform duration-200 hover:scale-105 disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Course"}
            </button>
            <button
              type="button"
              className="flex-1 px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition-transform duration-200 hover:scale-105"
              onClick={() => router.push("/mycoursepage")}
            >
              Cancel
            </button>
          </div>
        </form>
        <style jsx global>{`
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    </div>
  );
}