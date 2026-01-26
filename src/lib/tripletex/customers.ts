import { tripletexClient } from "./client";
import { db } from "~/server/db";
import { mapTripletexCustomerToCache, type TripletexCustomer } from "~/types/tripletex";

/**
 * Customer sync operations between Tripletex and local cache
 */

export interface CustomerSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: Array<{
    tripletexId: string;
    error: string;
  }>;
  lastSyncedAt: Date;
}

/**
 * Sync a single customer from Tripletex to local cache
 */
export async function syncCustomer(tripletexId: number): Promise<void> {
  const response = await tripletexClient.getCustomer(tripletexId);
  const customer = response.value;

  if (!customer.isCustomer) {
    throw new Error("Entity is not a customer in Tripletex");
  }

  const cacheData = mapTripletexCustomerToCache(customer);

  await db.customerCache.upsert({
    where: { tripletexId: cacheData.tripletexId },
    create: {
      ...cacheData,
      syncedAt: new Date(),
    },
    update: {
      ...cacheData,
      syncedAt: new Date(),
    },
  });
}

/**
 * Sync all active customers from Tripletex
 */
export async function syncAllCustomers(
  batchSize = 100
): Promise<CustomerSyncResult> {
  const result: CustomerSyncResult = {
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
    lastSyncedAt: new Date(),
  };

  let from = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await tripletexClient.getCustomers({
        isCustomer: true,
        isInactive: false,
        from,
        count: batchSize,
      });

      const customers = response.values;

      for (const customer of customers) {
        try {
          const cacheData = mapTripletexCustomerToCache(customer);

          const existing = await db.customerCache.findUnique({
            where: { tripletexId: cacheData.tripletexId },
          });

          await db.customerCache.upsert({
            where: { tripletexId: cacheData.tripletexId },
            create: {
              ...cacheData,
              syncedAt: new Date(),
            },
            update: {
              ...cacheData,
              syncedAt: new Date(),
            },
          });

          result.synced++;
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          result.errors.push({
            tripletexId: String(customer.id),
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Check if there are more customers to fetch
      hasMore = from + customers.length < response.fullResultSize;
      from += batchSize;
    } catch (error) {
      // If batch fails, stop sync
      result.errors.push({
        tripletexId: "batch",
        error: error instanceof Error ? error.message : "Batch fetch failed",
      });
      hasMore = false;
    }
  }

  return result;
}

/**
 * Search customers in Tripletex (for autocomplete/lookup)
 */
export async function searchTripletexCustomers(
  query: string,
  limit = 20
): Promise<TripletexCustomer[]> {
  // Note: Tripletex doesn't have great search, so we fetch and filter locally
  const response = await tripletexClient.getCustomers({
    isCustomer: true,
    isInactive: false,
    count: 1000, // Get a larger set to filter
  });

  const normalizedQuery = query.toLowerCase();
  
  return response.values
    .filter(
      (c) =>
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.organizationNumber?.includes(query) ||
        c.email?.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, limit);
}

/**
 * Get customer from cache, syncing from Tripletex if not found
 */
export async function getCustomerWithSync(tripletexId: string) {
  // Try to get from cache first
  let customer = await db.customerCache.findUnique({
    where: { tripletexId },
  });

  // If not in cache or stale (older than 24 hours), sync from Tripletex
  if (!customer || isCustomerStale(customer.syncedAt)) {
    try {
      await syncCustomer(parseInt(tripletexId, 10));
      customer = await db.customerCache.findUnique({
        where: { tripletexId },
      });
    } catch (error) {
      // If sync fails and we have cached data, return it
      if (customer) {
        console.warn(`Failed to sync customer ${tripletexId}, using cached data`);
      } else {
        throw error;
      }
    }
  }

  return customer;
}

/**
 * Check if customer data is stale (older than 24 hours)
 */
function isCustomerStale(syncedAt: Date): boolean {
  const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - syncedAt.getTime() > staleThreshold;
}

/**
 * Get all cached customers with optional filters
 */
export async function getCachedCustomers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where = params?.search
    ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" as const } },
          { email: { contains: params.search, mode: "insensitive" as const } },
          { orgNumber: { contains: params.search } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    db.customerCache.findMany({
      where,
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      orderBy: { name: "asc" },
    }),
    db.customerCache.count({ where }),
  ]);

  return { customers, total };
}
