const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId, action, performedBy, details = {} }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      performedBy,
      details
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = logAudit;
