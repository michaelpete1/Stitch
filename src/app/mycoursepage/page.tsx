'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './mycoursepage.module.css';
import { supabase } from '../lib/supabaseClient'; // Use the singleton!

export type Course = {
  id: number;
  code: string;
  name: string;
  semester: string;
  instructor: string;
  credits: number;
  description: string;
};

// If you have a created_at column, you can use the order line below. Otherwise, remove it.
async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*');
    // .order('created_at', { ascending: false }); // Only use if your table has this column
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
    <div className={styles.pageBg}>
      <div className={styles.container}>
        <h1 className={`${styles.heading} animate-fade-in-down`}>My Courses</h1>

        {loading ? (
          <div className={`${styles.loading} animate-fade-in-up`}>
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className={`${styles.noCourses} animate-fade-in-up`}>
            <p className={styles.noCoursesText}>You have no courses yet.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className={`${styles.card} animate-fade-in-up ${styles['delay' + (idx > 9 ? 9 : idx)]}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <span className={styles.courseCode}>{course.code}</span>
                    <span className={styles.semester}>{course.semester}</span>
                  </div>
                  <h2 className={styles.cardTitle}>{course.name}</h2>
                  <div className={styles.instructor}>Instructor: {course.instructor}</div>
                  <div className={styles.credits}>
                    <span>Credits: {course.credits}</span>
                  </div>
                  <p className={styles.description}>{course.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  <Link href={`/courses/${course.id}`}>
                    <button className={styles.viewBtn}>
                      View Course
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`${styles.backBtnContainer} animate-fade-in-up`}>
          <Link href="/">
            <button className={styles.backBtn}>
              ← Back to Homepage
            </button>
          </Link>
        </div>
      </div>
      {/* Global animation styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
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