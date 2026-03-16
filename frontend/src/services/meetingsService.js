const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const meetingsService = {
  getAll: () => request("/api/meetings"),

  getById: (id) => request(`/api/meetings/${id}`),

  create: (payload) =>
    request("/api/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  remove: (id) => request(`/api/meetings/${id}`, { method: "DELETE" }),

  updateActionItem: (meetingId, itemId, payload) =>
    request(`/api/meetings/${meetingId}/action-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
