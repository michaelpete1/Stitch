import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

type Course = {
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: string;
  color: string;
  description: string;
};

// GET all courses
app.get('/courses', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST a new course
app.post('/courses', async (req: Request, res: Response) => {
  try {
    const course: Course = req.body;
    const { data, error } = await supabase.from('courses').insert([course]).select();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data?.[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Error handler middleware (optional, only if you want global error handling)
// Remove _next if you don't use it, or use `next` for future error handling
app.use((err: unknown, _req: Request, res: Response) => {
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Unknown error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Express API running on port ${PORT}`));