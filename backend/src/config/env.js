import { config } from "dotenv";
import { z } from "zod";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PASSWORD_PEPPER: z.string().min(16, "PASSWORD_PEPPER must be at least 16 characters"),
  PASSWORD_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(8, "Use at least 8 bcrypt salt rounds")
    .max(15, "Avoid extremely high salt rounds in this starter")
    .default(12)
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
