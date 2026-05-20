import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  console.error("[CartersCare] Fatal render error:", err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:2rem;">
        <div style="max-width:420px;text-align:center;">
          <h1 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Something went wrong</h1>
          <p style="color:#666;font-size:0.875rem;margin-bottom:1rem;">The application failed to start. Please try refreshing.</p>
          <button onclick="location.reload()" style="padding:0.5rem 1.5rem;background:#7c3aed;color:#fff;border:none;border-radius:0.5rem;cursor:pointer;font-weight:600;">
            Refresh
          </button>
        </div>
      </div>
    `;
  }
}
