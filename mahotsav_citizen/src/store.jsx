import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, loadCart, saveCart, setToken } from "./api";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [site, setSite] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(loadCart);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!getToken());

  async function refresh() {
    const data = await api("/api/site");
    setSite(data);
  }

  useEffect(() => {
    refresh()
      .catch(() => setSite(null))
      .finally(() => setLoading(false));
    const token = getToken();
    if (token) {
      api("/api/me")
        .then((d) => setUser(d.user))
        .catch(() => {
          setToken(null);
          setUser(null);
        })
        .finally(() => setAuthReady(true));
    }
  }, []);

  useEffect(() => saveCart(cart), [cart]);

  const value = useMemo(
    () => ({
      site,
      loading,
      refresh,
      authReady,
      user,
      setUser,
      cart,
      addToCart(item) {
        setCart((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
          return [...prev, { ...item, qty: 1 }];
        });
      },
      updateQty(id, qty) {
        setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)).filter((p) => p.qty > 0));
      },
      clearCart() {
        setCart([]);
      },
      logout() {
        setToken(null);
        setUser(null);
        setAuthReady(true);
      },
    }),
    [site, loading, user, cart, authReady]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  return useContext(Ctx);
}
