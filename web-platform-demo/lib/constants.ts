import type { FieldConfig } from "./types";

export const FIELD_DEFAULTS: FieldConfig[] = [
  ["firstName", "First Name", true, true],
  ["lastName", "Last Name", true, true],
  ["organisation", "Organisation name", true, false],
  ["email", "Email", true, true],
  ["contact", "Contact number", true, true],
  ["address1", "Street Address", true, true],
  ["address2", "Street Address Line 2", true, false],
  ["city", "City", true, true],
  ["state", "State / Province", true, false],
  ["postal", "Postal / Zip Code", true, false],
  ["country", "Country", true, true],
  ["beneficiary", "Beneficiary name", true, true],
  ["bankAccount", "Bank account number", true, true],
  ["bankName", "Bank name", true, true],
  ["bankAddress", "Bank address", true, false],
  ["branchCode", "Branch code", true, false],
  ["swiftCode", "SWIFT code", true, false],
  ["signature", "Signature", true, true],
  ["dob", "Date of Birth", true, true],
  ["routingNumber", "Routing Number", true, false],
  ["gamingIgn", "Gaming / IGN account name", true, false],
  ["nationalIdPassport", "National ID Card Number / Passport Number", true, true],
  ["paymentMethod", "Payment Method", true, true],
  ["wiseId", "Wise ID", true, true],
  ["wisePaymentLink", "Wise Payment Link", true, true],
  ["payoneerId", "Payoneer ID", true, true],
  ["payoneerPaymentLink", "Payoneer Payment Link", true, true],
  ["paypalId", "PayPal ID", true, true],
  ["paypalPaymentLink", "PayPal Payment Link", true, true],
].map(([key, label, show, required]) => ({
  key: key as string,
  label: label as string,
  show: show as boolean,
  required: required as boolean,
}));

export const PAYMENT_METHODS = ["Bank Transfer", "Wise", "Payoneer", "PayPal"];

export const DEFAULT_VERIFICATION =
  "Please confirm that all information provided above is true, complete, and accurate. IGE will not be responsible for payments made to incorrect accounts as a result of inaccurate or incomplete information provided by the submitter. Please review all details carefully, sign below, and submit this payment request.";

export const DEFAULT_CONFIRMATION =
  "I confirm that I have reviewed the information above and that all details provided are accurate.";

export const FAVICON_URL =
  "https://raw.githubusercontent.com/Y45UK3/gsheet-payment-tracker/main/assets/ingame-global-favicon-exact.png";
