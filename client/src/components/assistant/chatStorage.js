// The assistant conversation lives in sessionStorage, one entry per user, so a
// colleague logging in on the same browser tab never sees someone else's chat.
const PREFIX = 'packflow_assistant_chat:';

export const loadChat = (userId) => {
  try { return JSON.parse(sessionStorage.getItem(PREFIX + userId)) || []; } catch { return []; }
};

export const saveChat = (userId, messages) => {
  try { sessionStorage.setItem(PREFIX + userId, JSON.stringify(messages)); } catch { /* storage unavailable */ }
};

// Called on logout: remove every user's conversation (and the old shared key).
export const clearChats = () => {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX) || k === 'packflow_assistant_chat')
      .forEach((k) => sessionStorage.removeItem(k));
  } catch { /* storage unavailable */ }
};
