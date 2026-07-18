const Asset = require('../models/Asset');
const { logTransaction } = require('../middleware/logger');

const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ name: 1 });
    res.status(200).json(assets);
  } catch (err) {
    console.error('getAssets error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAsset = async (req, res) => {
  try {
    const { name, type, unit, description } = req.body;
    if (!name || !type || !unit) {
      return res.status(400).json({ message: 'Name, type, and unit are required' });
    }

    const existing = await Asset.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Asset already exists with this name' });
    }

    const asset = new Asset({ name, type, unit, description });
    await asset.save();

    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Asset',
      referenceId: asset._id,
      description: `Created new master asset: ${name} (${type})`,
      newData: asset
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error('createAsset error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAssets,
  createAsset
};
