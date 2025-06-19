"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import styles from "./AddCoursePage.module.css";

export default function AddCoursePage() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    instructor: "",
    semester: "",
    credits: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const creditsNumber = parseInt(form.credits, 10);
    if (isNaN(creditsNumber)) {
      setError("Credits must be a number.");
      setLoading(false);
      return;
    }
    const { name, code, instructor, semester, description } = form;
    const { error } = await supabase.from("courses").insert([
      {
        name,
        code,
        instructor,
        semester,
        credits: creditsNumber,
        description,
      },
    ]);
    setLoading(false);
    if (error) {
      setError("Failed to add course: " + error.message);
    } else {
      router.push("/mycoursepage");
    }
  }

  return (
    <div className={styles.pageBg}>
      <div className={`${styles.container} ${styles.fadeInUp}`}>
        <h1 className={`${styles.heading} ${styles.fadeInDown}`}>Add New Course</h1>
        <form
          onSubmit={handleSubmit}
          className={`${styles.form} ${styles.fadeInUp} ${styles.centeredForm}`}
        >
          <input
            className={styles.input}
            placeholder="Course Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className={styles.input}
            placeholder="Course Code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            required
          />
          <input
            className={styles.input}
            placeholder="Instructor"
            value={form.instructor}
            onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
            required
          />
          <input
            className={styles.input}
            placeholder="Semester"
            value={form.semester}
            onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
            required
          />
          <input
            className={styles.input}
            placeholder="Credits"
            type="number"
            min={1}
            max={20}
            value={form.credits}
            onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
            required
          />
          <textarea
            className={styles.textarea}
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
            rows={4}
          />
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={loading}
              className={styles.saveBtn}
            >
              {loading ? "Adding..." : "Add Course"}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => router.push("/mycoursepage")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}