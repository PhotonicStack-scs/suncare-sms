import { env } from "~/env";
import type { 
  TripletexResponse, 
  TripletexListResponse, 
  TripletexTokenResponse 
} from "~/types/tripletex";

// Session token cache
let sessionToken: string | null = null;
let tokenExpiry: Date | null = null;

/**
 * Tripletex API Client
 * Handles authentication and HTTP requests to Tripletex API
 */
class TripletexClient {
  private baseUrl: string;
  private consumerToken: string;
  private employeeToken: string;

  constructor() {
    this.baseUrl = env.TRIPLETEX_API_BASE_URL;
    this.consumerToken = env.TRIPLETEX_CONSUMER_TOKEN;
    this.employeeToken = env.TRIPLETEX_EMPLOYEE_TOKEN;
  }

  /**
   * Get or create a session token
   */
  private async getSessionToken(): Promise<string> {
    // Check if we have a valid cached token
    if (sessionToken && tokenExpiry && tokenExpiry > new Date()) {
      return sessionToken;
    }

    // Create new session token
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1); // 1 day expiry

    const response = await fetch(
      `${this.baseUrl}/token/session/:create?consumerToken=${this.consumerToken}&employeeToken=${this.employeeToken}&expirationDate=${expirationDate.toISOString().split("T")[0]}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Tripletex session: ${response.statusText}`);
    }

    const data = await response.json() as TripletexTokenResponse;
    sessionToken = data.value.token;
    tokenExpiry = new Date(data.value.expirationDate);

    return sessionToken;
  }

  /**
   * Get authorization header for API requests
   */
  private async getAuthHeader(): Promise<string> {
    const token = await this.getSessionToken();
    // Tripletex uses Basic auth with 0:token
    return `Basic ${Buffer.from(`0:${token}`).toString("base64")}`;
  }

  /**
   * Make a GET request to Tripletex API
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<TripletexResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<TripletexResponse<T>>;
  }

  /**
   * Make a GET request that returns a list
   */
  async getList<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<TripletexListResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<TripletexListResponse<T>>;
  }

  /**
   * Make a POST request to Tripletex API
   */
  async post<T, B>(endpoint: string, body: B): Promise<TripletexResponse<T>> {
    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<TripletexResponse<T>>;
  }

  /**
   * Make a PUT request to Tripletex API
   */
  async put<T, B>(endpoint: string, body: B): Promise<TripletexResponse<T>> {
    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<TripletexResponse<T>>;
  }

  /**
   * Clear cached session token
   */
  clearSession(): void {
    sessionToken = null;
    tokenExpiry = null;
  }
}

// Export singleton instance
export const tripletexClient = new TripletexClient();
