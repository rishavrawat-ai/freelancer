import PropTypes from "prop-types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const steps = [
  "Professional",
  "Specialty",
  "Skills",
  "Experience",
  "Portfolio",
  "Terms",
];

const StepIndicator = ({ activeIndex = 5 }) => (
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

const terms = [
  {
    title: "Project Completion",
    points: [
      "Payment is released only after successful delivery that matches the agreed scope, timeline, and quality.",
      "Missed deadlines, incomplete work, or unapproved deliverables result in no payment obligation for Karyasetu.",
    ],
  },
  {
    title: "Ownership of Work",
    points: [
      "Completed and approved work becomes the sole property of Karyasetu once paid for.",
      "Unfinished or unpaid deliverables remain unusable by the company.",
    ],
  },
  {
    title: "Quality Standards",
    points: [
      "All work must meet Karyasetu's expectations for polish, accuracy, and professionalism.",
      "Substandard submissions may be rejected without compensation.",
    ],
  },
  {
    title: "Communication & Deadlines",
    points: [
      "Freelancers must provide timely updates on project progress.",
      "Final payment occurs only after a formal approval of the delivered work.",
    ],
  },
  {
    title: "Confidentiality & Termination",
    points: [
      "Karyasetu may terminate a project if requirements are not met or confidentiality is breached.",
      "In the event of termination for these reasons, no payment is due.",
    ],
  },
];

export const FreelancerTermsStep = ({ accepted = false, onBack, onContinue }) => {
  const [isAccepted, setIsAccepted] = useState(Boolean(accepted));

  const handleToggle = () => {
    setIsAccepted((prev) => !prev);
  };

  const handleContinue = () => {
    if (isAccepted && typeof onContinue === "function") {
      onContinue();
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
            <StepIndicator activeIndex={5} />
          </aside>
          <div className="flex-1 space-y-8 text-white">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 6 - Terms
              </p>
              <h1 className="text-4xl font-semibold">Freelancer Terms &amp; Conditions</h1>
              <p className="text-base text-white/70">
                By proceeding, you confirm that you have read and agree to the Karyasetu freelancer
                policy outlined below.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 rounded-[28px] border border-white/5 bg-white/5 p-6 max-h-[360px] overflow-y-auto pr-4">
              {terms.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-lg font-semibold text-yellow-200">{section.title}</h3>
                  <ul className="space-y-1 text-sm text-white/80">
                    {section.points.map((point) => (
                      <li key={point} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-sm text-white/80">
                By accepting work from Karyasetu, you confirm that you have read, understood, and
                agree to these Terms &amp; Conditions.
              </p>
            </CardContent>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <Checkbox
                id="terms-accept"
                checked={isAccepted}
                onCheckedChange={handleToggle}
                className="mt-1 border-white/40 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-slate-900"
              />
              <label htmlFor="terms-accept" className="cursor-pointer select-none leading-relaxed">
                I have read, understood, and agree to the Karyasetu Freelancer Terms &amp;
                Conditions.
              </label>
            </div>

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
                disabled={!isAccepted}
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

FreelancerTermsStep.propTypes = {
  accepted: PropTypes.bool,
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
};

FreelancerTermsStep.defaultProps = {
  accepted: false,
  onBack: undefined,
  onContinue: undefined,
};

export default FreelancerTermsStep;
