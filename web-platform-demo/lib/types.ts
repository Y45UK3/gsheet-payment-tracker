export type ServiceItem = {
  quantity: string;
  description: string;
  unitPrice: string;
  total: string;
};

export type FieldConfig = {
  key: string;
  label: string;
  show: boolean;
  required: boolean;
};

export type InvoiceDraft = {
  formTitle: string;
  project: string;
  invoice: string;
  date: string;
  currency: string;
  amount: string;
  showServices: boolean;
  services: ServiceItem[];
  fields: FieldConfig[];
  paymentMethods: string[];
  routing: {
    to: string;
    cc: string[];
  };
  text: {
    verificationText: string;
    verificationCheckboxLabel: string;
  };
};

export type GeneratedInvoice = {
  id: string;
  project: string;
  invoice: string;
  date: string;
  currency: string;
  amount: string;
  link: string;
  createdAt: string;
  status: "Open" | "Submitted" | "Unknown";
};
