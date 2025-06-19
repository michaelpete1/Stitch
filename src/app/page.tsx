"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "./components/navbar";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient";

interface Course {
  id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
}

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase.from("courses").select("*").order("name");
    if (!error) setCourses(data || []);
    else console.error(error);
    setLoading(false);
  }

  function handleBrowseFilesClick() {
    fileInputRef.current?.click();
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-y-auto p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800">Dashboard</h1>
          <Link href="/mycoursepage" className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
            My Courses
          </Link>
        </header>

        {/* Course Tabs */}
        <nav className="mb-6">
          <div className="flex space-x-4 overflow-x-auto">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : courses.length ? (
              courses.map(course => (
                <button
                  key={course.id}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-indigo-50 transition whitespace-nowrap"
                >
                  {course.name}
                </button>
              ))
            ) : (
              <span className="text-gray-500">No courses available</span>
            )}
          </div>
        </nav>

        {/* Courses Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  
          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500">Loading courses...</div>
          ) : courses.length ? (
            courses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {course.code}
                    </span>
                    <span className="text-xs text-gray-500">{course.semester}</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">{course.name}</h2>
                  <p className="text-gray-600 mb-3">Instructor: {course.instructor}</p>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Credits: <strong>{course.credits}</strong></span>
                  <Link href={`/courses/${course.id}`} className="text-indigo-600 font-semibold hover:underline">
                    View Course →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">No courses to display.</div>
          )}
        </section>

        {/* Upload Section */}
        <section className="mt-10">
          <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Upload Course Content</h3>
            <p className="text-gray-600 mb-6">Drag & drop or click browse to upload files.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <button
                onClick={handleBrowseFilesClick}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                title="Browse files"
              >
                Browse Files
              </button>
              <label htmlFor="fileUploader" className="sr-only">Select course files</label>
              <input
                id="fileUploader"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesChange}
                title="Select files"
              />
              {selectedFiles && (
                <ul className="mt-4 text-gray-700 list-disc list-inside text-left">
                  {Array.from(selectedFiles).map(file => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* LLM Chat Button */}
        <section className="mt-10 text-center">
          <Link href="/llm" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Open LLM Chat
          </Link>
        </section>
      </main>
    </div>
  );
}
