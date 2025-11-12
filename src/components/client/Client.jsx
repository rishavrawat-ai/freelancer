import React from "react";
import { Link } from "react-router-dom";

import ClientOnboading from "./ClientOnboading";
import { Button } from "@/components/ui/button";

const Client = () => {
  return (
    <main>
         {/* Grid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none
          [background-image:linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)]
          dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
        style={{
          backgroundSize: "68px 68px",
          backgroundPosition: "0 0",
          opacity: 1,
          transform: "translateZ(0)",
        }}
      />
      <div className="relative z-10 flex justify-end px-6 py-4">
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            Back to Home
          </Button>
        </Link>
      </div>
      <div>
        Service
      </div>
      <ClientOnboading/>
    </main>
  );
};

export default Client;
