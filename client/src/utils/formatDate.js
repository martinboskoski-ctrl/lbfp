import i18next from 'i18next';

const getLocale = () => (i18next.language === 'en' ? 'en-GB' : 'mk-MK');

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(getLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(getLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const fmtDateLong = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(getLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const fmtDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(getLocale());
};
