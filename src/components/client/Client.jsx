import React from "react";

import ClientOnboading from "./ClientOnboading";
import CursorSpotlight from "@/components/ui/cursor-spotlight";

const Client = () => {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <CursorSpotlight />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none
          [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]"
        style={{
          backgroundSize: "80px 80px",
          backgroundPosition: "0 0",
          opacity: 0.35,
          transform: "translateZ(0)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <ClientOnboading />
      </div>
    </main>
  );
};

export default Client;
