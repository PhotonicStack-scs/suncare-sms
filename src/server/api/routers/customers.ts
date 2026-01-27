import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { customerSyncService } from "~/server/services/customerSync";

export const customersRouter = createTRPCRouter({
  /**
   * Get all customers from local cache
   */
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, limit } = input;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { orgNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [customers, total] = await Promise.all([
        ctx.db.customerCache.findMany({
          where,
          skip: page * limit,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { installations: true },
            },
          },
        }),
        ctx.db.customerCache.count({ where }),
      ]);

      return {
        items: customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Get a single customer by ID
   */
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.customerCache.findUnique({
        where: { id: input },
        include: {
          installations: {
            include: {
              _count: {
                select: { agreements: true },
              },
            },
          },
        },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      return customer;
    }),

  /**
   * Get a customer by Tripletex ID (syncs if not found)
   */
  getByTripletexId: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const customer = await customerSyncService.findOrSyncCustomer(input);
      return customer;
    }),

  /**
   * Search customers in Tripletex and sync results
   */
  searchInTripletex: protectedProcedure
    .input(z.string().min(2))
    .mutation(async ({ input }) => {
      const customers = await customerSyncService.searchAndSync(input);
      return customers;
    }),

  /**
   * Sync a single customer from Tripletex
   */
  syncCustomer: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await customerSyncService.syncCustomer(input);
      return { success: true };
    }),

  /**
   * Sync all customers from Tripletex (admin only)
   */
  syncAll: protectedProcedure.mutation(async () => {
    const result = await customerSyncService.syncAllCustomers();
    return result;
  }),
});
