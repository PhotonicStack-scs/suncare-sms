import { tripletexClient } from "./client";
import { db } from "~/server/db";
import type { 
  TripletexInvoice, 
  CreateTripletexInvoice,
  CreateTripletexOrderLine,
} from "~/types/tripletex";

/**
 * Invoice operations with Tripletex
 */

export interface CreateInvoiceParams {
  customerId: string; // Tripletex customer ID
  agreementId?: string; // Local agreement ID for linking
  invoiceDate: Date;
  dueDate: Date;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string; // Tripletex product ID
    vatTypeId?: number;
  }>;
  comment?: string;
}

export interface InvoiceResult {
  tripletexId: number;
  invoiceNumber?: number;
  localId?: string;
  success: boolean;
  error?: string;
}

/**
 * Create an invoice in Tripletex and store reference locally
 */
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<InvoiceResult> {
  try {
    // Calculate totals
    const subtotal = params.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0
    );
    const vatRate = 0.25; // 25% MVA
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    // Create order first (Tripletex requires order before invoice)
    // For now, we'll create invoice directly with order lines embedded
    const tripletexInvoice: CreateTripletexInvoice = {
      invoiceDate: params.invoiceDate.toISOString().split("T")[0]!,
      invoiceDueDate: params.dueDate.toISOString().split("T")[0]!,
      customerId: parseInt(params.customerId, 10),
      comment: params.comment,
    };

    const response = await tripletexClient.createInvoice(tripletexInvoice);
    const invoice = response.value;

    // Store reference in local database
    const localInvoice = await db.invoice.create({
      data: {
        tripletexId: String(invoice.id),
        invoiceNumber: invoice.invoiceNumber?.toString() ?? null,
        customerId: params.customerId,
        agreementId: params.agreementId ?? null,
        amount: subtotal,
        vatAmount,
        totalAmount,
        currency: "NOK",
        status: "PENDING",
        dueDate: params.dueDate,
        description: params.comment ?? null,
        lineItems: params.lines,
      },
    });

    return {
      tripletexId: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? undefined,
      localId: localInvoice.id,
      success: true,
    };
  } catch (error) {
    return {
      tripletexId: 0,
      success: false,
      error: error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
}

/**
 * Send an invoice via email or EHF
 */
export async function sendInvoice(
  tripletexId: number,
  sendType: "EMAIL" | "EHF" = "EMAIL"
): Promise<{ success: boolean; error?: string }> {
  try {
    await tripletexClient.sendInvoice(tripletexId, sendType);

    // Update local record
    await db.invoice.updateMany({
      where: { tripletexId: String(tripletexId) },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send invoice",
    };
  }
}

/**
 * Sync invoice status from Tripletex
 */
export async function syncInvoiceStatus(tripletexId: number): Promise<void> {
  const response = await tripletexClient.getInvoice(tripletexId);
  const invoice = response.value;

  const status = invoice.isPaid
    ? "PAID"
    : invoice.amountOutstandingCurrency === 0
    ? "PAID"
    : new Date(invoice.invoiceDueDate) < new Date()
    ? "OVERDUE"
    : "SENT";

  await db.invoice.updateMany({
    where: { tripletexId: String(tripletexId) },
    data: {
      status,
      paidAt: invoice.isPaid ? new Date() : null,
    },
  });
}

/**
 * Get invoices for a customer from Tripletex
 */
export async function getCustomerInvoices(
  customerId: string,
  params?: {
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }
): Promise<TripletexInvoice[]> {
  const response = await tripletexClient.getInvoices({
    customerId,
    invoiceDateFrom: params?.fromDate?.toISOString().split("T")[0],
    invoiceDateTo: params?.toDate?.toISOString().split("T")[0],
    count: params?.limit ?? 50,
  });

  return response.values;
}

/**
 * Create invoice from completed service visit
 */
export async function createVisitInvoice(visitId: string): Promise<InvoiceResult> {
  // Get visit with agreement and customer info
  const visit = await db.serviceVisit.findUnique({
    where: { id: visitId },
    include: {
      agreement: {
        include: {
          installation: {
            include: {
              customer: true,
            },
          },
          addons: {
            include: {
              addon: true,
            },
          },
        },
      },
    },
  });

  if (!visit) {
    return { tripletexId: 0, success: false, error: "Visit not found" };
  }

  if (visit.status !== "COMPLETED") {
    return { tripletexId: 0, success: false, error: "Visit must be completed" };
  }

  const agreement = visit.agreement;
  const customer = agreement.installation.customer;

  // Build invoice lines
  const lines: CreateInvoiceParams["lines"] = [];

  // Add base service fee (pro-rated if visit frequency > 1)
  const visitPrice = Number(agreement.basePrice) / agreement.visitFrequency;
  lines.push({
    description: `Serviceavtale - ${agreement.agreementNumber}`,
    quantity: 1,
    unitPrice: visitPrice,
  });

  // Add addon fees
  for (const addon of agreement.addons) {
    if (addon.addon.frequency === "PER_VISIT") {
      lines.push({
        description: addon.addon.name,
        quantity: addon.quantity,
        unitPrice: Number(addon.customPrice ?? addon.addon.basePrice),
        productId: addon.addon.tripletexProductId ?? undefined,
      });
    }
  }

  // Create the invoice
  return createInvoice({
    customerId: customer.tripletexId,
    agreementId: agreement.id,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    lines,
    comment: `Service utført ${new Date(visit.completedAt ?? visit.scheduledDate).toLocaleDateString("nb-NO")}`,
  });
}
