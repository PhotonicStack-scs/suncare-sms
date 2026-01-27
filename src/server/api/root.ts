import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { customersRouter } from "./routers/customers";
import { agreementsRouter } from "./routers/agreements";
import { visitsRouter } from "./routers/visits";
import { checklistsRouter } from "./routers/checklists";
import { invoicesRouter } from "./routers/invoices";
import { reportsRouter } from "./routers/reports";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  customers: customersRouter,
  agreements: agreementsRouter,
  visits: visitsRouter,
  checklists: checklistsRouter,
  invoices: invoicesRouter,
  reports: reportsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.agreements.getAll();
 *       ^? Agreement[]
 */
export const createCaller = createCallerFactory(appRouter);
