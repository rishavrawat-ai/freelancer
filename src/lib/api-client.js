const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

const defaultHeaders = {
  "Content-Type": "application/json"
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.data ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
};

export const signup = ({ fullName, email, password, role = "FREELANCER" }) => {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      fullName,
      email,
      password,
      role,
      skills: []
    })
  });
};

export const login = ({ email, password }) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
};

export const apiClient = {
  signup,
  login
};
