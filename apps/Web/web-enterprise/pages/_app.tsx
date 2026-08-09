import type { AppProps } from "next/app";
import "../styles/globals.css";
import { AuthProvider } from "../src/presentation/components/auth/auth-provider";
import { TooltipProvider } from "../src/components/ui/tooltip";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </TooltipProvider>
  );
}
