"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "./components/navbar";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient"; // Use singleton client!

type Course = {
  id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
};

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
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("name");
    if (!error) {
      setCourses(data || []);
    } else {
      setCourses([]);
      console.error(error);
    }
    setLoading(false);
  }

  function handleBrowseFilesClick() {
    fileInputRef.current?.click();
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans homepageRoot">
      <Navbar />
      <main className="flex-1 flex flex-col min-w-0 customScrollbar overflow-y-auto fadeIn">
        <div className="flex justify-between items-center p-4 lg:p-6 pt-16 lg:pt-6 slideUp delay1">
          <h1 className="text-[#101418] text-2xl lg:text-3xl font-bold">
            Welcome
          </h1>
          <Link href="/mycoursepage">
            <button
              className="bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 pop"
            >
              My Courses
            </button>
          </Link>
        </div>
        {/* Course Tabs */}
        <div className="border-b border-[#e4e8ef] px-4 lg:px-6 slideUp delay2">
          <div className="flex gap-4 lg:gap-8 overflow-x-auto scrollbarHide">
            {loading ? (
              <span className="text-[#5c728a]">Loading...</span>
            ) : courses.length === 0 ? (
              <span className="text-[#5c728a]">No courses yet</span>
            ) : (
              courses.map((course) => (
                <a
                  key={course.id}
                  className="flex-shrink-0 border-b-[3px] border-b-[#dce7f3] text-[#101418] pb-3 pt-2 pop"
                  href="#"
                >
                  <p className="text-sm font-bold">{course.name}</p>
                </a>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-6">
          <h2 className="text-[#101418] text-xl lg:text-2xl font-bold mb-4 slideUp delay3">
            Course Content
          </h2>
          {/* Course Cards */}
          {loading ? (
            <div className="text-center text-[#667eea] py-20">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center text-[#667eea] py-20">No courses to display.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className={`rounded-2xl bg-white shadow-lg overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up animate-delay-${idx * 2 + 1}`}
                >
                  <div className="p-6 flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-semibold text-xs">
                        {course.code}
                      </span>
                      <span className="ml-auto text-xs text-[#5c728a]">
                        {course.semester}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#101418] mb-1 font-sora">
                      {course.name}
                    </h2>
                    <div className="text-sm text-[#667eea] mb-2 font-semibold">
                      Instructor: {course.instructor}
                    </div>
                    <div className="flex items-center text-sm text-[#5c728a] mb-2">
                      <span>Credits: {course.credits}</span>
                    </div>
                    <p className="text-[#101418] text-sm mb-2">{course.description}</p>
                  </div>
                  <div className="p-6 pt-0 flex justify-end">
                    <Link href={`/courses/${course.id}`}>
                      <button className="px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold transition-colors duration-200 font-sora">
                        View Course
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* (Optional) Course Content Table and File Upload */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#e4e8ef] bg-white mb-6 fadeIn delay4">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-[#101418] text-sm font-medium">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[#101418] text-sm font-medium">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[#101418] text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[#5c728a] text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-t-[#e4e8ef] hover:bg-[#f8fafc]">
                  <td className="px-4 py-4 text-[#101418] text-sm">
                    Lecture 1 Notes
                  </td>
                  <td className="px-4 py-4 text-[#5c728a] text-sm">Notes</td>
                  <td className="px-4 py-4 text-[#5c728a] text-sm">
                    2024-08-15
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-[#5c728a] hover:text-[#101418] text-sm font-bold pop">
                      View
                    </button>
                  </td>
                </tr>
                <tr className="border-t border-t-[#e4e8ef] hover:bg-[#f8fafc]">
                  <td className="px-4 py-4 text-[#101418] text-sm">
                    Chapter 1 Summary
                  </td>
                  <td className="px-4 py-4 text-[#5c728a] text-sm">Summary</td>
                  <td className="px-4 py-4 text-[#5c728a] text-sm">
                    2024-08-16
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-[#5c728a] hover:text-[#101418] text-sm font-bold pop">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 mb-6 fadeIn delay4">
            <div className="bg-white rounded-lg border border-[#e4e8ef] p-4 pop">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[#101418] font-medium">Lecture 1 Notes</h3>
                <button className="text-[#5c728a] text-sm font-bold pop">
                  View
                </button>
              </div>
              <div className="flex justify-between text-sm text-[#5c728a]">
                <span>Notes</span>
                <span>2024-08-15</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-dashed border-[#e4e8ef] p-6 lg:p-12 text-center fadeIn delay5">
            <div className="max-w-md mx-auto">
              <h3 className="text-[#101418] text-lg font-bold mb-2">
                Upload Course Content
              </h3>
              <p className="text-[#101418] text-sm mb-6">
                Drag and drop files here, or browse
              </p>
              <button
                className="bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] px-6 py-2 rounded-xl text-sm font-bold transition-colors pop"
                type="button"
                onClick={handleBrowseFilesClick}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesChange}
                aria-label="Select files"
              />
              <div className="mt-4 text-left">
                {selectedFiles && selectedFiles.length > 0 && (
                  <div>
                    <span className="block text-[#5c728a] text-sm mb-1 font-semibold">
                      Selected files:
                    </span>
                    <ul className="list-disc ml-5 text-[#101418] text-sm">
                      {Array.from(selectedFiles).map((file) => (
                        <li key={file.name}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* LLM Chat Button */}
          <div className="flex justify-center mt-8">
            <Link href="/llm">
              <button className="bg-[#667eea] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#5a67d8] transition-colors">
                Open LLM Chat
              </button>
            </Link>
          </div>
        </div>
      </main>
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(0.4,0,0.2,1) both;}
        .animate-delay-1 { animation-delay: 0.1s; }
        .animate-delay-3 { animation-delay: 0.3s; }
        .animate-delay-5 { animation-delay: 0.5s; }
        .animate-delay-7 { animation-delay: 0.7s; }
      `}</style>
    </div>
  );
}