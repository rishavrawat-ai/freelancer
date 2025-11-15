import PropTypes from "prop-types";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  "Professional",
  "Specialty",
  "Skills",
  "Experience",
  "Portfolio",
  "Terms",
];

const experienceRanges = ["0-1", "1-3", "3-5", "5-8", "10+"];

const StepIndicator = ({ activeIndex = 3 }) => (
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
                isActive &&
                  "border-yellow-400 bg-yellow-400/10 text-yellow-400",
                isComplete && "border-yellow-300 bg-yellow-300 text-slate-900",
                !isActive &&
                  !isComplete &&
                  "border-white/10 text-muted-foreground bg-white/5"
              )}>
              {index + 1}
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              {label}
            </div>
          </div>
          {index < steps.length - 1 ? (
            <div className="ml-2.5 mt-2 h-6 w-px rounded-full bg-gradient-to-b from-white/30 to-transparent" />
          ) : null}
        </div>
      );
    })}
  </div>
);

export const FreelancerExperienceStep = ({
  initialExperience = "",
  specialty,
  category,
  onBack,
  onContinue,
}) => {
  const experienceLabel = specialty || category || "your expertise";
  const [experience, setExperience] = useState(initialExperience);

  useEffect(() => {
    setExperience(initialExperience);
  }, [initialExperience]);

  const handleContinue = () => {
    if (experience && typeof onContinue === "function") {
      onContinue(experience);
    }
  };

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 size-[480px] rounded-full bg-amber-500" />
        <div className="absolute bottom-0 right-0 size-[380px] rounded-full" />
      </div>
      <Card className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-black from-slate-950/90 via-slate-900/90 to-slate-900/70 px-8 py-10 shadow-2xl shadow-black/40 backdrop-blur transition-all duration-500 lg:px-14">
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 space-y-8 rounded-[28px] border border-white/5 bg-white/5 p-6 text-white lg:block">
            <StepIndicator activeIndex={3} />
          </aside>
          <div className="flex-1 space-y-8 text-white">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 4 - Experience
              </p>
              <h1 className="text-4xl font-semibold">Your expertise level</h1>
              <p className="text-base text-white/70">
                Select your years of experience related to{" "}
                <span className="font-semibold text-white">
                  {experienceLabel}
                </span>
                .
              </p>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-4 p-0">
              {experienceRanges.map((range) => {
                const isActive = experience === range;
                return (
                  <button
                    key={range}
                    type="button"
                    className={cn(
                      "min-w-[88px] rounded-2xl border px-6 py-3 text-base font-semibold tracking-wide transition-all",
                      isActive
                        ? "border-yellow-300 bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-300/30"
                        : "border-white/15 bg-white/5 text-white/80 hover:border-yellow-200/50 hover:bg-white/10"
                    )}
                    onClick={() => setExperience(range)}>
                    {range}
                  </button>
                );
              })}
            </CardContent>

            <p className="text-sm text-white/70">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-yellow-300 hover:text-yellow-200">
                Login here
              </a>
            </p>

            <CardFooter className="flex flex-col gap-3 p-0 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/15 bg-transparent px-8 py-2 text-sm font-semibold text-white/80 hover:border-white/40 hover:bg-white/5"
                onClick={onBack}>
                Back
              </Button>
              <Button
                type="button"
                className="rounded-2xl bg-yellow-400 px-10 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!experience}
                onClick={handleContinue}>
                Next
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    </section>
  );
};

StepIndicator.propTypes = {
  activeIndex: PropTypes.number,
};

FreelancerExperienceStep.propTypes = {
  initialExperience: PropTypes.string,
  specialty: PropTypes.string,
  category: PropTypes.string,
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
};

FreelancerExperienceStep.defaultProps = {
  initialExperience: "",
  specialty: "",
  category: "",
  onBack: undefined,
  onContinue: undefined,
};

export default FreelancerExperienceStep;
