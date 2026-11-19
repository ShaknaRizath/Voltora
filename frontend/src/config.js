// Single source of truth for the backend URL and small shared helpers.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Turns a stored upload path (e.g. "uploads\\123.png") into a full URL.
export const assetUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path) || path.startsWith("/")) return path;
  return `${API_URL}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

export const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

export const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Reads the user's role from the JWT payload (UI hint only: the server enforces permissions).
export const getRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || "user";
  } catch {
    return null;
  }
};

export const legacyAuthHeader = () => ({
  "x-auth-token": localStorage.getItem("token"),
});
