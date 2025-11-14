import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../");
const envFileName = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
const candidatePath = resolve(projectRoot, envFileName);

if (existsSync(candidatePath)) {
  config({ path: candidatePath });
} else {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  LOCAL_CORS_ORIGIN: z.string().optional(),
  VERCEL_CORS_ORIGIN: z.string().optional(),
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
