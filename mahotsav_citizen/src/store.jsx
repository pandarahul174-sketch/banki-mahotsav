import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/site")
      .then(setSite)
      .catch(() => setSite(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ site, loading }), [site, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  return useContext(Ctx);
}
