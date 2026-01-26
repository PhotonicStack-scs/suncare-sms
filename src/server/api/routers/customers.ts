import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getCachedCustomers,
  getCustomerWithSync,
  searchTripletexCustomers,
  syncAllCustomers,
  syncCustomer,
} from "~/lib/tripletex";

export const customerRouter = createTRPCRouter({
  /**
   * Get all cached customers with optional search/pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      return getCachedCustomers(input);
    }),

  /**
   * Get a single customer by Tripletex ID
   * Will sync from Tripletex if not found or stale
   */
  getById: protectedProcedure
    .input(z.object({ tripletexId: z.string() }))
    .query(async ({ input }) => {
      return getCustomerWithSync(input.tripletexId);
    }),

  /**
   * Search customers in Tripletex directly (for autocomplete)
   */
  searchTripletex: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      return searchTripletexCustomers(input.query, input.limit);
    }),

  /**
   * Sync a single customer from Tripletex
   */
  sync: protectedProcedure
    .input(z.object({ tripletexId: z.number() }))
    .mutation(async ({ input }) => {
      await syncCustomer(input.tripletexId);
      return { success: true };
    }),

  /**
   * Trigger full customer sync from Tripletex
   * Should be used sparingly (e.g., admin action or cron job)
   */
  syncAll: protectedProcedure.mutation(async () => {
    return syncAllCustomers();
  }),

  /**
   * Get customer's installations
   */
  getInstallations: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.installation.findMany({
        where: { customerId: input.customerId },
        include: {
          agreements: {
            where: {
              status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
            },
            select: {
              id: true,
              agreementNumber: true,
              agreementType: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Get customer's agreements
   */
  getAgreements: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.serviceAgreement.findMany({
        where: {
          installation: {
            customerId: input.customerId,
          },
        },
        include: {
          installation: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              systemType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
