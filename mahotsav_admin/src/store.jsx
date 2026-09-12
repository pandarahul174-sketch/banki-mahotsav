import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!getToken());

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api("/api/me")
      .then((d) => setUser(d.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  const value = useMemo(
    () => ({
      authReady,
      user,
      setUser,
      logout() {
        setToken(null);
        setUser(null);
        setAuthReady(true);
      },
    }),
    [user, authReady]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  return useContext(Ctx);
}
