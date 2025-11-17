import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: ""
};

const ROLE_OPTIONS = [
  {
    id: "CLIENT",
    title: "I'm a client",
    description: "Post projects, review proposals, and collaborate with top talent."
  },
  {
    id: "FREELANCER",
    title: "I'm a freelancer",
    description: "Showcase your skills, submit proposals, and get hired faster."
  }
];

function Signup({ className, ...props }) {
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState("CLIENT");
  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authPayload = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: selectedRole
      });
      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Account created successfully.");
      setFormData(initialFormState);
      const nextRole = authPayload?.user?.role?.toUpperCase() || selectedRole;
      navigate(nextRole === "CLIENT" ? "/client" : "/freelancer", { replace: true });
    } catch (error) {
      const message =
        error?.message || "Unable to create your account right now.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormError("");
  };

  const renderForm = () => (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full mt-10 max-w-sm md:max-w-4xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-6 md:p-8" onSubmit={handleSubmit} noValidate>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your details below to create your account
                    </p>
                    <p className="text-xs uppercase tracking-[0.35em] text-primary">
                      {selectedRole === "CLIENT"
                        ? "Client account"
                        : "Freelancer account"}
                    </p>
                  </div>
                  <FieldDescription className="text-center text-sm text-muted-foreground">
                    {selectedRole === "CLIENT"
                      ? "You're creating a client account."
                      : "You're creating a freelancer account."}
                  </FieldDescription>
                  <Field>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Account type
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ROLE_OPTIONS.map((option) => {
                        const isActive = selectedRole === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleRoleSelect(option.id)}
                            className={cn(
                              "rounded-2xl border p-4 text-left transition-all",
                              isActive
                                ? "border-primary bg-primary/10 text-primary shadow-lg"
                                : "border-white/10 bg-transparent text-foreground hover:border-primary/40"
                            )}
                            aria-pressed={isActive}
                          >
                            <span className="text-base font-semibold">
                              {option.title}
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <FieldDescription>
                      We&apos;ll use this to contact you. We will not share your
                      email with anyone else.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <Field className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm Password
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                    </Field>
                    <FieldDescription>
                      Must be at least 8 characters long.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  </Field>
                  {formError ? (
                    <FieldDescription
                      className="text-destructive text-sm"
                      aria-live="polite"
                    >
                      {formError}
                    </FieldDescription>
                  ) : null}
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                  </FieldSeparator>
                  <Field>
                    <Button variant="outline" type="button">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">Sign up with Google</span>
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Already have an account? <a href="/login">Sign in</a>
                  </FieldDescription>
                </FieldGroup>
              </form>
              <div className="bg-muted relative hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1697718363306-a02488b41f57?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZyZWVsYW5jZXJlJTIwaW1hZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=500"
                  alt="Signup illustration"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );

  return renderForm();
}

export default Signup;

Signup.propTypes = {
  className: PropTypes.string
};
