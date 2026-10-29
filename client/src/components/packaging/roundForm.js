// Shared state helpers for a round's inputs (RoundInputs.jsx). Nothing is mandatory:
// a round can be just a client question, just files, or any mix.
export const ARTWORK_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const INGREDIENTS_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const emptyRound = (ingredientsText = '') => ({
  clientMessage: '', attachments: [], ingredientsText, ingredientsFile: null, note: '',
});

export const appendRound = (form, round) => {
  form.append('clientMessage', round.clientMessage);
  for (const file of round.attachments) form.append('attachments', file);
  form.append('ingredientsText', round.ingredientsText);
  if (round.ingredientsFile) form.append('ingredientsFile', round.ingredientsFile);
  form.append('note', round.note);
};
