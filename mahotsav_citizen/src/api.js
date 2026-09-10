const TOKEN = "bm_citizen_token";
const CART = "bm_cart";

export function getToken() {
  return localStorage.getItem(TOKEN);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN, token);
  else localStorage.removeItem(TOKEN);
}

export async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART, JSON.stringify(items));
}
