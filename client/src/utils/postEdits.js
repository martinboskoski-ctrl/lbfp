// Helpers for the app-wide "edit your own post" convention. A post is considered
// edited once it has at least one stored previous version in `editHistory`.

export const wasEdited = (item) => (item?.editHistory?.length || 0) > 0;

export const lastEditedAt = (item) => {
  const h = item?.editHistory;
  return h && h.length ? h[h.length - 1].editedAt : null;
};
