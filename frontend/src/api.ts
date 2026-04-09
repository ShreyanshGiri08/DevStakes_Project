import type { Edge } from "@xyflow/react";
import type { TopicNodeType } from "./store/useStore";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api";

const isProd = import.meta.env.PROD;
const usingLocalhostApi =
  API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost");

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  if (isProd && usingLocalhostApi) {
    throw new Error(
      "Backend URL not configured. In Vercel → Settings → Environment Variables, set VITE_API_BASE_URL to your deployed API (e.g. https://your-api.onrender.com/api), then redeploy."
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new Error(
      "Cannot reach API. Deploy the FastAPI backend (Render/Railway/etc.), set VITE_API_BASE_URL on Vercel, and allow your Vercel domain in backend CORS."
    );
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    detail?: unknown;
  };

  if (!res.ok) {
    const detail = data.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? JSON.stringify(detail)
          : res.statusText || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function loginUser(email: string) {
  const data = await apiJson<{ user: { email: string; display_name: string | null; photo_url: string | null; xp: number; streak_days: number; level: number } }>(
    `${API_BASE}/auth/login`,
    { method: "POST", body: JSON.stringify({ email }) }
  );
  if (!data.user?.email) {
    throw new Error("Invalid login response from server.");
  }
  return data;
}

export async function generateRoadmap(topic: string, email: string, time_minutes: number = 60) {
  return apiJson<{ id?: string; nodes: TopicNodeType[]; edges: Edge[] }>(`${API_BASE}/generate-roadmap`, {
    method: "POST",
    body: JSON.stringify({ topic, email, time_minutes }),
  });
}

export async function fetchHistory(email: string) {
  return apiJson<{ history: unknown[] }>(`${API_BASE}/history/${encodeURIComponent(email)}`);
}

export async function setupProfile(email: string, display_name: string, photo_url: string) {
  return apiJson<{
    user: {
      email: string;
      display_name: string | null;
      photo_url: string | null;
      xp: number;
      streak_days: number;
      level: number;
    };
  }>(`${API_BASE}/user/setup`, {
    method: "POST",
    body: JSON.stringify({ email, display_name, photo_url }),
  });
}

export async function syncProgress(email: string, xp: number) {
  return apiJson(`${API_BASE}/user/progress`, {
    method: "POST",
    body: JSON.stringify({ email, xp }),
  });
}

export async function chatTutor(message: string, topic: string) {
  return apiJson<{ reply: string }>(`${API_BASE}/ai-tutor/chat`, {
    method: "POST",
    body: JSON.stringify({ message, topic }),
  });
}

export async function generateNotes(title: string, topic_context: string) {
  return apiJson<{ notes: unknown; source?: string }>(`${API_BASE}/generate-notes`, {
    method: "POST",
    body: JSON.stringify({ title, topic_context }),
  });
}

export async function generateQuiz(title: string, topic_context: string) {
  return apiJson<{ quiz: unknown[]; source?: string }>(`${API_BASE}/generate-quiz`, {
    method: "POST",
    body: JSON.stringify({ title, topic_context }),
  });
}

export async function fetchSuggestions(topics: string[]) {
  return apiJson<{ suggestions: string[] }>(`${API_BASE}/suggestions`, {
    method: "POST",
    body: JSON.stringify({ topics }),
  });
}
