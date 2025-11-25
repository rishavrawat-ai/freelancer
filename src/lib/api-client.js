const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

// When running the frontend on localhost:5173 (Vite dev),
// default API calls to the local backend on port 5000 so
// onboarding can be tested entirely on localhost.
const safeWindow = typeof window === "undefined" ? null : window;
const localDevBaseUrl =
  safeWindow && safeWindow.location.origin === "http://localhost:5173"
    ? "http://localhost:5000/api"
    : null;

export const API_BASE_URL =
  normalizeBaseUrl(localDevBaseUrl || import.meta.env.VITE_API_BASE_URL) ||
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

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.data ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!isJsonResponse) {
    throw new Error(
      `Unexpected response from API (status ${response.status}). Verify VITE_API_BASE_URL points to the backend.`
    );
  }

  if (payload === null) {
    throw new Error("Received an empty response from the API. Please try again.");
  }

  return payload?.data ?? payload ?? {};
};

export const signup = ({
  fullName,
  email,
  password,
  role = "FREELANCER",
  freelancerProfile = null
}) => {
  const payload = {
    fullName,
    email,
    password,
    role,
    skills: []
  };

  if (role === "FREELANCER") {
    const normalizedProfile = freelancerProfile ?? {};
    const portfolio = normalizedProfile?.portfolio ?? {};
    const skills = Array.isArray(normalizedProfile?.skills)
      ? normalizedProfile.skills
      : [];

    payload.skills = skills;
    payload.freelancerProfile = {
      category: normalizedProfile?.category ?? "",
      specialty: normalizedProfile?.specialty ?? "",
      experience: normalizedProfile?.experience ?? "",
      portfolio: {
        portfolioUrl: portfolio?.portfolioUrl ?? "",
        linkedinUrl: portfolio?.linkedinUrl ?? ""
      },
      acceptedTerms: Boolean(normalizedProfile?.acceptedTerms)
    };
  }

  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const login = ({ email, password }) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
};

export const chat = ({ message, service, history = [] }) => {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, service, history })
  });
};

export const apiClient = {
  signup,
  login,
  chat
};
