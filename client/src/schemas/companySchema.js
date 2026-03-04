import { z } from 'zod';
import i18next from 'i18next';

// Single-language fields (used inside the per-language branches)
const langFields = z.object({
  name:    z.string(),
  address: z.string(),
  manager: z.string(),
});

// Full company schema — always collected, validated conditionally per document language
// CRN is language-agnostic (same number in both versions)
export const companySchema = z.object({
  crn: z.string(),
  mkd: langFields,
  eng: langFields,
});

// Helper used by document schemas to add conditional required-field rules
// based on the selected document language ('MKD' | 'ENG' | 'BILINGUAL')
export const addCompanyLanguageRules = (ctx, company, path, language) => {
  const needsMkd = language === 'MKD' || language === 'BILINGUAL';
  const needsEng = language === 'ENG' || language === 'BILINGUAL';
  const req = i18next.t('validation.required', { ns: 'common' });

  if (!company.crn?.trim()) {
    ctx.addIssue({ code: 'custom', path: [...path, 'crn'], message: req });
  }

  if (needsMkd) {
    if (!company.mkd?.name?.trim())    ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'name'],    message: req });
    if (!company.mkd?.address?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'address'], message: req });
    if (!company.mkd?.manager?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'mkd', 'manager'], message: req });
  }
  if (needsEng) {
    if (!company.eng?.name?.trim())    ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'name'],    message: req });
    if (!company.eng?.address?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'address'], message: req });
    if (!company.eng?.manager?.trim()) ctx.addIssue({ code: 'custom', path: [...path, 'eng', 'manager'], message: req });
  }
};
