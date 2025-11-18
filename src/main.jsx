import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

import "./font.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
