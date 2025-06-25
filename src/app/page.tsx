"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/navbar";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient";
import { FileObject } from '@supabase/storage-js';

interface Course {
  id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
}

interface LectureNote {
  id: string;
  name: string;
  url: string;
}

export default function HomePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [lectureNotes, setLectureNotes] = useState<LectureNote[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase.from("courses").select("*").order("name");
    if (!error) {
      setCourses(data || []);
      if (data && data.length > 0 && activeCourseId === null) {
        setActiveCourseId(data[0].id);
      }
    } else console.error(error);
  }, [activeCourseId]);

  useEffect(() => {
    // Check if user is authenticated
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error || !session) {
          router.push("/signuppage");
        } else {
          fetchCourses();
        }
      } catch {
        router.push("/signuppage");
      }
    };

    checkSession();
  }, [router, fetchCourses]);

  // Fetch lecture notes for the active course
  useEffect(() => {
    if (activeCourseId) {
      fetchLectureNotes(activeCourseId);
    } else {
      setLectureNotes([]);
    }
  }, [activeCourseId]);

  async function fetchLectureNotes(courseId: number) {
    // List files in the lecture-notes bucket for this course
    const { data, error } = await supabase.storage.from('lecture-notes').list(`${courseId}/`);
    if (error) {
      setLectureNotes([]);
      return;
    }
    const notes = (data as FileObject[] || []).map((file) => ({
      id: file.id || file.name,
      name: file.name,
      url: supabase.storage.from('lecture-notes').getPublicUrl(`${courseId}/${file.name}`).data.publicUrl
    }));
    setLectureNotes(notes);
  }

  async function handleLectureNoteUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !activeCourseId) return;
    setUploading(true);
    const file = fileInputRef.current.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found');
      setUploading(false);
      return;
    }
    const filePath = `${user.id}/${file.name}`;
    const { error } = await supabase.storage.from('lecture-notes').upload(filePath, file, { upsert: true });
    setUploading(false);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      fetchLectureNotes(activeCourseId);
      fileInputRef.current.value = '';
    }
  }

  const activeCourse = courses.find(c => c.id === activeCourseId);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-y-auto p-6 pt-16 md:pt-6">
        <header className="flex items-center justify-between mb-8 animate-fade-in-down">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight drop-shadow-lg animate-fade-in-down">Course Center</h1>
          <Link href="/mycoursepage" className="inline-block px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105">
            My Courses
          </Link>
        </header>

        {/* Course List */}
        <div className="flex w-full overflow-x-auto border-b border-indigo-200 mb-6">
          {courses.map(course => (
            <button
              key={course.id}
              className={`px-4 py-2 -mb-px font-semibold whitespace-nowrap border-b-2 transition-all duration-300
                ${activeCourseId === course.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-700 hover:text-indigo-500 hover:border-indigo-300'
                }`}
              onClick={() => setActiveCourseId(course.id)}
            >
              {course.name}
            </button>
          ))}
        </div>

        {/* Active Course Details & Lecture Notes */}
        {activeCourse && (
          <section className="mb-10 animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-indigo-700 animate-fade-in-down">{activeCourse.name}</h2>
              <p className="mb-1 text-gray-700"><strong>Lecturer:</strong> {activeCourse.instructor}</p>
              <p className="mb-1 text-gray-700"><strong>Semester:</strong> {activeCourse.semester}</p>
              <p className="mb-1 text-gray-700"><strong>Credits:</strong> {activeCourse.credits}</p>
              <p className="mb-4 text-gray-600"><strong>Description:</strong> {activeCourse.description}</p>

              {/* Upload Lecture Note */}
              <form onSubmit={handleLectureNoteUpload} className="flex flex-col sm:flex-row items-center gap-3 mb-6 animate-fade-in-up">
                <label className="sr-only" htmlFor="lecture-note-upload">Upload lecture note</label>
                <input
                  id="lecture-note-upload"
                  type="file"
                  ref={fileInputRef}
                  className="block border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.md,.rtf,.odt,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.zip,.rar,.7z,.tar,.gz,.mp3,.mp4,.wav,.avi,.mov,.mkv,.json,.xml,.html,.js,.ts,.tsx,.py,.java,.c,.cpp,.cs,.rb,.go,.php,.sh,.bat,.ps1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Lecture Note'}
                </button>
              </form>

              {/* List of Lecture Notes */}
              <div>
                <h3 className="font-semibold mb-2 text-indigo-700 animate-fade-in-down">Lecture Notes</h3>
                {lectureNotes.length === 0 ? (
                  <p className="text-gray-500">No lecture notes uploaded yet.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {lectureNotes.map(note => (
                      <li key={note.id} className="transition-all duration-300 hover:scale-105">
                        <a href={note.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{note.name}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* LLM/Chat Placeholder */}
            <div className="p-6 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl shadow text-center animate-fade-in-up mt-6">
              <h3 className="text-lg font-bold mb-2 text-indigo-700">LLM Chat (Coming Soon)</h3>
              <p className="text-gray-600">This area will allow you to interact with the LLM using the uploaded lecture notes for this course.</p>
            </div>
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4,0,0.2,1) both;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </div>
  );
}

