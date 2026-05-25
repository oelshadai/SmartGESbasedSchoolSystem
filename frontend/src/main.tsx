import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const STALE_CHUNK_RELOAD_KEY = 'smartges:stale-chunk-reloaded';

window.setTimeout(() => {
  sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY);
}, 10000);

const recoverFromStaleChunk = async () => {
  if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) === 'true') return;
  sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, 'true');

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }

  window.location.reload();
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason || '');

  if (message.includes('Failed to fetch dynamically imported module')) {
    event.preventDefault();
    recoverFromStaleChunk().catch(() => window.location.reload());
  }
});

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
    Promise.all(registrations.map((reg) => reg.unregister())).then(() => {
      if (registrations.length > 0 && sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) !== 'true') {
        sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, 'true');
        window.location.reload();
      }
    });
  });
}
