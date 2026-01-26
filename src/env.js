import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // @energismart/shared - Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // @energismart/shared - Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    AUTH_SECRET: z.string().min(1),

    // Tripletex API
    TRIPLETEX_CONSUMER_TOKEN: z.string().min(1),
    TRIPLETEX_EMPLOYEE_TOKEN: z.string().min(1),
    TRIPLETEX_API_BASE_URL: z.string().url().default("https://tripletex.no/v2"),

    // Google Gemini AI
    GEMINI_API_KEY: z.string().min(1),

    // Optional: Google Maps
    GOOGLE_MAPS_API_KEY: z.string().optional(),
  },

  /**
   * Client-side environment variables schema
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  /**
   * Runtime environment variable mappings
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    // @energismart/shared
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,

    // Tripletex
    TRIPLETEX_CONSUMER_TOKEN: process.env.TRIPLETEX_CONSUMER_TOKEN,
    TRIPLETEX_EMPLOYEE_TOKEN: process.env.TRIPLETEX_EMPLOYEE_TOKEN,
    TRIPLETEX_API_BASE_URL: process.env.TRIPLETEX_API_BASE_URL,

    // Google Gemini
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // Google Maps
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Skip validation for Docker builds
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined
   */
  emptyStringAsUndefined: true,
});
