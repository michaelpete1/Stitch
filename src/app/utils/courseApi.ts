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
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createCourse(course: Omit<Course, 'id'>) {
  const { error } = await supabase.from('courses').insert([course]);
  if (error) throw error;
}