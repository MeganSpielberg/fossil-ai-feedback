/**
 * App entry point.
 *
 * This is a Vite + React single page app.
 * The top level component is `App` in `src/App.jsx`.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
