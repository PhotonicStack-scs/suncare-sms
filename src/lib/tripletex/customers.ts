import { tripletexClient } from "./client";
import type { 
  TripletexCustomer, 
  TripletexCustomerSearchParams 
} from "~/types/tripletex";

/**
 * Customer operations for Tripletex API
 */
export const tripletexCustomers = {
  /**
   * Search for customers
   */
  async search(params?: TripletexCustomerSearchParams): Promise<TripletexCustomer[]> {
    const response = await tripletexClient.getList<TripletexCustomer>(
      "/customer",
      {
        ...params,
        isCustomer: true,
        fields: "id,name,organizationNumber,email,invoiceEmail,phoneNumber,phoneNumberMobile,postalAddress(*),physicalAddress(*),isInactive",
      }
    );
    
    return response.values;
  },

  /**
   * Get a single customer by ID
   */
  async getById(id: number): Promise<TripletexCustomer> {
    const response = await tripletexClient.get<TripletexCustomer>(
      `/customer/${id}`,
      {
        fields: "id,name,organizationNumber,email,invoiceEmail,phoneNumber,phoneNumberMobile,postalAddress(*),physicalAddress(*),isInactive",
      }
    );
    
    return response.value;
  },

  /**
   * Search by organization number
   */
  async getByOrgNumber(orgNumber: string): Promise<TripletexCustomer | null> {
    const customers = await this.search({ organizationNumber: orgNumber });
    return customers[0] ?? null;
  },

  /**
   * Search by email
   */
  async getByEmail(email: string): Promise<TripletexCustomer | null> {
    const customers = await this.search({ email });
    return customers[0] ?? null;
  },

  /**
   * Get all active customers with pagination
   */
  async getAll(page = 0, pageSize = 100): Promise<{
    customers: TripletexCustomer[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await tripletexClient.getList<TripletexCustomer>(
      "/customer",
      {
        isCustomer: true,
        isInactive: false,
        from: page * pageSize,
        count: pageSize,
        fields: "id,name,organizationNumber,email,invoiceEmail,phoneNumber,phoneNumberMobile,postalAddress(*),physicalAddress(*)",
      }
    );
    
    return {
      customers: response.values,
      total: response.fullResultSize,
      hasMore: (page + 1) * pageSize < response.fullResultSize,
    };
  },
};

/**
 * Convert Tripletex customer to local cache format
 */
export function mapTripletexCustomerToCache(customer: TripletexCustomer) {
  const formatAddress = (addr?: { addressLine1?: string; addressLine2?: string; postalCode?: string; city?: string }) => {
    if (!addr) return null;
    const parts = [addr.addressLine1, addr.addressLine2, addr.postalCode, addr.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return {
    tripletexId: customer.id,
    name: customer.name,
    orgNumber: customer.organizationNumber ?? null,
    contactPerson: null, // Tripletex doesn't have a direct contact person field
    email: customer.email ?? null,
    phone: customer.phoneNumber ?? customer.phoneNumberMobile ?? null,
    postalAddress: formatAddress(customer.postalAddress),
    physicalAddress: formatAddress(customer.physicalAddress),
    invoiceEmail: customer.invoiceEmail ?? customer.email ?? null,
  };
}
