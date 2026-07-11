// In production, nginx serves this app and proxies /api/* to Django on the
// same origin, so a relative base URL works with no CORS setup needed.
// REACT_APP_API_BASE_URL can override this for local (non-docker) dev.
const API_BASE = process.env.REACT_APP_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  list: () => request("/todos/"),
  create: (todo) => request("/todos/", { method: "POST", body: JSON.stringify(todo) }),
  update: (id, todo) => request(`/todos/${id}/`, { method: "PATCH", body: JSON.stringify(todo) }),
  toggle: (id) => request(`/todos/${id}/toggle/`, { method: "POST" }),
  remove: (id) => request(`/todos/${id}/`, { method: "DELETE" }),
};
