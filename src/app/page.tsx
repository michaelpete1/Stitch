"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/navbar";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient";
import { FileObject } from '@supabase/storage-js';
import LLMChat from "./components/LLMChat";

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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase.from("courses").select("*").order("name");
    console.log("Fetched courses:", data, "Error:", error);
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
    const filePath = `${activeCourseId}/${file.name}`;
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-y-auto p-4 pt-16 md:pt-6">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 animate-fade-in-down gap-4">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight drop-shadow-lg animate-fade-in-down text-center sm:text-left">Course Center</h1>
          <Link href="/mycoursepage" className="inline-block w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105 text-center">
            My Courses
          </Link>
        </header>

        <div className="w-full max-w-3xl mx-auto mt-4 px-2 sm:px-4">
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar whitespace-nowrap">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedCourse(course);
                  setActiveCourseId(course.id);
                }}
                className={`
                  px-4 sm:px-6 py-2 sm:py-3 min-w-[120px] sm:min-w-[160px] text-sm sm:text-base font-semibold transition
                  ${selectedCourse?.id === course.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-100'}
                  focus:outline-none
                `}
              >
                {course.name}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow">
            {/* Show course details/notes here */}
            <h2 className="text-xl font-bold mb-2">{selectedCourse?.name}</h2>
            <p className="text-gray-700 mb-4">{selectedCourse?.code}</p>
            <p className="text-gray-500">{selectedCourse?.instructor}</p>
            <p className="text-gray-500">{selectedCourse?.semester}</p>
            <p className="text-gray-500">{selectedCourse?.credits}</p>
            <p className="text-gray-600">{selectedCourse?.description}</p>
            {/* Add more interactive content here */}
          </div>
        </div>

        {/* Active Course Details & Lecture Notes */}
        {activeCourse && (
          <section className="mb-10 animate-fade-in-up px-2 sm:px-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-indigo-700 animate-fade-in-down">{activeCourse.name}</h2>
              <p className="mb-1 text-gray-700"><span className="font-bold">Lecturer:</span> {activeCourse.instructor}</p>
              <p className="mb-1 text-gray-700"><span className="font-bold">Semester:</span> {activeCourse.semester}</p>
              <p className="mb-1 text-gray-700"><span className="font-bold">Credits:</span> {activeCourse.credits}</p>
              <p className="mb-4 text-gray-600"><span className="font-bold">Description:</span> {activeCourse.description}</p>

              {/* Upload Lecture Note */}
              <form onSubmit={handleLectureNoteUpload} className="flex flex-col sm:flex-row items-center gap-3 mb-6 animate-fade-in-up">
                <label className="sr-only" htmlFor="lecture-note-upload">Upload lecture note</label>
                <input
                  id="lecture-note-upload"
                  type="file"
                  ref={fileInputRef}
                  className="block border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                  required
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.md,.rtf,.odt,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.zip,.rar,.7z,.tar,.gz,.mp3,.mp4,.wav,.avi,.mov,.mkv,.json,.xml,.html,.js,.ts,.tsx,.py,.java,.c,.cpp,.cs,.rb,.go,.php,.sh,.bat,.ps1"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105"
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

            {/* LLM Chat Section */}
            <div className="mt-8">
              <LLMChat context={lectureNotes.map(note => `${note.name}: ${note.url}`).join("\n")} />
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
        /* Hide scrollbar utility */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

