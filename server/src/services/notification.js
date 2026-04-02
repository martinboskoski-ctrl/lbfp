import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

export const notify = async ({ recipientId, type, title, message = '', link = '', metadata = {} }) => {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    link,
    metadata,
  });

  try {
    const io = getIO();
    io.to(`user:${recipientId.toString()}`).emit('notification', {
      _id: notification._id,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: notification.createdAt,
    });
  } catch {
    // Socket not available — notification is still saved in DB
  }

  return notification;
};

export const notifyMany = async (recipientIds, data) => {
  const promises = recipientIds.map((id) => notify({ ...data, recipientId: id }));
  return Promise.all(promises);
};
