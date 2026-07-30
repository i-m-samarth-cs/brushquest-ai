const API_URL = 'http://localhost:3001/api';

export async function loginUser(username, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(username, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function fetchProgress(userId) {
  const response = await fetch(`${API_URL}/progress/${userId}`);
  const data = await response.json();
  if (!response.ok) return null; // Not found or error
  return data;
}

export async function saveProgressToBackend(userId, progressData) {
  const response = await fetch(`${API_URL}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, data: progressData }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to save progress');
  return data;
}
