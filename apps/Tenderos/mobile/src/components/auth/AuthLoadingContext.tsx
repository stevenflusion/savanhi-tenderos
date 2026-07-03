import { createContext, useContext, useState, type ReactNode } from "react";

type AuthLoadingCtx = { loading: boolean; setLoading: (v: boolean) => void };

const AuthLoadingContext = createContext<AuthLoadingCtx>({
  loading: false,
  setLoading: () => {},
});

export const useAuthLoading = () => useContext(AuthLoadingContext);

type Props = { children: ReactNode };

export function AuthLoadingProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  return (
    <AuthLoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </AuthLoadingContext.Provider>
  );
}
