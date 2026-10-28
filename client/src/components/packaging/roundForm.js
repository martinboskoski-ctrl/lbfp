// Shared state helpers for the artwork + ingredients inputs (RoundInputs.jsx).
export const ARTWORK_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const INGREDIENTS_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const emptyRound = (ingredientsText = '') => ({ artwork: null, ingredientsText, ingredientsFile: null, note: '' });

export const validateRound = (round, t) => {
  const e = {};
  if (!round.artwork) e.artwork = t('form.artworkRequired');
  if (!round.ingredientsText.trim() && !round.ingredientsFile) e.ingredients = t('form.ingredientsRequired');
  return e;
};

export const appendRound = (form, round) => {
  form.append('artwork', round.artwork);
  form.append('ingredientsText', round.ingredientsText);
  if (round.ingredientsFile) form.append('ingredientsFile', round.ingredientsFile);
  form.append('note', round.note);
};
