// Tripletex API types

export interface TripletexCustomer {
  id: number;
  name: string;
  organizationNumber?: string;
  email?: string;
  phoneNumber?: string;
  phoneNumberMobile?: string;
  invoiceEmail?: string;
  postalAddress?: TripletexAddress;
  physicalAddress?: TripletexAddress;
  isCustomer: boolean;
  isSupplier: boolean;
  isInactive: boolean;
  accountManager?: TripletexEmployee;
}

export interface TripletexAddress {
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface TripletexEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumberMobile?: string;
}

export interface TripletexProduct {
  id: number;
  number?: string;
  name: string;
  description?: string;
  costExcludingVatCurrency?: number;
  priceExcludingVatCurrency?: number;
  priceIncludingVatCurrency?: number;
  vatType?: {
    id: number;
    name: string;
    percentage: number;
  };
  isInactive: boolean;
  productUnit?: {
    id: number;
    name: string;
    shortName?: string;
  };
}

export interface TripletexInvoice {
  id: number;
  invoiceNumber?: number;
  invoiceDate: string;
  customer: { id: number };
  invoiceDueDate: string;
  orders?: TripletexOrder[];
  voucher?: {
    id: number;
  };
  currency?: {
    id: number;
    code: string;
  };
  amountCurrency?: number;
  amountExcludingVatCurrency?: number;
  amountRoundoffCurrency?: number;
  amountOutstandingCurrency?: number;
  isCreditNote: boolean;
  comment?: string;
  isPaid: boolean;
}

export interface TripletexOrder {
  id: number;
  number?: string;
  customer: { id: number };
  orderDate: string;
  deliveryDate?: string;
  orderLines?: TripletexOrderLine[];
}

export interface TripletexOrderLine {
  id: number;
  order: { id: number };
  product?: { id: number };
  description: string;
  count: number;
  unitCostCurrency?: number;
  unitPriceExcludingVatCurrency?: number;
  amountExcludingVatCurrency?: number;
  amountIncludingVatCurrency?: number;
  vatType?: { id: number };
}

// API Response wrapper
export interface TripletexListResponse<T> {
  fullResultSize: number;
  from: number;
  count: number;
  versionDigest?: string;
  values: T[];
}

export interface TripletexSingleResponse<T> {
  value: T;
}

// Create/Update types
export interface CreateTripletexInvoice {
  invoiceDate: string;
  invoiceDueDate: string;
  customerId: number;
  orders?: Array<{
    orderId: number;
  }>;
  comment?: string;
}

export interface CreateTripletexOrderLine {
  productId?: number;
  description: string;
  count: number;
  unitPriceExcludingVatCurrency: number;
  vatTypeId?: number;
}

// Sync types
export interface CustomerSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: Array<{
    tripletexId: number;
    error: string;
  }>;
  lastSyncedAt: Date;
}

// Mapping helpers
export function mapTripletexCustomerToCache(customer: TripletexCustomer) {
  return {
    tripletexId: String(customer.id),
    name: customer.name,
    orgNumber: customer.organizationNumber ?? null,
    contactPerson: customer.accountManager 
      ? `${customer.accountManager.firstName} ${customer.accountManager.lastName}`
      : null,
    email: customer.email ?? null,
    phone: customer.phoneNumber ?? customer.phoneNumberMobile ?? null,
    address: customer.physicalAddress?.addressLine1 ?? customer.postalAddress?.addressLine1 ?? null,
    postalCode: customer.physicalAddress?.postalCode ?? customer.postalAddress?.postalCode ?? null,
    city: customer.physicalAddress?.city ?? customer.postalAddress?.city ?? null,
    invoiceEmail: customer.invoiceEmail ?? customer.email ?? null,
  };
}

export function formatTripletexAddress(address?: TripletexAddress): string {
  if (!address) return "";
  const parts = [
    address.addressLine1,
    address.addressLine2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.country?.name,
  ].filter(Boolean);
  return parts.join(", ");
}
