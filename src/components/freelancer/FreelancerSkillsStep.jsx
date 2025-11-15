import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const steps = [
  "Professional",
  "Specialty",
  "Skills",
  "Experience",
  "Portfolio",
  "Terms",
];

const specialtySkills = {
  "Web Development": ["React", "Next.js", "Vue", "Tailwind CSS", "Node.js"],
  "Mobile App Development": [
    "Swift (iOS)",
    "Kotlin",
    "React Native",
    "Flutter",
    "Java",
  ],
  "AI & Machine Learning": [
    "TensorFlow",
    "PyTorch",
    "Prompt Engineering",
    "LangChain",
    "Python",
  ],
  "Data Engineering": ["Airflow", "Snowflake", "dbt", "BigQuery", "SQL"],
  "DevOps & Cloud": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  "Content Strategy": [
    "Copywriting",
    "Storytelling",
    "SEO Writing",
    "Brand Voice",
  ],
  "Paid Media": [
    "Google Ads",
    "Meta Ads",
    "Campaign Optimization",
    "Attribution",
  ],
  "SEO Specialist": [
    "Technical SEO",
    "Keyword Research",
    "Link Building",
    "Analytics",
  ],
  "Product Design": [
    "Figma",
    "Design Systems",
    "Interaction Design",
    "Prototyping",
  ],
  "UX Research": ["User Interviews", "Usability Testing", "Journey Mapping"],
  default: ["Creativity", "Collaboration", "Communication", "Problem Solving"],
};

const StepIndicator = ({ activeIndex = 2 }) => (
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

export const FreelancerSkillsStep = ({
  specialty,
  category,
  initialSkills = [],
  onBack,
  onContinue,
}) => {
  const [selectedSkills, setSelectedSkills] = useState(initialSkills ?? []);
  const [customSkill, setCustomSkill] = useState("");

  useEffect(() => {
    setSelectedSkills(initialSkills ?? []);
  }, [initialSkills]);

  const suggestedSkills = useMemo(() => {
    if (specialty && specialtySkills[specialty]) {
      return specialtySkills[specialty];
    }
    if (category && specialtySkills[category]) {
      return specialtySkills[category];
    }
    return specialtySkills.default;
  }, [category, specialty]);

  const handleToggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill]
    );
  };

  const handleAddSkill = () => {
    const value = customSkill.trim();
    if (!value) {
      return;
    }
    setSelectedSkills((prev) =>
      prev.includes(value) ? prev : [...prev, value]
    );
    setCustomSkill("");
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddSkill();
    }
  };

  const handleContinue = () => {
    if (typeof onContinue === "function") {
      onContinue(selectedSkills);
    }
  };

  const relatedDiscipline = specialty || category || "your field";

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 size-[480px] rounded-full bg-amber-500" />
        <div className="absolute bottom-0 right-0 size-[380px] rounded-full" />
      </div>
      <Card className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-black from-slate-950/90 via-slate-900/90 to-slate-900/70 px-8 py-10 shadow-2xl shadow-black/40 backdrop-blur transition-all duration-500 lg:px-14">
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 space-y-8 rounded-[28px] border border-white/5 bg-white/5 p-6 text-white lg:block">
            <StepIndicator activeIndex={2} />
          </aside>
          <div className="flex-1 space-y-8 text-white">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 3 - Skills
              </p>
              <h1 className="text-4xl font-semibold">Select Your Skills</h1>
              <p className="text-base text-white/70">
                Choose the skills you have related to{" "}
                <span className="font-semibold text-white">
                  {relatedDiscipline}
                </span>
                . You can also add custom skills below.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 p-0">
              <div className="flex flex-wrap gap-3">
                {suggestedSkills.map((skill) => {
                  const isActive = selectedSkills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      className={cn(
                        "rounded-2xl border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                        isActive
                          ? "border-yellow-300 bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-300/30"
                          : "border-white/15 bg-white/5 text-white/80 hover:border-yellow-200/50 hover:bg-white/10"
                      )}>
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  Add a skill
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="text"
                    placeholder="Type a skill and press Add or Enter"
                    value={customSkill}
                    onChange={(event) => setCustomSkill(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="h-12 flex-1 rounded-2xl border border-white/20 bg-black/40 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="button"
                    className="rounded-2xl bg-yellow-400 px-6 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-300"
                    onClick={handleAddSkill}>
                    Add
                  </Button>
                </div>
                <p className="text-sm text-white/60">
                  Added skills will be saved as part of your profile when you
                  proceed.
                </p>
              </div>
            </CardContent>

            <div className="flex flex-col gap-2 text-sm text-white/70">
              <span>
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-yellow-300 hover:text-yellow-200">
                  Login here
                </a>
              </span>
            </div>

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
                disabled={!selectedSkills.length}
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

FreelancerSkillsStep.propTypes = {
  specialty: PropTypes.string,
  category: PropTypes.string,
  initialSkills: PropTypes.arrayOf(PropTypes.string),
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
};

FreelancerSkillsStep.defaultProps = {
  specialty: "",
  category: "",
  initialSkills: [],
  onBack: undefined,
  onContinue: undefined,
};

export default FreelancerSkillsStep;
