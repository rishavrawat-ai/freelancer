import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const steps = [
  "Professional",
  "Specialty",
  "Skills",
  "Experience",
  "Portfolio",
  "Terms",
];

const specialties = {
  "Development & Tech": [
    "Web Development",
    "Mobile App Development",
    "AI & Machine Learning",
    "Data Engineering",
    "DevOps & Cloud",
  ],
  "Digital Marketing": [
    "Content Strategy",
    "Paid Media",
    "SEO Specialist",
    "Email Marketing",
  ],
  "Video Services": [
    "Post Production",
    "Motion Graphics",
    "2D Animation",
    "Storyboarding",
  ],
  "Product & UI/UX": [
    "Product Design",
    "UX Research",
    "Interaction Design",
    "Design Systems",
  ],
  "Writing & Translation": [
    "Copywriting",
    "Technical Writing",
    "Localization",
    "Editorial Writing",
  ],
  "Data & AI": [
    "Data Science",
    "Visualization",
    "Machine Learning Ops",
    "AI Prompt Engineering",
  ],
  "Business Consulting": [
    "Operations Strategy",
    "Financial Modeling",
    "Growth Strategy",
    "Organization Design",
  ],
};

const StepIndicator = ({ activeIndex = 1 }) => (
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

export const FreelancerSpecialtyStep = ({
  category,
  initialSpecialty = "",
  onBack,
  onContinue,
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);

  useEffect(() => {
    const available = specialties[category] ?? [];
    if (!available.length) {
      setSelectedSpecialty("");
      return;
    }

    if (initialSpecialty && available.includes(initialSpecialty)) {
      setSelectedSpecialty(initialSpecialty);
      return;
    }

    setSelectedSpecialty(available[0]);
  }, [category, initialSpecialty]);

  const availableSpecialties = specialties[category] ?? [];

  const handleContinue = () => {
    if (selectedSpecialty && typeof onContinue === "function") {
      onContinue(selectedSpecialty);
    }
  };

  const isContinueDisabled = !selectedSpecialty;

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 size-[480px] rounded-full bg-amber-500" />
        <div className="absolute bottom-0 right-0 size-[380px] rounded-full" />
      </div>
      <Card className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-black from-slate-950/90 via-slate-900/90 to-slate-900/70 px-8 py-10 shadow-2xl shadow-black/40 backdrop-blur transition-all duration-500 lg:px-14">
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 space-y-8 rounded-[28px] border border-white/5 bg-white/5 p-6 text-white lg:block">
            <StepIndicator activeIndex={1} />
          </aside>

          <div className="flex-1 space-y-8 text-white">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 2 - Specialty
              </p>
              <h1 className="text-4xl font-semibold">Select Your Specialty</h1>
              <p className="text-base text-white/70">
                Now, select your specific skill within {category || "Development & Tech"}.
              </p>
            </CardHeader>

            <CardContent className="p-0">
              <Select
                value={selectedSpecialty}
                onValueChange={setSelectedSpecialty}
                disabled={!availableSpecialties.length}>
                <SelectTrigger className="h-16 w-full rounded-2xl border-2 border-yellow-400 bg-black/40 text-lg font-semibold text-white focus-visible:ring-yellow-300/30">
                  <SelectValue placeholder="Choose a specialty" />
                </SelectTrigger>
                <SelectContent className="w-full rounded-2xl border border-yellow-300/50 bg-slate-900 text-white">
                  {availableSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-base">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>

            <CardFooter className="flex items-center justify-between p-0 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/10 bg-transparent px-6 py-2 text-sm font-semibold text-white/80 hover:border-white/40 hover:bg-white/5"
                onClick={onBack}>
                Back
              </Button>
              <Button
                type="button"
                className="rounded-2xl bg-yellow-400 px-8 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isContinueDisabled}
                onClick={handleContinue}>
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
  activeIndex: PropTypes.number,
};

FreelancerSpecialtyStep.propTypes = {
  category: PropTypes.string,
  initialSpecialty: PropTypes.string,
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
};

FreelancerSpecialtyStep.defaultProps = {
  category: "",
  initialSpecialty: "",
  onBack: undefined,
  onContinue: undefined,
};

export default FreelancerSpecialtyStep;
