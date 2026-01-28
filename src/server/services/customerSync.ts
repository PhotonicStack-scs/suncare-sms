import { db } from "~/server/db";
import { tripletexCustomers, mapTripletexCustomerToCache } from "~/lib/tripletex";
import type { CustomerSyncResult } from "~/types/tripletex";

/**
 * Customer synchronization service
 * Syncs customer data from Tripletex to local cache
 */
export const customerSyncService = {
  /**
   * Sync a single customer by Tripletex ID
   */
  async syncCustomer(tripletexId: number): Promise<void> {
    const customer = await tripletexCustomers.getById(tripletexId);
    const data = mapTripletexCustomerToCache(customer);

    await db.customerCache.upsert({
      where: { tripletexId },
      create: {
        ...data,
        syncedAt: new Date(),
      },
      update: {
        ...data,
        syncedAt: new Date(),
      },
    });
  },

  /**
   * Sync all customers from Tripletex
   * Returns sync statistics
   */
  async syncAllCustomers(): Promise<CustomerSyncResult> {
    const result: CustomerSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    let page = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const { customers, hasMore: more } = await tripletexCustomers.getAll(page, 100);
        hasMore = more;
        page++;

        for (const customer of customers) {
          try {
            const data = mapTripletexCustomerToCache(customer);
            
            // Check if customer exists
            const existing = await db.customerCache.findUnique({
              where: { tripletexId: customer.id },
            });

            if (existing) {
              await db.customerCache.update({
                where: { tripletexId: customer.id },
                data: {
                  ...data,
                  syncedAt: new Date(),
                },
              });
              result.updated++;
            } else {
              await db.customerCache.create({
                data: {
                  ...data,
                  syncedAt: new Date(),
                },
              });
              result.created++;
            }

            result.synced++;
          } catch (error) {
            result.errors.push({
              tripletexId: customer.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      } catch (error) {
        // Stop sync if we can't fetch customers
        console.error("Failed to fetch customers from Tripletex:", error);
        break;
      }
    }

    return result;
  },

  /**
   * Sync customers that haven't been synced recently
   * @param maxAgeHours - Maximum age in hours before re-sync
   */
  async syncStaleCustomers(maxAgeHours = 24): Promise<CustomerSyncResult> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    // Get customers that need refresh
    const staleCustomers = await db.customerCache.findMany({
      where: {
        syncedAt: {
          lt: cutoffDate,
        },
      },
      select: {
        tripletexId: true,
      },
    });

    const result: CustomerSyncResult = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const { tripletexId } of staleCustomers) {
      try {
        await this.syncCustomer(tripletexId);
        result.synced++;
        result.updated++;
      } catch (error) {
        result.errors.push({
          tripletexId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  },

  /**
   * Search for customer in local cache or sync from Tripletex
   */
  async findOrSyncCustomer(tripletexId: number) {
    // First check local cache
    let customer = await db.customerCache.findUnique({
      where: { tripletexId },
    });

    // If not found or stale, sync from Tripletex
    if (!customer) {
      await this.syncCustomer(tripletexId);
      customer = await db.customerCache.findUnique({
        where: { tripletexId },
      });
    }

    return customer;
  },

  /**
   * Search customers in Tripletex and sync results to local cache
   */
  async searchAndSync(query: string) {
    // Search in Tripletex
    const tripletexResults = await tripletexCustomers.search({
      customerAccountNumber: query,
    });

    // Also search by organization number and email
    const [orgResults, emailResults] = await Promise.all([
      tripletexCustomers.search({ organizationNumber: query }),
      tripletexCustomers.search({ email: query }),
    ]);

    // Combine unique results
    const allResults = [...tripletexResults, ...orgResults, ...emailResults];
    const uniqueIds = new Set<number>();
    const uniqueResults = allResults.filter((c) => {
      if (uniqueIds.has(c.id)) return false;
      uniqueIds.add(c.id);
      return true;
    });

    // Sync all found customers
    for (const customer of uniqueResults) {
      const data = mapTripletexCustomerToCache(customer);
      await db.customerCache.upsert({
        where: { tripletexId: customer.id },
        create: { ...data, syncedAt: new Date() },
        update: { ...data, syncedAt: new Date() },
      });
    }

    // Return from local cache
    return db.customerCache.findMany({
      where: {
        tripletexId: {
          in: Array.from(uniqueIds),
        },
      },
    });
  },
};
