import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Dismiss splash screen once React has mounted
requestAnimationFrame(() => {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.classList.add("hidden");
    setTimeout(() => splash.remove(), 280);
  }
});

// Service worker is opt-in to avoid stale cached bundles after deployments.
// Set VITE_ENABLE_SW=true to enable registration in production.
const enableServiceWorker =
  import.meta.env.PROD &&
  window.location.hostname !== 'localhost' &&
  import.meta.env.VITE_ENABLE_SW === 'true';

if ('serviceWorker' in navigator && enableServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
} else if ('serviceWorker' in navigator) {
  // Always unregister stale SW when disabled to prevent old cached chunks from breaking startup.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
}
