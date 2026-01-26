/**
 * tRPC Server Configuration
 * 
 * This file contains the tRPC server setup including:
 * - Context creation with database and user session
 * - Router and procedure definitions
 * - Authentication middleware
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";
import { 
  getCurrentUser, 
  hasPermission, 
  type SystemUser, 
  type Permission 
} from "~/server/auth";

/**
 * Context type definition
 */
interface CreateContextOptions {
  headers: Headers;
}

/**
 * Create tRPC context for each request
 * Includes database connection and user session
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  const user = await getCurrentUser();

  return {
    db,
    user,
    ...opts,
  };
};

/**
 * tRPC initialization with context type inference
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Server-side caller factory
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Router creation helper
 */
export const createTRPCRouter = t.router;

/**
 * Middleware: Request timing and artificial delay in development
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // Artificial delay in dev to simulate network latency
    const waitMs = Math.floor(Math.random() * 100) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms`);

  return result;
});

/**
 * Middleware: Authentication check
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Du må være logget inn for å utføre denne handlingen",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be defined
    },
  });
});

/**
 * Middleware: Permission check factory
 */
const createPermissionMiddleware = (requiredPermission: Permission) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Du må være logget inn",
      });
    }

    if (!hasPermission(ctx.user, requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Du har ikke tilgang til denne ressursen",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

/**
 * Public procedure
 * Can be called without authentication
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected procedure
 * Requires user to be logged in
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware);

/**
 * Create a procedure that requires a specific permission
 */
export const createPermissionProcedure = (permission: Permission) =>
  t.procedure
    .use(timingMiddleware)
    .use(createPermissionMiddleware(permission));

// Pre-defined permission-based procedures for common use cases
export const agreementReadProcedure = createPermissionProcedure("agreements:read");
export const agreementWriteProcedure = createPermissionProcedure("agreements:write");
export const visitReadProcedure = createPermissionProcedure("visits:read");
export const visitWriteProcedure = createPermissionProcedure("visits:write");
export const invoiceReadProcedure = createPermissionProcedure("invoices:read");
export const invoiceWriteProcedure = createPermissionProcedure("invoices:write");
export const adminProcedure = createPermissionProcedure("admin:settings");

/**
 * Type helpers for route handlers
 */
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
export type ProtectedContext = Context & { user: SystemUser };
