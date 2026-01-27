// Tripletex API Response Types
// Based on Tripletex API v2 documentation

export interface TripletexResponse<T> {
  value: T;
}

export interface TripletexListResponse<T> {
  fullResultSize: number;
  from: number;
  count: number;
  versionDigest: string;
  values: T[];
}

// Customer types
export interface TripletexCustomer {
  id: number;
  version: number;
  name: string;
  organizationNumber?: string;
  supplierNumber?: number;
  customerNumber?: number;
  isSupplier: boolean;
  isCustomer: boolean;
  isInactive: boolean;
  email?: string;
  invoiceEmail?: string;
  phoneNumber?: string;
  phoneNumberMobile?: string;
  description?: string;
  language?: string;
  accountManager?: TripletexEmployee;
  postalAddress?: TripletexAddress;
  physicalAddress?: TripletexAddress;
  deliveryAddress?: TripletexAddress;
  category1?: TripletexCategory;
  category2?: TripletexCategory;
  category3?: TripletexCategory;
}

export interface TripletexAddress {
  id?: number;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: TripletexCountry;
}

export interface TripletexCountry {
  id: number;
  name?: string;
}

export interface TripletexCategory {
  id: number;
  name?: string;
  number?: string;
}

export interface TripletexEmployee {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Product types
export interface TripletexProduct {
  id: number;
  version: number;
  name: string;
  number?: string;
  description?: string;
  priceExcludingVatCurrency?: number;
  priceIncludingVatCurrency?: number;
  costExcludingVatCurrency?: number;
  isInactive: boolean;
  productUnit?: TripletexProductUnit;
  vatType?: TripletexVatType;
  department?: TripletexDepartment;
  account?: TripletexAccount;
}

export interface TripletexProductUnit {
  id: number;
  name?: string;
  nameShort?: string;
}

export interface TripletexVatType {
  id: number;
  name?: string;
  number?: string;
  percentage?: number;
}

export interface TripletexDepartment {
  id: number;
  name?: string;
  departmentNumber?: string;
}

export interface TripletexAccount {
  id: number;
  number: number;
  name?: string;
}

// Invoice types
export interface TripletexInvoice {
  id: number;
  version: number;
  invoiceNumber?: number;
  invoiceDate: string;
  customer: TripletexCustomer;
  dueDate: string;
  comment?: string;
  orders?: TripletexOrder[];
  projectInvoiceDetails?: TripletexProjectInvoiceDetails[];
  voucher?: TripletexVoucher;
  currency?: TripletexCurrency;
  invoiceDueIn?: number;
  invoiceDueInType?: string;
  isCreditNote: boolean;
  ehfSendStatus?: string;
}

export interface TripletexOrder {
  id: number;
  customer: TripletexCustomer;
  orderDate: string;
  orderLines?: TripletexOrderLine[];
}

export interface TripletexOrderLine {
  id: number;
  version: number;
  order?: TripletexOrder;
  product?: TripletexProduct;
  description?: string;
  count?: number;
  unitCostCurrency?: number;
  unitPriceExcludingVatCurrency?: number;
  unitPriceIncludingVatCurrency?: number;
  vatType?: TripletexVatType;
  amountExcludingVatCurrency?: number;
  amountIncludingVatCurrency?: number;
}

export interface TripletexProjectInvoiceDetails {
  id: number;
  project?: TripletexProject;
}

export interface TripletexProject {
  id: number;
  name?: string;
  number?: string;
  description?: string;
  projectManager?: TripletexEmployee;
  customer?: TripletexCustomer;
}

export interface TripletexVoucher {
  id: number;
  number?: number;
  date?: string;
}

export interface TripletexCurrency {
  id: number;
  code?: string;
}

// API Request types
export interface TripletexCustomerSearchParams {
  id?: string;
  customerAccountNumber?: string;
  organizationNumber?: string;
  email?: string;
  invoiceEmail?: string;
  isInactive?: boolean;
  isCustomer?: boolean;
  from?: number;
  count?: number;
  sorting?: string;
  fields?: string;
}

export interface TripletexInvoiceCreateRequest {
  invoiceDate: string;
  customer: { id: number };
  orders?: Array<{
    customer: { id: number };
    orderDate: string;
    orderLines: Array<{
      product?: { id: number };
      description: string;
      count: number;
      unitPriceExcludingVatCurrency: number;
      vatType?: { id: number };
    }>;
  }>;
  comment?: string;
  invoiceDueIn?: number;
  invoiceDueInType?: "DAYS" | "MONTHS" | "RECURRING_DAY_OF_MONTH";
}

// Session token types
export interface TripletexTokenResponse {
  value: {
    id: number;
    version: number;
    consumerToken: {
      id: number;
    };
    employeeToken: {
      id: number;
    };
    expirationDate: string;
    token: string;
  };
}

// Sync result types
export interface CustomerSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: Array<{
    tripletexId: number;
    error: string;
  }>;
}
