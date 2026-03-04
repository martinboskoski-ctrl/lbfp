import { z } from 'zod';
import i18next from 'i18next';

const tc = (key) => i18next.t(key, { ns: 'common' });

// EMBG (Единствен матичен број на граѓанинот) — 13 digits
const EMBG_REGEX = /^\d{13}$/;

export const contractAnnexSchema = z.object({
  date:           z.string().min(1, tc('validation.required')),
  employeeName:   z.string().min(1, tc('validation.required')).trim(),
  employeePin:    z
    .string()
    .min(1, tc('validation.required'))
    .regex(EMBG_REGEX, tc('validation.invalidEmbg')),
  contractNumber: z.string().min(1, tc('validation.required')).trim(),
  contractDate:   z.string().min(1, tc('validation.required')),
  newEndDate:     z.string().min(1, tc('validation.required')),
}).refine(
  (data) => {
    if (!data.contractDate || !data.newEndDate) return true;
    return new Date(data.newEndDate) > new Date(data.contractDate);
  },
  {
    message: tc('validation.endDateAfterContractDate'),
    path: ['newEndDate'],
  }
);
