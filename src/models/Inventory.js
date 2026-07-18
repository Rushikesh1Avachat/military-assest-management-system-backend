const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  openingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Enforce unique asset per base
inventorySchema.index({ assetId: 1, baseId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
