import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/components/home/Home.jsx";
import Client from "@/components/client/Client.jsx";
import { ThemeProvider } from "./components/theme-provider";
import Navbar from "./components/Navbar";
import SignupPage from "./components/forms/Signup";
import LoginPage from "./components/forms/Login";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/client" element={<Client />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </main>
  );
};

const NotFound = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">
      404
    </p>
    <h1 className="text-3xl md:text-4xl font-light">Page not found</h1>
    <p className="text-emerald-50/70 max-w-md">
      The route you are looking for doesn&apos;t exist. Use the main navigation
      to head back home.
    </p>
  </main>
);

export default App;
