import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL, signup } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const STEPS = [
  { id: 1, key: "professional", label: "Professional" },
  { id: 2, key: "specialty", label: "Specialty" },
  { id: 3, key: "skills", label: "Skills" },
  { id: 4, key: "experience", label: "Experience" },
  { id: 5, key: "portfolio", label: "Portfolio" },
  { id: 6, key: "terms", label: "Terms" },
  { id: 7, key: "personal", label: "Personal info" },
];

const PROFESSIONAL_FIELDS = [
  "Development & Tech",
  "Digital Marketing",
  "Creative & Design",
  "Writing & Content",
  "Lead Generation",
  "Video Services",
  "Travel Services",
  "Event Management",
  "Visa & Passport",
  "Insurance Services",
  "Real Estate",
  "HR Services",
  "Influencer Services",
  "Business & Finance",
  "Legal & Compliance",
  "Education & Training",
  "Lifestyle & Personal",
  "Customer Support",
  "Administrative Services",
  "Audio Services",
];

const DEFAULT_SKILLS = ["Swift (iOS)", "Kotlin (Android)", "React Native", "Flutter", "Java"];

const EXPERIENCE_OPTIONS = ["0-1", "1-3", "3-5", "5-8", "10+"];

const specialtyOptionsByField = {
  "Development & Tech": [
    "Front-end Development",
    "Back-end Development",
    "Full-stack Development",
    "Mobile App Development",
    "DevOps & Cloud",
    "Data & Analytics",
  ],
  "Digital Marketing": [
    "SEO Specialist",
    "Performance Marketer",
    "Content Marketing",
    "Email Marketing",
  ],
  "Creative & Design": [
    "UI/UX Design",
    "Graphic Design",
    "Product Design",
    "Brand Identity",
  ],
};

const fallbackSpecialtyOptions = [
  "General Specialist",
  "Consultant",
  "Strategist",
  "Project Specialist",
];

const FreelancerMultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    professionalField: "",
    specialty: "",
    skills: [],
    customSkillInput: "",
    experience: "",
    portfolioWebsite: "",
    linkedinProfile: "",
    portfolioFileName: "",
    termsAccepted: false,
    fullName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth();

  const totalSteps = STEPS.length;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (stepError) {
      setStepError("");
    }
  };

  const toggleSkill = skill => {
    setFormData(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const handleAddCustomSkill = () => {
    const value = formData.customSkillInput.trim();
    if (!value) return;

    setFormData(prev => {
      if (prev.skills.includes(value)) {
        return { ...prev, customSkillInput: "" };
      }

      return {
        ...prev,
        skills: [...prev.skills, value],
        customSkillInput: "",
      };
    });
  };

  const handleFileChange = event => {
    const file = event.target.files?.[0];
    handleFieldChange("portfolioFileName", file ? file.name : "");
  };

  const validateStep = (step, data) => {
    switch (step) {
      case 1: {
        if (!data.professionalField) {
          return "Please choose your professional field to continue.";
        }
        return "";
      }
      case 2: {
        if (!data.specialty) {
          return "Please select your specialty to continue.";
        }
        return "";
      }
      case 3: {
        if (!data.skills || data.skills.length === 0) {
          return "Add at least one skill before continuing.";
        }
        return "";
      }
      case 4: {
        if (!data.experience) {
          return "Please select your years of experience.";
        }
        return "";
      }
      case 5: {
        if (!data.portfolioWebsite.trim() || !data.linkedinProfile.trim()) {
          return "Please provide both your portfolio website and LinkedIn profile.";
        }
        return "";
      }
      case 6: {
        if (!data.termsAccepted) {
          return "You must agree to the Terms and Conditions to continue.";
        }
        return "";
      }
      case 7: {
        if (
          !data.fullName.trim() ||
          !data.email.trim() ||
          !data.password.trim() ||
          !data.location.trim()
        ) {
          return "Full name, email, password, and location are required.";
        }
        if (!data.email.includes("@")) {
          return "Please enter a valid email address.";
        }
        if (data.password.trim().length < 8) {
          return "Password must be at least 8 characters long.";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const findFirstInvalidStep = (targetStep = totalSteps, data = formData) => {
    for (let step = 1; step <= targetStep; step += 1) {
      const message = validateStep(step, data);
      if (message) {
        return { step, message };
      }
    }
    return null;
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setStepError("");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepError("");
    }
  };

  const handleGoToStep = (targetStep) => {
    if (targetStep === currentStep) return;

    // Always allow navigating back freely.
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      setStepError("");
      return;
    }

    const validation = findFirstInvalidStep(targetStep, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setCurrentStep(targetStep);
    setStepError("");
  };

  const handleSubmit = async () => {
    const validation = findFirstInvalidStep(totalSteps, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const freelancerProfile = {
        category: formData.professionalField,
        specialty: formData.specialty,
        experience: formData.experience,
        skills: formData.skills,
        portfolio: {
          portfolioUrl: formData.portfolioWebsite,
          linkedinUrl: formData.linkedinProfile,
        },
        acceptedTerms: formData.termsAccepted,
        phone: formData.phone,
        location: formData.location,
      };

      const authPayload = await signup({
        fullName: formData.fullName.trim(),
        email: normalizedEmail,
        password: formData.password,
        role: "FREELANCER",
        freelancerProfile,
      });

      setAuthSession(authPayload?.user, authPayload?.accessToken);

      // Persist initial profile details (phone, location, skills, services) to backend profile API.
      const profilePayload = {
        personal: {
          name: formData.fullName.trim(),
          email: normalizedEmail,
          phone: formData.phone.trim(),
          location: formData.location.trim(),
        },
        skills: Array.isArray(formData.skills)
          ? formData.skills.filter(Boolean)
          : [],
        workExperience: [],
        services: [formData.professionalField, formData.specialty].filter(Boolean),
      };

      try {
        const baseUrl = API_BASE_URL || "/api";
        const response = await fetch(`${baseUrl}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authPayload?.accessToken
              ? { Authorization: `Bearer ${authPayload.accessToken}` }
              : {}),
          },
          body: JSON.stringify(profilePayload),
        });

        if (!response.ok) {
          // We log but don't block signup success on profile issues.
          // eslint-disable-next-line no-console
          console.warn("Unable to persist initial profile details", response.status);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Profile save during onboarding failed:", error);
      }

      toast.success("Your freelancer account has been created.");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      const message =
        error?.message || "Unable to create your freelancer account right now.";
      setStepError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpecialtyOptions =
    specialtyOptionsByField[formData.professionalField] || fallbackSpecialtyOptions;

  const isLastStep = currentStep === totalSteps;
  const disableNext =
    isSubmitting || (currentStep === 6 && !formData.termsAccepted);

  return (
    <div className="min-h-screen w-full bg-[#050506] text-foreground flex items-center justify-center px-4 pt-24 pb-10">
      <div className="w-full max-w-3xl">
        <Card className="border-none bg-[#111111] text-white shadow-2xl max-h-[80vh] flex flex-col">
          <CardHeader className="border-b border-white/5 pt-5 pb-3">
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.id;
                  const isActive = currentStep === step.id;

                  return (
                    <React.Fragment key={step.id}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleGoToStep(step.id)}
                          className="flex flex-col items-center gap-1 bg-transparent px-0 hover:bg-transparent focus-visible:ring-0">
                        <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                            isCompleted && "border-yellow-400 bg-yellow-400 text-black",
                            isActive && !isCompleted && "border-yellow-400 text-yellow-400",
                            !isActive && !isCompleted && "border-white/15 text-white/50",
                          )}>
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium tracking-tight text-white/60",
                            (isActive || isCompleted) && "text-white",
                          )}>
                          {step.label}
                        </span>
                      </Button>
                        {index < STEPS.length - 1 && (
                          <div className="hidden flex-1 items-center md:flex">
                            <div className="h-[2px] w-full rounded-full bg-white/10">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  currentStep > step.id ? "w-full bg-yellow-400" : "w-0 bg-transparent",
                                )}
                              />
                            </div>
                          </div>
                        )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="uppercase tracking-[0.2em] text-yellow-400">
                  GoHypeMedia • Freelancer Onboarding
                </span>
                <span>
                  Step {currentStep} of {totalSteps} • {progress}% complete
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-4 space-y-6 overflow-y-auto scrollbar-thin">
            {currentStep === 1 && (
              <StepProfessional
                selectedField={formData.professionalField}
                onSelectField={value => handleFieldChange("professionalField", value)}
              />
            )}
            {currentStep === 2 && (
              <StepSpecialty
                specialty={formData.specialty}
                onChange={value => handleFieldChange("specialty", value)}
                options={currentSpecialtyOptions}
              />
            )}
            {currentStep === 3 && (
              <StepSkills
                skills={formData.skills}
                customSkillInput={formData.customSkillInput}
                onToggleSkill={toggleSkill}
                onCustomInputChange={value => handleFieldChange("customSkillInput", value)}
                onAddCustomSkill={handleAddCustomSkill}
              />
            )}
            {currentStep === 4 && (
              <StepExperience
                experience={formData.experience}
                onSelectExperience={value => handleFieldChange("experience", value)}
              />
            )}
            {currentStep === 5 && (
              <StepPortfolio
                website={formData.portfolioWebsite}
                linkedin={formData.linkedinProfile}
                fileName={formData.portfolioFileName}
                onWebsiteChange={value => handleFieldChange("portfolioWebsite", value)}
                onLinkedinChange={value => handleFieldChange("linkedinProfile", value)}
                onFileChange={handleFileChange}
              />
            )}
            {currentStep === 6 && (
              <StepTerms
                accepted={formData.termsAccepted}
                onToggle={value => handleFieldChange("termsAccepted", value)}
              />
            )}
            {currentStep === 7 && (
              <StepPersonalInfo
                fullName={formData.fullName}
                email={formData.email}
                password={formData.password}
                phone={formData.phone}
                location={formData.location}
                onChange={handleFieldChange}
              />
            )}

            {stepError && (
              <p className="text-sm text-red-400">
                {stepError}
              </p>
            )}

            <p className="text-sm text-white/50">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-yellow-400 hover:underline">
                Login here
              </a>
            </p>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-white/5 pt-6">
            <Button
              type="button"
              variant="outline"
              className="bg-[#2b2b2b] border-none text-white hover:bg-white hover:text-black"
              disabled={currentStep === 1 || isSubmitting}
              onClick={handleBack}>
              Back
            </Button>
            <Button
              type="button"
              className={cn(
                "min-w-[120px] bg-yellow-400 text-black hover:bg-yellow-500",
                disableNext && "opacity-60 pointer-events-none",
              )}
              disabled={disableNext}
              onClick={isLastStep ? handleSubmit : handleNext}>
              {isSubmitting && isLastStep
                ? "Submitting..."
                : isLastStep
                  ? "Submit"
                  : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const StepProfessional = ({ selectedField, onSelectField }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Choose Your Professional Field</h2>
        <p className="mt-2 text-sm text-white/60">
          Select the category that best describes your work.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PROFESSIONAL_FIELDS.map(field => {
          const isActive = selectedField === field;
          return (
            <Button
              key={field}
              type="button"
              variant="outline"
              onClick={() => onSelectField(field)}
              className={cn(
                "w-full justify-between rounded-lg border border-white/10 bg-[#1c1c1f] px-4 py-4 text-left text-sm font-medium text-white/80 hover:bg-yellow-400 hover:text-black",
                isActive && "border-yellow-400 bg-yellow-400 text-black",
              )}>
              <span>{field}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

const StepSpecialty = ({ specialty, onChange, options }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Select Your Specialty</h2>
        <p className="mt-2 text-sm text-white/60">
          Now, select your specific skill within your professional field.
        </p>
      </div>

      <Select value={specialty} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-lg bg-[#1c1c1f] border-white/15 text-white">
          <SelectValue placeholder="-- Select a specialty to continue --" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const StepSkills = ({
  skills,
  customSkillInput,
  onToggleSkill,
  onCustomInputChange,
  onAddCustomSkill,
}) => {
  const handleKeyDown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAddCustomSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Select Your Skills</h2>
        <p className="mt-2 text-sm text-white/60">
          Choose the skills you have related to your specialty. You can also add custom skills below.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {DEFAULT_SKILLS.map(skill => {
          const isActive = skills.includes(skill);
          return (
            <Button
              key={skill}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleSkill(skill)}
              className={cn(
                "rounded-lg border border-white/15 bg-[#1c1c1f] px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-yellow-400 hover:text-black",
                isActive && "border-yellow-400 bg-yellow-400 text-black",
              )}>
              {skill}
            </Button>
          );
        })}
      </div>

      <div className="space-y-3">
        <Label className="text-sm text-white/80">Add a skill</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={customSkillInput}
            onChange={event => onCustomInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Add or Enter"
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
          <Button
            type="button"
            onClick={onAddCustomSkill}
            className="h-11 rounded-lg bg-yellow-400 text-black px-6 hover:bg-yellow-500">
            Add
          </Button>
        </div>

        {skills.length > 0 && (
          <p className="text-xs text-white/50">
            Added skills will be saved as part of your profile when you proceed.
          </p>
        )}
      </div>
    </div>
  );
};

const StepExperience = ({ experience, onSelectExperience }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Your expertise level</h2>
        <p className="mt-2 text-sm text-white/60">Select your years of experience.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {EXPERIENCE_OPTIONS.map(option => {
          const isActive = experience === option;
          return (
            <Button
              key={option}
              type="button"
              variant="outline"
              onClick={() => onSelectExperience(option)}
              className={cn(
                "w-full rounded-lg border border-white/15 bg-[#1c1c1f] px-4 py-3 text-sm font-medium text-white/80 hover:bg-yellow-400 hover:text-black",
                isActive && "border-yellow-400 bg-yellow-400 text-black",
              )}>
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

const StepPortfolio = ({
  website,
  linkedin,
  fileName,
  onWebsiteChange,
  onLinkedinChange,
  onFileChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
          Portfolio &amp; Online Presence
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Share your portfolio and professional profiles.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portfolioWebsite" className="text-sm text-white/80">
            Portfolio Website
          </Label>
          <Input
            id="portfolioWebsite"
            type="url"
            value={website}
            onChange={event => onWebsiteChange(event.target.value)}
            placeholder="https://yourportfolio.com"
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedinProfile" className="text-sm text-white/80">
            LinkedIn Profile
          </Label>
          <Input
            id="linkedinProfile"
            type="url"
            value={linkedin}
            onChange={event => onLinkedinChange(event.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolioFile" className="text-sm text-white/80">
            Upload pdf file
          </Label>
          <Input
            id="portfolioFile"
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="h-11 cursor-pointer rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white/70 file:bg-transparent"
          />
          {fileName && (
            <p className="text-xs text-white/50">Selected file: {fileName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StepTerms = ({ accepted, onToggle }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Term &amp; Conditions</h2>
        <p className="mt-2 text-sm text-white/60">
          Please agree to the terms to complete your profile.
        </p>
      </div>

      <div className="space-y-4">
        <div className="max-h-64 overflow-y-auto rounded-lg bg-[#1c1c1f] p-4 text-xs leading-relaxed text-white/70 border border-white/10">
          <p className="font-semibold text-yellow-400 mb-2">
            Freelancer Terms &amp; Conditions – Karyasetu
          </p>
          <p className="mb-2">
            These Terms &amp; Conditions (&quot;Agreement&quot;) apply to all freelancers engaged by
            Karyasetu (&quot;Company&quot;) for projects, assignments, or services. By accepting work
            from Karyasetu, you agree to the following:
          </p>
          <ol className="list-decimal space-y-2 ps-4">
            <li>
              <span className="font-semibold">Project Completion</span> – Payment will only be made
              upon successful completion and delivery of the assigned project as per the agreed
              scope, timeline, and quality standards.
            </li>
            <li>
              <span className="font-semibold">Professional Conduct</span> – You agree to maintain
              clear communication, meet deadlines, and deliver original, high-quality work.
            </li>
            <li>
              <span className="font-semibold">Confidentiality</span> – All client and project
              information shared with you must remain confidential and may not be reused or
              disclosed without written permission.
            </li>
            <li>
              <span className="font-semibold">Payment Terms</span> – Payments are processed after
              approval of deliverables. Delays caused by revisions or incomplete work may impact
              payment timelines.
            </li>
          </ol>
        </div>

        <label className="flex items-center gap-3 text-sm text-white/80">
          <Checkbox
            checked={accepted}
            onCheckedChange={value => onToggle(Boolean(value))}
            className="border-white/40 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
          />
          <span>I have read and agree to the Terms and Conditions.</span>
        </label>
      </div>
    </div>
  );
};

const StepPersonalInfo = ({
  fullName,
  email,
  password,
  phone,
  location,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold leading-tight">Personal Information</h2>
        <p className="mt-2 text-sm text-white/60">
          This information will be used to create your account.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm text-white/80">
            Full Name *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={event => onChange("fullName", event.target.value)}
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-white/80">
            Email address *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={event => onChange("email", event.target.value)}
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-white/80">
            Password *
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={event => onChange("password", event.target.value)}
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm text-white/80">
            Phone no.
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={event => onChange("phone", event.target.value)}
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm text-white/80">
            Location *
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={event => onChange("location", event.target.value)}
            placeholder="City, Country"
            className="h-11 rounded-lg bg-[#1c1c1f] border-white/15 text-sm text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
