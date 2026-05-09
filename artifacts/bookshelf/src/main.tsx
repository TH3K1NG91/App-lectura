import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

(function initTheme() {
  const stored = localStorage.getItem("lumina-theme");
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
