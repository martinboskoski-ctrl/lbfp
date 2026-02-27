import { z } from 'zod';
import { companySchema, addCompanyLanguageRules } from '../companySchema.js';

export const ndaSchema = z.object({
  date:        z.string().min(1, 'Датумот е задолжителен'),
  secondParty: companySchema,
  language:    z.enum(['MKD', 'ENG', 'BILINGUAL'], {
    required_error: 'Изберете верзија на документот',
  }),
}).superRefine((data, ctx) => {
  addCompanyLanguageRules(ctx, data.secondParty, ['secondParty'], data.language);
});
