"use client";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GridScan } from "@/components/ui/GridScan";
import { cn } from "@/lib/utils";

const ShinyText = ({ text, className = "", disabled = false, speed = 3 }) => {
  if (disabled) {
    return (
      <span
        className={cn(
          "text-foreground font-semibold tracking-tight",
          className
        )}>
        {text}
      </span>
    );
  }

  const duration = Math.max(Number(speed) || 3, 0.5);

  return (
    <span
      className={cn(
        "font-semibold tracking-tight text-transparent bg-clip-text",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(251,191,36,0.25), #facc15, #fef3c7, #facc15, rgba(251,191,36,0.25))",
        backgroundSize: "250% 100%",
        animation: `shimmer ${duration}s linear infinite`,
      }}>
      {text}
    </span>
  );
};

const Onboading = () => {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center px-6 md:px-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#392e4e"
          gridScale={0.1}
          scanColor="#ffd700"
          scanOpacity={0.4}
          noiseIntensity={0.01}
          className="w-full h-full"
        />
      </div>

      <section className="relative z-10 w-full max-w-6xl text-center flex flex-col items-center justify-center gap-5 py-16 min-h-screen">
        <Link to="/signup" className="inline-block">
          <Button
            variant="outline"
            className="group border px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm font-medium cursor-pointer bg-transparent hover:bg-foreground/5">
            <Sparkles className="text-yellow-400 fill-yellow-400 w-5 h-5" />
            <ShinyText
              text="Smarter Way to Connect Freelancers & Clients"
              disabled={false}
              speed={3}
            />
            <ChevronRight className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </Link>

        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium leading-tight tracking-tight text-foreground max-w-6x">
          Find clever minds<br/> Upgrade your craft
        </h1>

        <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl">
          Join our network of freelancers and connect with clients who value
          your talent.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
          <Link to="/service" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="text-lg gap-2 rounded-full shadow-md w-full sm:w-auto cursor-pointer">
              Hire a professional <ArrowRight className="h-5 w-4" />
            </Button>
          </Link>
          <Link to="/freelancer/onboarding" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="text-lg rounded-full border-foreground/20 hover:bg-foreground/10 w-full sm:w-auto cursor-pointer">
              Get Hired
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Onboading;
