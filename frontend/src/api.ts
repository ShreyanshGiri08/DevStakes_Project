const API_BASE = "http://127.0.0.1:8000/api";

export async function loginUser(email: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function generateRoadmap(topic: string, email: string) {
  const res = await fetch(`${API_BASE}/generate-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, email })
  });
  return res.json();
}

export async function fetchHistory(email: string) {
  const res = await fetch(`${API_BASE}/history/${email}`);
  return res.json();
}
