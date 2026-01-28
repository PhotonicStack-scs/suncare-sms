import { tripletexClient } from "./client";
import type { TripletexProduct } from "~/types/tripletex";

/**
 * Product operations for Tripletex API
 */
export const tripletexProducts = {
  /**
   * Get all active products
   */
  async getAll(): Promise<TripletexProduct[]> {
    const response = await tripletexClient.getList<TripletexProduct>(
      "/product",
      {
        isInactive: false,
        fields: "id,name,number,description,priceExcludingVatCurrency,priceIncludingVatCurrency,productUnit(*),vatType(*)",
      }
    );
    
    return response.values;
  },

  /**
   * Get a single product by ID
   */
  async getById(id: number): Promise<TripletexProduct> {
    const response = await tripletexClient.get<TripletexProduct>(
      `/product/${id}`,
      {
        fields: "id,name,number,description,priceExcludingVatCurrency,priceIncludingVatCurrency,productUnit(*),vatType(*)",
      }
    );
    
    return response.value;
  },

  /**
   * Search products by name
   */
  async search(query: string): Promise<TripletexProduct[]> {
    const products = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.number?.toLowerCase().includes(lowerQuery) ?? false) ||
        (p.description?.toLowerCase().includes(lowerQuery) ?? false)
    );
  },
};
