// Helpers to render LhcQuestion / option text in the active locale.
// Falls back to MK when EN translation is missing.
import i18next from 'i18next';

const isEn = () => i18next.language === 'en';

export const qText = (q) => (isEn() && q?.textEn) || q?.text || '';
export const qArticle = (q) => (isEn() && q?.articleEn) || q?.article || '';
export const qRecommendation = (q) =>
  (isEn() && q?.recommendationEn) || q?.recommendation || '';

// Option label fallback: option may carry { value, label, labelEn }.
export const oLabel = (o) => (isEn() && o?.labelEn) || o?.label || o?.value || '';

// Whether the EN render is an approximate translation (any of the EN fields
// is missing in DB but we still produced a fallback).
export const isApprox = (q) => isEn() && (
  !q?.textEn || !q?.articleEn || !q?.recommendationEn ||
  (q?.options || []).some((o) => !o.labelEn)
);
