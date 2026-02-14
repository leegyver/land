import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

console.log("V15_HOOK_SAFE_SHELL");
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="korealty-theme">
    <App />
  </ThemeProvider>
);
