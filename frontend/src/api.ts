const API_BASE = "http://127.0.0.1:8000/api";

export async function loginUser(email: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function generateRoadmap(topic: string, email: string, time_minutes: number = 60) {
  const res = await fetch(`${API_BASE}/generate-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, email, time_minutes })
  });
  return res.json();
}

export async function fetchHistory(email: string) {
  const res = await fetch(`${API_BASE}/history/${email}`);
  return res.json();
}

export async function setupProfile(email: string, display_name: string, photo_url: string) {
  const res = await fetch(`${API_BASE}/user/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, display_name, photo_url })
  });
  return res.json();
}

export async function syncProgress(email: string, xp: number) {
  const res = await fetch(`${API_BASE}/user/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, xp })
  });
  return res.json();
}

export async function chatTutor(message: string, topic: string) {
  const res = await fetch(`${API_BASE}/ai-tutor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, topic })
  });
  return res.json();
}

export async function generateNotes(title: string, topic_context: string) {
  const res = await fetch(`${API_BASE}/generate-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, topic_context })
  });
  return res.json();
}

export async function generateQuiz(title: string, topic_context: string) {
  const res = await fetch(`${API_BASE}/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, topic_context })
  });
  return res.json();
}

export async function fetchSuggestions(topics: string[]) {
  const res = await fetch(`${API_BASE}/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topics })
  });
  return res.json();
}
