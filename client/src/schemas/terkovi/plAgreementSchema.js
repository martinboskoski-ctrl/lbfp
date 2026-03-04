import { z } from 'zod';
import i18next from 'i18next';

const t = (key, ns = 'terkovi') => i18next.t(key, { ns });
const tc = (key) => i18next.t(key, { ns: 'common' });

// Deposit / balance payment pairs — the two values must sum to 100
const PAYMENT_PAIRS = [
  { deposit: 70, balance: 30 },
  { deposit: 60, balance: 40 },
  { deposit: 50, balance: 50 },
];

export const DEPOSIT_OPTIONS = PAYMENT_PAIRS.map((p) => ({
  value: String(p.deposit),
  label: `${p.deposit}% / ${p.balance}%`,
}));

export const plAgreementSchema = z.object({
  effectiveDate:         z.string().min(1, tc('validation.required')),
  companyName:           z.string().min(1, tc('validation.required')),
  companyAddress:        z.string().min(1, tc('validation.required')),
  companyCRN:            z.string().min(1, tc('validation.required')),
  companyCEO:            z.string().min(1, tc('validation.required')),
  customerEmail:         z.string().min(1, tc('validation.required')).email(tc('validation.invalidEmail')),
  customerSignatoryName: z.string().min(1, tc('validation.required')),
  MOQamount: z.coerce
    .number({ invalid_type_error: tc('validation.required') })
    .int(tc('validation.required'))
    .positive(tc('validation.required')),
  depositPercent: z.enum(['70', '60', '50'], {
    required_error: tc('validation.required'),
  }),
});
