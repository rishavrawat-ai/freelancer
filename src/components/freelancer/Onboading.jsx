import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  "Professional",
  "Specialty",
  "Skills",
  "Experience",
  "Portfolio",
  "Terms",
  "Personal Info"
];

const categories = [
  "Development & Tech",
  "Digital Marketing",
  "Video Services",
  "Product & UI/UX",
  "Writing & Translation",
  "Data & AI",
  "Business Consulting"
];

const StepIndicator = ({ activeIndex = 0 }) => (
  <div className="flex flex-col gap-4">
    {steps.map((label, index) => {
      const isActive = index === activeIndex;
      const isComplete = index < activeIndex;

      return (
        <div key={label} className="flex flex-col">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.2em] transition-all",
                isActive && "border-yellow-400 bg-yellow-400/10 text-yellow-400",
                isComplete && "border-yellow-300 bg-yellow-300 text-slate-900",
                !isActive &&
                  !isComplete &&
                  "border-white/10 text-muted-foreground bg-white/5"
              )}
            >
              {index + 1}
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              {label}
            </div>
          </div>
          {index < steps.length - 1 ? (
            <div className="ml-4 mt-2 h-6 w-px rounded-full bg-gradient-to-b from-white/30 to-transparent" />
          ) : null}
        </div>
      );
    })}
  </div>
);

export const FreelancerOnboarding = ({
  initialCategory = "",
  onContinue
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState(initialCategory ?? "");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleContinue = () => {
    if (selectedCategory && typeof onContinue === "function") {
      onContinue(selectedCategory);
    }
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 size-[480px] rounded-full bg-amber-500 blur-[180px]" />
        <div className="absolute bottom-0 right-0 size-[380px] rounded-full bg-cyan-500 blur-[220px]" />
      </div>
      <Card
        className={cn(
          "relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-900/70 px-8 py-10 shadow-2xl shadow-black/40 backdrop-blur transition-all duration-500 lg:px-14",
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
      >
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 space-y-8 rounded-[28px] border border-white/5 bg-white/5 p-6 text-white lg:block">
            <StepIndicator activeIndex={0} />
          </aside>

          <div className="flex-1 space-y-8">
            <CardHeader className="space-y-3 p-0 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 1 · Professional
              </p>
              <h1 className="text-4xl font-semibold">
                Choose Your Professional Field
              </h1>
              <p className="text-base text-white/70">
                Select the category that best describes your lead discipline.
                We use this to surface briefs, communities, and upcoming client
                requests.
              </p>
            </CardHeader>

            <CardContent className="grid gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const isActive = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      "h-16 w-full rounded-2xl border px-4 text-center text-base font-semibold uppercase tracking-wide transition-all duration-200",
                      isActive
                        ? "border-yellow-300 bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-300/30"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-yellow-200/50 hover:bg-white/10"
                    )}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </CardContent>

            <CardFooter className="flex justify-end p-0 pt-2">
              <Button
                type="button"
                className="rounded-2xl bg-yellow-400 px-8 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-300"
                disabled={!selectedCategory}
                onClick={handleContinue}
              >
                Continue
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    </section>
  );
};

StepIndicator.propTypes = {
  activeIndex: PropTypes.number
};

FreelancerOnboarding.propTypes = {
  initialCategory: PropTypes.string,
  onContinue: PropTypes.func
};

FreelancerOnboarding.defaultProps = {
  initialCategory: "",
  onContinue: null
};

export default FreelancerOnboarding;
