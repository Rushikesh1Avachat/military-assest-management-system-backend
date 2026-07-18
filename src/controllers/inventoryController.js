const Inventory = require('../models/Inventory');

const getInventory = async (req, res) => {
  try {
    let filter = {};

    // RBAC: Base Commanders are restricted to their assigned base
    if (req.user.role === 'BaseCommander') {
      if (!req.user.baseId) {
        return res.status(403).json({ message: 'Forbidden: No base assigned to this commander' });
      }
      filter.baseId = req.user.baseId;
    } else {
      // Admin or LogisticsOfficer can filter by baseId query param
      if (req.query.baseId) {
        filter.baseId = req.query.baseId;
      }
    }

    if (req.query.assetId) {
      filter.assetId = req.query.assetId;
    }

    const inventory = await Inventory.find(filter)
      .populate('assetId')
      .populate('baseId')
      .sort({ updatedAt: -1 });

    res.status(200).json(inventory);
  } catch (err) {
    console.error('getInventory error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getInventory
};
