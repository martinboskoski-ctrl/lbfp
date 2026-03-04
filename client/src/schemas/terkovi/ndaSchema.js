import { z } from 'zod';
import i18next from 'i18next';
import { companySchema, addCompanyLanguageRules } from '../companySchema.js';

export const createNdaSchema = () => {
  const req = i18next.t('validation.required', { ns: 'common' });

  return z.object({
    date:        z.string().min(1, req),
    secondParty: companySchema,
    language:    z.enum(['MKD', 'ENG', 'BILINGUAL'], {
      required_error: req,
    }),
  }).superRefine((data, ctx) => {
    addCompanyLanguageRules(ctx, data.secondParty, ['secondParty'], data.language);
  });
};

// Backwards-compatible static export (uses current language at import time)
export const ndaSchema = createNdaSchema();
