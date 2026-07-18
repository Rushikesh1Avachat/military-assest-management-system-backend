const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    // RBAC: Admin only
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100); // safety cap

    res.status(200).json(logs);
  } catch (err) {
    console.error('getAuditLogs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAuditLogs
};
