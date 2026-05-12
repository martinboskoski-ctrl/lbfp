import User from '../models/User.js';

const MAX_ENTRIES = 200;

/**
 * Append an entry to a user's embedded activityLog, capping at the last
 * MAX_ENTRIES via $slice. Best-effort: errors are logged but do not throw.
 */
export const logActivity = async (userId, action, extra = {}) => {
  if (!userId || !action) return;
  const entry = {
    action,
    at: new Date(),
    target:     extra.target     || '',
    targetType: extra.targetType || '',
    metadata:   extra.metadata   || {},
    ip:         extra.ip         || '',
  };
  try {
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          activityLog: { $each: [entry], $slice: -MAX_ENTRIES },
        },
      }
    );
  } catch (err) {
    console.error('[userActivity] logActivity failed:', err.message);
  }
};

/** Convenience: log the same action on multiple users (e.g. actor + target). */
export const logActivityMany = async (userIds, action, extra = {}) => {
  await Promise.all(userIds.filter(Boolean).map((id) => logActivity(id, action, extra)));
};
