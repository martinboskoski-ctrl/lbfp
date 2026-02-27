import { z } from 'zod';

// Single-language fields (used inside the per-language branches)
const langFields = z.object({
  name:    z.string(),
  address: z.string(),
  manager: z.string(),
});

// Full company schema — always collected, validated conditionally per document language
// CRN is language-agnostic (same number in both versions)
export const companySchema = z.object({
  crn: z.string().min(1, 'Матичниот број е задолжителен'),
  mkd: langFields,
  eng: langFields,
});

// Helper used by document schemas to add conditional required-field rules
// based on the selected document language ('MKD' | 'ENG' | 'BILINGUAL')
export const addCompanyLanguageRules = (ctx, company, path, language) => {
  const needsMkd = language === 'MKD' || language === 'BILINGUAL';
  const needsEng = language === 'ENG' || language === 'BILINGUAL';

  if (needsMkd) {
    if (!company.mkd?.name?.trim())    ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'name'],    message: 'Задолжително' });
    if (!company.mkd?.address?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'address'], message: 'Задолжително' });
    if (!company.mkd?.manager?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'manager'], message: 'Задолжително' });
  }
  if (needsEng) {
    if (!company.eng?.name?.trim())    ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'name'],    message: 'Required' });
    if (!company.eng?.address?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'address'], message: 'Required' });
    if (!company.eng?.manager?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'manager'], message: 'Required' });
  }
};
