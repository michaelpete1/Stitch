'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from "../lib/supabaseClient";
import LLMChat from "../components/LLMChat";

// Type definitions
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

const LLMPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lectureNotes, setLectureNotes] = useState<LectureNote[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase.from('courses').select('*').order('name');
      if (!error && data) {
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourse(data[0]);
        }
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchLectureNotes(courseId: number) {
      const listPath = `${courseId}/`;
      const { data, error } = await supabase.storage.from('lecture-notes').list(listPath);
      if (error) {
        setLectureNotes([]);
        return;
      }
      const notes = (data as { id?: string; name: string }[] || []).map((file) => ({
        id: file.id || file.name,
        name: file.name,
        url: supabase.storage.from('lecture-notes').getPublicUrl(`${courseId}/${file.name}`).data.publicUrl
      }));
      setLectureNotes(notes);
    }
    if (selectedCourse) {
      fetchLectureNotes(selectedCourse.id);
    }
  }, [selectedCourse]);

  async function handleLectureNoteUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !selectedCourse) return;
    const file = fileInputRef.current.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found');
      return;
    }
    const filePath = `${selectedCourse.id}/${file.name}`;
    const { error } = await supabase.storage.from('lecture-notes').upload(filePath, file, { upsert: true });
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const listPath = `${selectedCourse.id}/`;
      const { data } = await supabase.storage.from('lecture-notes').list(listPath);
      const notes = (data as { id?: string; name: string }[] || []).map((file) => ({
        id: file.id || file.name,
        name: file.name,
        url: supabase.storage.from('lecture-notes').getPublicUrl(`${selectedCourse.id}/${file.name}`).data.publicUrl
      }));
      setLectureNotes(notes);
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 font-sans">
      <main className="flex flex-col items-center px-2 pt-8 pb-16">
        {/* Header */}
        <header className="w-full max-w-4xl flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full p-2 shadow-lg">
              <span className="text-white text-2xl font-bold">🧵</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-400 tracking-tight drop-shadow-lg text-center animate-fade-in-down">
              STITCH.G
            </h1>
          </div>
          <Link href="/mycoursepage" className="mt-4 inline-block px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105">
            My Courses
          </Link>
        </header>

        {/* Course Tabs */}
        <div className="w-full max-w-3xl mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {courses.map((course: Course) => (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedCourse(course);
                }}
                className={`
                  px-6 py-3 font-semibold transition-all duration-200
                  ${selectedCourse?.id === course.id
                    ? 'border-b-4 border-indigo-500 text-indigo-700 bg-indigo-50 shadow'
                    : 'text-gray-600 hover:text-indigo-500 hover:bg-gray-100'}
                  focus:outline-none rounded-t-lg
                `}
              >
                {course.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Course Details & Upload */}
          <section className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <span className="material-icons text-indigo-400">menu_book</span>
              {selectedCourse?.name}
            </h2>
            <div className="text-gray-700">
              <p><span className="font-semibold">Lecturer:</span> {selectedCourse?.instructor}</p>
              <p><span className="font-semibold">Semester:</span> {selectedCourse?.semester}</p>
              <p><span className="font-semibold">Credits:</span> {selectedCourse?.credits}</p>
              <p><span className="font-semibold">Description:</span> {selectedCourse?.description}</p>
            </div>
            {/* Upload */}
            <form onSubmit={handleLectureNoteUpload} className="flex flex-col sm:flex-row items-center gap-3">
              <label htmlFor="lecture-note-upload" className="sr-only">Upload lecture note</label>
              <input
                id="lecture-note-upload"
                type="file"
                ref={fileInputRef}
                className="block border border-gray-300 rounded px-3 py-2 text-sm"
                required
                placeholder="Choose file"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 transition"
              >
                Upload Lecture Note
              </button>
            </form>
            {/* Lecture Notes */}
            <div>
              <h3 className="text-indigo-600 font-semibold mb-2">Lecture Notes</h3>
              <ul className="space-y-2">
                {lectureNotes.length > 0 ? (
                  lectureNotes.map(note => (
                    <li key={note.id} className="flex items-center gap-2">
                      <span className="material-icons text-blue-400">description</span>
                      <a href={note.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                        {note.name}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No notes uploaded yet.</li>
                )}
              </ul>
            </div>
          </section>

          {/* STITCH.G Chat */}
          <section className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full px-3 py-1 font-bold shadow">🧵</span>
              <h2 className="text-xl font-bold text-indigo-700 tracking-widest">STITCH.G</h2>
            </div>
            <LLMChat context={lectureNotes.map(n => n.name).join(' ')} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default LLMPage;
