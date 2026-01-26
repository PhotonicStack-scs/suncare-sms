import { env } from "~/env";
import type {
  TripletexListResponse,
  TripletexSingleResponse,
  TripletexCustomer,
  TripletexProduct,
  TripletexInvoice,
  CreateTripletexInvoice,
} from "~/types/tripletex";

/**
 * Tripletex API Client
 * Handles authentication and API requests to Tripletex
 */
class TripletexClient {
  private baseUrl: string;
  private sessionToken: string | null = null;
  private sessionExpires: Date | null = null;

  constructor() {
    this.baseUrl = env.TRIPLETEX_API_BASE_URL;
  }

  /**
   * Get or create a session token
   */
  private async getSessionToken(): Promise<string> {
    // Check if existing session is still valid (with 5 min buffer)
    if (this.sessionToken && this.sessionExpires) {
      const bufferMs = 5 * 60 * 1000;
      if (this.sessionExpires.getTime() - bufferMs > Date.now()) {
        return this.sessionToken;
      }
    }

    // Create new session
    const response = await fetch(`${this.baseUrl}/token/session/:create`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `0:${env.TRIPLETEX_CONSUMER_TOKEN}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        employeeToken: env.TRIPLETEX_EMPLOYEE_TOKEN,
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Tripletex session: ${error}`);
    }

    const data = (await response.json()) as TripletexSingleResponse<{
      token: string;
      expirationDate: string;
    }>;

    this.sessionToken = data.value.token;
    this.sessionExpires = new Date(data.value.expirationDate);

    return this.sessionToken;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getSessionToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`0:${token}`).toString("base64")}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * POST request helper
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request helper
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request helper
   */
  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: "DELETE" });
  }

  // ==========================================
  // Customer endpoints
  // ==========================================

  async getCustomers(params?: {
    id?: string;
    customerAccountNumber?: string;
    organizationNumber?: string;
    email?: string;
    isSupplier?: boolean;
    isCustomer?: boolean;
    isInactive?: boolean;
    from?: number;
    count?: number;
  }): Promise<TripletexListResponse<TripletexCustomer>> {
    const queryParams: Record<string, string> = {};

    if (params?.id) queryParams.id = params.id;
    if (params?.customerAccountNumber)
      queryParams.customerAccountNumber = params.customerAccountNumber;
    if (params?.organizationNumber)
      queryParams.organizationNumber = params.organizationNumber;
    if (params?.email) queryParams.email = params.email;
    if (params?.isSupplier !== undefined)
      queryParams.isSupplier = String(params.isSupplier);
    if (params?.isCustomer !== undefined)
      queryParams.isCustomer = String(params.isCustomer);
    if (params?.isInactive !== undefined)
      queryParams.isInactive = String(params.isInactive);
    if (params?.from !== undefined) queryParams.from = String(params.from);
    if (params?.count !== undefined) queryParams.count = String(params.count);

    return this.get<TripletexListResponse<TripletexCustomer>>(
      "/customer",
      queryParams
    );
  }

  async getCustomer(id: number): Promise<TripletexSingleResponse<TripletexCustomer>> {
    return this.get<TripletexSingleResponse<TripletexCustomer>>(`/customer/${id}`);
  }

  async searchCustomers(
    query: string,
    limit = 20
  ): Promise<TripletexListResponse<TripletexCustomer>> {
    return this.get<TripletexListResponse<TripletexCustomer>>("/customer", {
      isCustomer: "true",
      isInactive: "false",
      count: String(limit),
    });
  }

  // ==========================================
  // Product endpoints
  // ==========================================

  async getProducts(params?: {
    number?: string;
    name?: string;
    isInactive?: boolean;
    from?: number;
    count?: number;
  }): Promise<TripletexListResponse<TripletexProduct>> {
    const queryParams: Record<string, string> = {};

    if (params?.number) queryParams.number = params.number;
    if (params?.name) queryParams.name = params.name;
    if (params?.isInactive !== undefined)
      queryParams.isInactive = String(params.isInactive);
    if (params?.from !== undefined) queryParams.from = String(params.from);
    if (params?.count !== undefined) queryParams.count = String(params.count);

    return this.get<TripletexListResponse<TripletexProduct>>(
      "/product",
      queryParams
    );
  }

  async getProduct(id: number): Promise<TripletexSingleResponse<TripletexProduct>> {
    return this.get<TripletexSingleResponse<TripletexProduct>>(`/product/${id}`);
  }

  // ==========================================
  // Invoice endpoints
  // ==========================================

  async getInvoices(params?: {
    id?: string;
    invoiceDateFrom?: string;
    invoiceDateTo?: string;
    customerId?: string;
    from?: number;
    count?: number;
  }): Promise<TripletexListResponse<TripletexInvoice>> {
    const queryParams: Record<string, string> = {};

    if (params?.id) queryParams.id = params.id;
    if (params?.invoiceDateFrom)
      queryParams.invoiceDateFrom = params.invoiceDateFrom;
    if (params?.invoiceDateTo) queryParams.invoiceDateTo = params.invoiceDateTo;
    if (params?.customerId) queryParams["customer.id"] = params.customerId;
    if (params?.from !== undefined) queryParams.from = String(params.from);
    if (params?.count !== undefined) queryParams.count = String(params.count);

    return this.get<TripletexListResponse<TripletexInvoice>>(
      "/invoice",
      queryParams
    );
  }

  async getInvoice(id: number): Promise<TripletexSingleResponse<TripletexInvoice>> {
    return this.get<TripletexSingleResponse<TripletexInvoice>>(`/invoice/${id}`);
  }

  async createInvoice(
    invoice: CreateTripletexInvoice
  ): Promise<TripletexSingleResponse<TripletexInvoice>> {
    return this.post<TripletexSingleResponse<TripletexInvoice>>(
      "/invoice",
      invoice
    );
  }

  async sendInvoice(id: number, sendType: "EMAIL" | "EHF" = "EMAIL"): Promise<void> {
    await this.put(`/invoice/${id}/:send`, { sendType });
  }
}

// Export singleton instance
export const tripletexClient = new TripletexClient();
