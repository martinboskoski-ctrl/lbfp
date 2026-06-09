import mongoose from 'mongoose';

// Reusable "previous version" record for any user-editable post (announcement,
// comment, note, order, Q&A entry, request…). Each entry is a snapshot of the
// content *before* an edit, so the live document always holds the current version.
export const editVersionSchema = new mongoose.Schema(
  {
    snapshot: { type: mongoose.Schema.Types.Mixed },                     // pre-edit content fields
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Append the current content snapshot to a doc/subdoc's editHistory before it is
// overwritten with new content.
export const pushEditVersion = (target, snapshot, userId) => {
  if (!Array.isArray(target.editHistory)) target.editHistory = [];
  target.editHistory.push({ snapshot, editedBy: userId, editedAt: new Date() });
};
