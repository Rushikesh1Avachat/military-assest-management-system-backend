const AuditLog = require('../models/AuditLog');

const logTransaction = async ({
  userId,
  action,
  module,
  referenceId = null,
  description,
  oldData = null,
  newData = null
}) => {
  try {
    const log = new AuditLog({
      userId,
      action,
      module,
      referenceId,
      description,
      oldData,
      newData,
      timestamp: new Date()
    });
    await log.save();
  } catch (err) {
    console.error('Audit Logging Failed:', err.message);
  }
};

module.exports = {
  logTransaction
};
