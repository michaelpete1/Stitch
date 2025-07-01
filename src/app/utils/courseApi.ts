import { createClient } from '@supabase/supabase-js';

export type Course = {
  id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function fetchCourses(): Promise<Course[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createCourse(course: Omit<Course, 'id'>, user_id: string) {
  if (!user_id) throw new Error('User ID is required');
  const { error } = await supabase.from('courses').insert([{ ...course, user_id }]);
  if (error) throw error;
}

export async function deleteCourse(courseId: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function deleteLectureNote(courseId: number, fileName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const filePath = `${user.id}/${courseId}/${fileName}`;
  const { error } = await supabase.storage.from('lecture-notes').remove([filePath]);
  if (error) throw error;
}