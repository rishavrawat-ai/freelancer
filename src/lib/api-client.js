const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

// Prefer local dev when on localhost, then explicit env, then same-origin (for deployed frontends),
// then local dev fallback.
const safeWindow = typeof window === "undefined" ? null : window;
const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const envSocketUrl = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
const envSocketPath = import.meta.env.VITE_SOCKET_PATH;

const sameOriginBaseUrl =
  safeWindow && safeWindow.location.origin && safeWindow.location.origin !== "http://localhost:5173"
    ? `${safeWindow.location.origin}/api`
    : null;

const localDevBaseUrl =
  safeWindow && safeWindow.location.origin === "http://localhost:5173"
    ? "http://localhost:5000/api"
    : null;

export const API_BASE_URL =
  (safeWindow && safeWindow.location.origin === "http://localhost:5173"
    ? normalizeBaseUrl(localDevBaseUrl)
    : null) ||
  envBaseUrl ||
  normalizeBaseUrl(sameOriginBaseUrl) ||
  normalizeBaseUrl(localDevBaseUrl) ||
  "http://localhost:5000/api";

// Only enable sockets when explicitly configured or on localhost for dev.
const inferredSocketUrl =
  envSocketUrl ||
  (safeWindow && safeWindow.location.hostname === "localhost"
    ? API_BASE_URL.replace(/\/api$/, "")
    : null);

const inferredSocketPath = envSocketPath || "/socket.io";

export const SOCKET_IO_URL = inferredSocketUrl;
export const SOCKET_ENABLED = Boolean(inferredSocketUrl);
export const SOCKET_OPTIONS = {
  transports: ["polling"], // prevent websocket upgrade on hosts that do not support it (e.g., Vercel serverless)
  upgrade: false, // keep the transport stable so it works globally
  withCredentials: true,
  path: inferredSocketPath,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000
};

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

export const createChatConversation = ({ service, ...rest }) => {
  return request("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ service, ...rest })
  });
};

export const fetchChatMessages = (conversationId) => {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "GET"
  });
};

export const sendChatMessage = ({
  conversationId,
  content,
  service,
  senderId,
  senderRole,
  senderName,
  skipAssistant = true
}) => {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      service,
      senderId,
      senderRole,
      senderName,
      skipAssistant
    })
  });
};

export const listFreelancers = (params = {}) => {
  const query = new URLSearchParams({ role: "FREELANCER", ...params }).toString();
  return request(`/users?${query}`, {
    method: "GET"
  });
};

export const apiClient = {
  signup,
  login,
  chat,
  createChatConversation,
  fetchChatMessages,
  sendChatMessage
};
