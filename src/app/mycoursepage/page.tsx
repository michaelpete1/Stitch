'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export type Course = {
  id: number;
  code: string;
  name: string;
  semester: string;
  instructor: string;
  credits: number;
  description: string;
};

async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*');
  if (error) {
    console.error('Error fetching courses:', error.message);
    return [];
  }
  return data as Course[];
}

export default function Mycoursespage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data);
      setLoading(false);
    }
    loadCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-8 px-2 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Modern Interactive Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-8 text-center tracking-tight drop-shadow-lg animate-fade-in-down">
          <span className="inline-block bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text">My Courses</span>
        </h1>

        {loading ? (
          <div className="text-center text-lg text-indigo-500 animate-fade-in-up py-20">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 animate-fade-in-up">
            <p className="text-xl text-indigo-400 mb-2">You have no courses yet.</p>
            <Link href="/add-course">
              <button className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105">
                Add a Course
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-transform duration-300 hover:scale-105 hover:shadow-2xl group border border-transparent hover:border-indigo-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-wide">{course.code}</span>
                  <span className="text-xs text-gray-400">{course.semester}</span>
                </div>
                <h2 className="text-2xl font-bold text-indigo-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">{course.name}</h2>
                <div className="text-indigo-500 font-semibold mb-1">Instructor: {course.instructor}</div>
                <div className="text-gray-500 mb-1">Credits: <span className="font-bold">{course.credits}</span></div>
                <p className="text-gray-700 mb-4">{course.description}</p>
                <div className="flex justify-end">
                  <Link href={`/courses/${course.id}`}>
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-semibold shadow hover:from-blue-500 hover:to-indigo-600 transition-transform duration-200 hover:scale-105">
                      View Course
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12 animate-fade-in-up">
          <Link href="/">
            <button className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition-transform duration-200 hover:scale-105">
              ← Back to Homepage
            </button>
          </Link>
        </div>
      </div>
      {/* Animations */}
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
  );
}