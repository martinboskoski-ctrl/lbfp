import AuditLog from '../models/AuditLog.js';

const writeAudit = async ({ projectId, userId, action, details = {} }) => {
  await AuditLog.create({
    project: projectId,
    user: userId,
    action,
    details,
  });
};

export default writeAudit;
