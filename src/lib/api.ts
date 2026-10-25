const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    let errorPayload: { error?: string } = {};

    if (text) {
      try {
        errorPayload = JSON.parse(text);
      } catch {
        errorPayload = { error: text };
      }
    }

    throw new Error(errorPayload.error || response.statusText || 'Request failed');
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};

export type AuthSessionResponse = {
  user: User | null;
};

export type CourseListResponse = {
  courses: Course[];
};

export type LectureNotesListResponse = {
  notes: LectureNote[];
};

export type LectureTextsResponse = {
  texts: Record<string, string>;
};

export const api = {
  auth: {
    register: (data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<AuthSessionResponse> =>
      fetchApi<AuthSessionResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    
    login: (data: { email: string; password: string }): Promise<AuthSessionResponse> =>
      fetchApi<AuthSessionResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    
    logout: (): Promise<{ success: boolean }> =>
      fetchApi<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    
    me: (): Promise<AuthSessionResponse> =>
      fetchApi<AuthSessionResponse>('/auth/me'),
  },

  courses: {
    list: (): Promise<CourseListResponse> =>
      fetchApi<CourseListResponse>('/courses'),
    
    create: (data: { name: string; code: string; instructor?: string; semester?: string; credits?: number; description?: string }): Promise<Course> =>
      fetchApi<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
    
    delete: (id: number): Promise<{ success: boolean }> =>
      fetchApi<{ success: boolean }>(`/courses/${id}`, { method: 'DELETE' }),
  },

  upload: {
    lectureNote: (file: File, courseId: number): Promise<{ note: LectureNote }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', String(courseId));
      
      return fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json() as Promise<{ note: LectureNote }>;
      });
    },
  },

  lectureNotes: {
    list: (courseId: number): Promise<LectureNotesListResponse> =>
      fetchApi<LectureNotesListResponse>(`/lecture-notes?courseId=${courseId}`),
    
    getTexts: (courseId: number): Promise<LectureTextsResponse> =>
      fetchApi<LectureTextsResponse>(`/lecture-notes/texts?courseId=${courseId}`),
    
    delete: (id: number): Promise<{ success: boolean }> =>
      fetchApi<{ success: boolean }>(`/lecture-notes/${id}/delete`, { method: 'DELETE' }),
    
    extractText: (file: File, courseId: number): Promise<{ text?: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', String(courseId));
      
      return fetch(`${API_BASE}/extract-text`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Text extraction failed');
        return res.json() as Promise<{ text?: string }>;
      });
    },
  },
};

export type Course = {
  id: number;
  user_id: number;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  description: string;
  created_at: string;
};

export type LectureNote = {
  id: number;
  file_name: string;
  created_at: string;
  url: string;
};
