"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "./navbar";
import Link from "next/link";
import { api, Course, LectureNote } from "@/lib/api";
import LLMChat from "./LLMChat";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";

export default function HomeClient() {
  const { user, logout, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const courseIdFromQuery = searchParams.get("course");
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [lectureNotes, setLectureNotes] = useState<LectureNote[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lectureNoteTexts, setLectureNoteTexts] = useState<{
    [fileName: string]: string;
  }>({});
  const [chatPromptRequest, setChatPromptRequest] = useState<{ prompt: string; requestId: number } | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await api.courses.list();
      const loadedCourses = data.courses || [];
      setCourses(loadedCourses);
      if (data.courses && data.courses.length > 0 && activeCourseId === null) {
        setActiveCourseId(data.courses[0].id);
        setSelectedCourse(data.courses[0]);
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error("Failed to load courses");
    }
  }, [activeCourseId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCourses();
    }

    if (!authLoading && !user) {
      setCourses([]);
      setActiveCourseId(null);
      setSelectedCourse(null);
    }
  }, [fetchCourses, authLoading, user]);

  useEffect(() => {
    if (courses.length > 0 && courseIdFromQuery) {
      const id = parseInt(courseIdFromQuery, 10);
      const found = courses.find((c) => c.id === id);
      if (found) {
        setActiveCourseId(found.id);
        setSelectedCourse(found);
      }
    }
  }, [courses, courseIdFromQuery]);

  const fetchLectureNotes = useCallback(async (courseId: number) => {
    try {
      const [notesData, textsData] = await Promise.all([
        api.lectureNotes.list(courseId),
        api.lectureNotes.getTexts(courseId),
      ]);
      setLectureNotes(notesData.notes || []);
      setLectureNoteTexts(textsData.texts || {});
    } catch (error) {
      console.error("Fetch lecture notes error:", error);
      setLectureNotes([]);
      setLectureNoteTexts({});
    }
  }, []);

  useEffect(() => {
    if (activeCourseId) {
      fetchLectureNotes(activeCourseId);
    } else {
      setLectureNotes([]);
      setLectureNoteTexts({});
    }
  }, [activeCourseId, fetchLectureNotes]);

  async function handleLectureNoteUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !activeCourseId) return;
    setUploading(true);
    const file = fileInputRef.current.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Documents must be 10 MB or smaller.");
      fileInputRef.current.value = "";
      setUploading(false);
      return;
    }
    try {
      const result = await api.upload.lectureNote(file, activeCourseId);
      setLectureNotes((prev) => [...prev, result.note]);

      setExtracting(true);
      try {
        const extractResult = await api.lectureNotes.extractText(
          file,
          activeCourseId,
        );
        if (!extractResult.text?.trim()) {
          throw new Error("No readable text was found. Scanned PDFs need OCR before the AI can explain them.");
        }
        setLectureNoteTexts((prev) => ({ ...prev, [file.name]: extractResult.text || "" }));
      } catch (error) {
        setLectureNoteTexts((prev) => ({ ...prev, [file.name]: "" }));
        toast.error(`The file was uploaded, but its text could not be prepared: ${error instanceof Error ? error.message : "Unsupported or unreadable document."}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      } finally {
        setExtracting(false);
      }

      if (typeof activeCourseId === "number") {
        fetchLectureNotes(activeCourseId);
      }
      fileInputRef.current.value = "";
      toast.success("Document uploaded and ready for AI");
    } catch (error) {
      toast.error(
        "Upload failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setUploading(false);
    }
  }

  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const readyDocuments = lectureNotes
    .map((note) => ({ name: note.file_name, text: lectureNoteTexts[note.file_name]?.trim() }))
    .filter((document): document is { name: string; text: string } => Boolean(document.text));
  const documentContext = readyDocuments
    .map((document) => `Document: ${document.name}\n${document.text}`)
    .join("\n\n")
    .slice(0, 28_000);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LLMChat fullScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      <Toaster position="top-right" />
      <Navbar onLogout={logout} user={user} />
      <main className="flex-1 flex flex-col overflow-y-auto p-4 pt-16 md:pt-6">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 animate-fade-in-down gap-4">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight drop-shadow-lg animate-fade-in-down text-center sm:text-left">
            Course Center
          </h1>
          <Link
            href="/add-course"
            className="inline-block w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105 text-center"
          >
            Add Course
          </Link>
        </header>

        <div className="w-full max-w-3xl mx-auto mt-4 px-2 sm:px-4">
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar whitespace-nowrap">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`
                  px-4 sm:px-6 py-2 sm:py-3 min-w-[120px] sm:min-w-[160px] text-sm sm:text-base font-semibold transition
                  ${
                    selectedCourse?.id === course.id
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-500 hover:bg-gray-100"
                  }
                  focus:outline-none flex items-center justify-between
                `}
              >
                <button
                  type="button"
                  aria-pressed={selectedCourse?.id === course.id}
                  className="flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  onClick={() => {
                    setSelectedCourse(course);
                    setActiveCourseId(course.id);
                  }}
                >
                  {course.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${course.name}`}
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const toastId = toast.loading("Deleting course...");
                    try {
                      await api.courses.delete(course.id);
                      setCourses(courses.filter((c) => c.id !== course.id));
                      setSelectedCourse(null);
                      setActiveCourseId(null);
                      toast.success("Course deleted!", { id: toastId });
                    } catch (err: unknown) {
                      let message = "Delete failed.";
                      if (err instanceof Error)
                        message = "Delete failed: " + err.message;
                      toast.error(message, { id: toastId });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow">
            <h2 className="text-xl font-bold mb-2">{selectedCourse?.name}</h2>
            <p className="text-gray-700 mb-4">{selectedCourse?.code}</p>
            <p className="text-gray-500">{selectedCourse?.instructor}</p>
            <p className="text-gray-500">{selectedCourse?.semester}</p>
            <p className="text-gray-500">{selectedCourse?.credits}</p>
            <p className="text-gray-600">{selectedCourse?.description}</p>
          </div>
        </div>

        {activeCourse && (
          <section className="mb-10 animate-fade-in-up px-2 sm:px-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-indigo-700 animate-fade-in-down">
                {activeCourse.name}
              </h2>
              <p className="mb-1 text-gray-700">
                <span className="font-bold">Lecturer:</span>{" "}
                {activeCourse.instructor}
              </p>
              <p className="mb-1 text-gray-700">
                <span className="font-bold">Semester:</span>{" "}
                {activeCourse.semester}
              </p>
              <p className="mb-1 text-gray-700">
                <span className="font-bold">Credits:</span>{" "}
                {activeCourse.credits}
              </p>
              <p className="mb-4 text-gray-600">
                <span className="font-bold">Description:</span>{" "}
                {activeCourse.description}
              </p>

              <form
                onSubmit={handleLectureNoteUpload}
                className="flex flex-col sm:flex-row items-center gap-3 mb-6 animate-fade-in-up"
              >
                <label className="sr-only" htmlFor="lecture-note-upload">
                  Upload lecture note
                </label>
                <input
                  id="lecture-note-upload"
                  type="file"
                  ref={fileInputRef}
                  className="block border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-auto"
                  required
                  accept=".pdf,.docx,.txt"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow hover:from-indigo-600 hover:to-blue-600 transition-transform duration-300 hover:scale-105"
                  disabled={uploading || extracting}
                >
                  {uploading
                    ? "Uploading..."
                    : extracting
                      ? "Extracting text..."
                      : "Upload Lecture Note"}
                </button>
              </form>

              <div>
                <h3 className="font-semibold mb-2 text-indigo-700 animate-fade-in-down">
                  Lecture Notes
                </h3>
                {lectureNotes.length === 0 ? (
                  <p className="text-gray-500">
                    No lecture notes uploaded yet.
                  </p>
                ) : (
                  <ul className="list-disc list-inside">
                    {lectureNotes.map((note) => (
                      <li
                        key={note.id}
                        className="transition-all duration-300 hover:scale-105"
                      >
                        <a
                          href={note.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {note.file_name}
                        </a>
                        <button
                          type="button"
                          aria-label={`Delete ${note.file_name}`}
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={async () => {
                            if (activeCourseId !== null) {
                              const toastId = toast.loading("Deleting file...");
                              try {
                                await api.lectureNotes.delete(note.id);
                                setLectureNotes(
                                  lectureNotes.filter((n) => n.id !== note.id),
                                );
                                toast.success("File deleted!", { id: toastId });
                              } catch (err: unknown) {
                                let message = "Delete failed.";
                                if (err instanceof Error)
                                  message = "Delete failed: " + err.message;
                                toast.error(message, { id: toastId });
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600" aria-live="polite">
                  {readyDocuments.length > 0
                    ? `${readyDocuments.length} document${readyDocuments.length === 1 ? "" : "s"} ready to explain`
                    : "Upload a PDF, DOCX, or TXT document to ask the AI about its contents."}
                </p>
                <button
                  type="button"
                  disabled={!documentContext || uploading || extracting}
                  onClick={() => setChatPromptRequest({
                    prompt: "Explain my uploaded course documents in clear, simple language. Start with a short overview, then explain the key ideas and important terms, and finish with one practical example.",
                    requestId: Date.now(),
                  })}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Explain my documents
                </button>
              </div>
              <LLMChat
                context={documentContext}
                promptRequest={chatPromptRequest}
              />
            </div>
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
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
