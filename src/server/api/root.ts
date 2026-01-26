import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "~/server/api/routers/post";
import { customerRouter } from "~/server/api/routers/customers";
import { invoiceRouter } from "~/server/api/routers/invoices";
import { agreementRouter } from "~/server/api/routers/agreements";
import { visitRouter } from "~/server/api/routers/visits";
import { checklistRouter } from "~/server/api/routers/checklists";

/**
 * Primary router for the tRPC API
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  customer: customerRouter,
  invoice: invoiceRouter,
  agreement: agreementRouter,
  visit: visitRouter,
  checklist: checklistRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
