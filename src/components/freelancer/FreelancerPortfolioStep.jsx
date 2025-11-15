import PropTypes from "prop-types";
import { useEffect, useState } from "react";

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

const StepIndicator = ({ activeIndex = 4 }) => (
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

export const FreelancerPortfolioStep = ({
  initialPortfolio = {
    portfolioUrl: "",
    linkedinUrl: "",
    pdfFile: null,
  },
  onBack,
  onContinue,
}) => {
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialPortfolio?.portfolioUrl ?? ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    initialPortfolio?.linkedinUrl ?? ""
  );
  const [uploadedFile, setUploadedFile] = useState(
    initialPortfolio?.pdfFile ?? null
  );

  useEffect(() => {
    setPortfolioUrl(initialPortfolio?.portfolioUrl ?? "");
    setLinkedinUrl(initialPortfolio?.linkedinUrl ?? "");
    setUploadedFile(initialPortfolio?.pdfFile ?? null);
  }, [initialPortfolio]);

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? [];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleContinue = () => {
    if (typeof onContinue === "function") {
      onContinue({
        portfolioUrl,
        linkedinUrl,
        pdfFile: uploadedFile,
      });
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
            <StepIndicator activeIndex={4} />
          </aside>
          <div className="flex-1 space-y-8 text-white">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
                Stage 5 - Portfolio
              </p>
              <h1 className="text-4xl font-semibold">
                Portfolio &amp; Online Presence
              </h1>
              <p className="text-base text-white/70">
                Share your portfolio website, LinkedIn profile, and upload any
                supporting PDF to showcase your work.
              </p>
            </CardHeader>

            <CardContent className="space-y-5 p-0">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  Portfolio Website
                </label>
                <Input
                  type="url"
                  value={portfolioUrl}
                  onChange={(event) => setPortfolioUrl(event.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="h-12 rounded-2xl border border-white/20 bg-black/40 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  LinkedIn Profile
                </label>
                <Input
                  type="url"
                  value={linkedinUrl}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="h-12 rounded-2xl border border-white/20 bg-black/40 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  Upload PDF file
                </label>
                <label
                  className="flex h-14 cursor-pointer items-center justify-between rounded-2xl border border-white/20 bg-black/40 px-4 text-white/70 transition hover:border-yellow-200/40 hover:text-white">
                  <span>
                    {uploadedFile?.name ? uploadedFile.name : "Upload pdf"}
                  </span>
                  <Input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
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
                className="rounded-2xl bg-yellow-400 px-10 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-300"
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

FreelancerPortfolioStep.propTypes = {
  initialPortfolio: PropTypes.shape({
    portfolioUrl: PropTypes.string,
    linkedinUrl: PropTypes.string,
    pdfFile: PropTypes.any,
  }),
  onBack: PropTypes.func,
  onContinue: PropTypes.func,
};

FreelancerPortfolioStep.defaultProps = {
  initialPortfolio: {
    portfolioUrl: "",
    linkedinUrl: "",
    pdfFile: null,
  },
  onBack: undefined,
  onContinue: undefined,
};

export default FreelancerPortfolioStep;
