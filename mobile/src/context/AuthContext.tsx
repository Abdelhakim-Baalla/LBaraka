import React, { createContext, useContext, useState } from 'react';

type AuthCtx = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ token: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  return (
    <Ctx.Provider value={{ token, login: setToken, logout: () => setToken(null) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
