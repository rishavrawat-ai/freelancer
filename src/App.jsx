import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/components/home/Home";
import Client from "@/components/client/Client";
import { ThemeProvider } from "./components/theme-provider";
import Navbar from "./components/Navbar";

const App = () => {
  return (
    <main>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/client" element={<Client />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
