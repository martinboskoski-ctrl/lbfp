import { z } from 'zod';

// Deposit / balance payment pairs — the two values must sum to 100
const PAYMENT_PAIRS = [
  { deposit: 70, balance: 30 },
  { deposit: 60, balance: 40 },
  { deposit: 50, balance: 50 },
];

export const DEPOSIT_OPTIONS = PAYMENT_PAIRS.map((p) => ({
  value: String(p.deposit),
  label: `${p.deposit}% deposit / ${p.balance}% balance`,
}));

export const plAgreementSchema = z.object({
  // Effective / signing date
  effectiveDate: z.string().min(1, 'Effective date is required'),

  // Customer (second party) — English only fields
  companyName:    z.string().min(1, 'Company name is required'),
  companyAddress: z.string().min(1, 'Company address is required'),
  companyCRN:     z.string().min(1, 'Organisation number is required'),
  companyCEO:     z.string().min(1, 'CEO / authorised representative name is required'),
  customerEmail:  z
    .string()
    .min(1, 'Customer email is required')
    .email('Must be a valid email address'),

  // Signature block
  customerSignatoryName: z.string().min(1, 'Customer signatory name is required'),

  // Commercial terms
  MOQamount: z.coerce
    .number({ invalid_type_error: 'MOQ must be a number' })
    .int('MOQ must be a whole number')
    .positive('MOQ must be greater than zero'),

  // Deposit percent: '70' | '60' | '50'
  depositPercent: z.enum(['70', '60', '50'], {
    required_error: 'Select a deposit / balance split',
  }),
});
