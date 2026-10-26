import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

dotenv.config();

const app = express();
const allowedOrigin = process.env.LEGACY_BACKEND_ALLOWED_ORIGIN;
app.use(cors({ origin: allowedOrigin || false, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '16kb', strict: true }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

app.use((req, res, next) => {
  const expected = process.env.LEGACY_BACKEND_API_TOKEN;
  const supplied = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : '';
  if (!expected || expected.length < 32) {
    res.status(503).json({ error: 'Legacy API is disabled until a secure server token is configured' });
    return;
  }
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  if (expectedBytes.length !== suppliedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

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
    if (!supabase) { res.status(503).json({ error: 'Course storage is not configured' }); return; }
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
      console.error('Legacy course query failed:', error.code ?? 'unknown error');
      res.status(500).json({ error: 'Could not load courses' });
      return;
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Could not load courses' });
  }
});

// POST a new course
app.post('/courses', async (req: Request, res: Response) => {
  try {
    if (!supabase) { res.status(503).json({ error: 'Course storage is not configured' }); return; }
    const body = req.body as Partial<Course>;
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.code !== 'string' || !body.code.trim() || body.code.length > 40) {
      res.status(400).json({ error: 'A valid course name and code are required' });
      return;
    }
    const course: Course = {
      name: body.name.trim(), code: body.code.trim(),
      instructor: typeof body.instructor === 'string' ? body.instructor.slice(0, 120) : '',
      semester: typeof body.semester === 'string' ? body.semester.slice(0, 80) : '',
      credits: Number.isFinite(body.credits) ? String(Number(body.credits)) : '0',
      color: typeof body.color === 'string' ? body.color.slice(0, 32) : '',
      description: typeof body.description === 'string' ? body.description.slice(0, 2_000) : '',
    };
    const { data, error } = await supabase.from('courses').insert([course]).select();
    if (error) {
      console.error('Legacy course insert failed:', error.code ?? 'unknown error');
      res.status(500).json({ error: 'Could not create course' });
      return;
    }
    res.status(201).json(data?.[0]);
  } catch {
    res.status(500).json({ error: 'Could not create course' });
  }
});

// Error handler middleware (optional, only if you want global error handling)
// Remove _next if you don't use it, or use `next` for future error handling
app.use((err: unknown, _req: Request, res: Response, _next: (error?: unknown) => void) => {
  console.error('Legacy API request failed:', err instanceof Error ? err.name : 'unknown error');
  res.status(400).json({ error: 'Invalid request' });
});

const PORT = Number.parseInt(process.env.PORT || '4000', 10);
if (process.env.ENABLE_LEGACY_EXPRESS_API === 'true') {
  app.listen(PORT, '127.0.0.1', () => console.log(`Legacy Express API listening on localhost:${PORT}`));
}
