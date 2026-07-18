const Base = require('../models/Base');
const { logTransaction } = require('../middleware/logger');

const getBases = async (req, res) => {
  try {
    // Both Admin and Logistics can see all bases. BaseCommanders can see all bases to select destinations for transfers.
    const bases = await Base.find().sort({ name: 1 });
    res.status(200).json(bases);
  } catch (err) {
    console.error('getBases error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBase = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    const existing = await Base.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Base already exists with this name' });
    }

    const base = new Base({ name, location });
    await base.save();

    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Base',
      referenceId: base._id,
      description: `Created new base: ${name} in ${location}`,
      newData: base
    });

    res.status(201).json(base);
  } catch (err) {
    console.error('createBase error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBases,
  createBase
};
