import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

console.log("ANTIGRAVITY_BUILD_ID_9999");
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="korealty-theme">
    <App />
  </ThemeProvider>
);
