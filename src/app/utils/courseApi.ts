import { api } from '@/lib/api';

export type Course = {
  id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
};

// Compatibility exports for older imports; all data access now goes through
// the authenticated same-origin Next.js API instead of a browser Supabase key.
export async function fetchCourses(): Promise<Course[]> {
  return (await api.courses.list()).courses;
}

export async function createCourse(course: Omit<Course, 'id'>, _legacyUserId: string) {
  await api.courses.create(course);
}

export async function deleteCourse(courseId: number): Promise<void> {
  await api.courses.delete(courseId);
}

export async function deleteLectureNote(courseId: number, fileName: string): Promise<void> {
  const { notes } = await api.lectureNotes.list(courseId);
  const note = notes.find((item) => item.file_name === fileName);
  if (!note) throw new Error('Lecture note not found');
  await api.lectureNotes.delete(note.id);
}
