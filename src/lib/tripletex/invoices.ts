import { tripletexClient } from "./client";
import type { 
  TripletexInvoice, 
  TripletexInvoiceCreateRequest 
} from "~/types/tripletex";

/**
 * Invoice operations for Tripletex API
 */
export const tripletexInvoices = {
  /**
   * Get invoice by ID
   */
  async getById(id: number): Promise<TripletexInvoice> {
    const response = await tripletexClient.get<TripletexInvoice>(
      `/invoice/${id}`,
      {
        fields: "*,orders(*),customer(*)",
      }
    );
    
    return response.value;
  },

  /**
   * Create a new invoice
   */
  async create(request: TripletexInvoiceCreateRequest): Promise<TripletexInvoice> {
    const response = await tripletexClient.post<TripletexInvoice, TripletexInvoiceCreateRequest>(
      "/invoice",
      request
    );
    
    return response.value;
  },

  /**
   * Create invoice for a service visit
   */
  async createForVisit(params: {
    customerId: number;
    invoiceDate: Date;
    dueInDays: number;
    lines: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      productId?: number;
    }>;
    comment?: string;
  }): Promise<TripletexInvoice> {
    const request: TripletexInvoiceCreateRequest = {
      invoiceDate: params.invoiceDate.toISOString().split("T")[0]!,
      customer: { id: params.customerId },
      invoiceDueIn: params.dueInDays,
      invoiceDueInType: "DAYS",
      comment: params.comment,
      orders: [
        {
          customer: { id: params.customerId },
          orderDate: params.invoiceDate.toISOString().split("T")[0]!,
          orderLines: params.lines.map((line) => ({
            product: line.productId ? { id: line.productId } : undefined,
            description: line.description,
            count: line.quantity,
            unitPriceExcludingVatCurrency: line.unitPrice,
          })),
        },
      ],
    };

    return this.create(request);
  },

  /**
   * Send invoice by email (EHF)
   */
  async send(id: number): Promise<void> {
    await tripletexClient.put(`/invoice/${id}/:send`, {
      sendType: "EMAIL",
    });
  },

  /**
   * Get invoices for a customer
   */
  async getByCustomer(customerId: number): Promise<TripletexInvoice[]> {
    const response = await tripletexClient.getList<TripletexInvoice>(
      "/invoice",
      {
        customerId: customerId.toString(),
        fields: "id,invoiceNumber,invoiceDate,dueDate,customer(*),isCreditNote",
      }
    );
    
    return response.values;
  },
};
