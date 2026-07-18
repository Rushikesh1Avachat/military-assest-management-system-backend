const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const { logTransaction } = require('../middleware/logger');

const getPurchases = async (req, res) => {
  try {
    let filter = {};

    // RBAC: Base Commanders are restricted to their base purchases
    if (req.user.role === 'BaseCommander') {
      if (!req.user.baseId) {
        return res.status(403).json({ message: 'Forbidden: No base assigned' });
      }
      filter.baseId = req.user.baseId;
    } else {
      if (req.query.baseId) {
        filter.baseId = req.query.baseId;
      }
    }

    // Filters by asset type (requires populating and filtering) or date range
    if (req.query.startDate && req.query.endDate) {
      filter.purchaseDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    let query = Purchase.find(filter)
      .populate('assetId')
      .populate('baseId')
      .populate('addedBy', 'name email role')
      .sort({ purchaseDate: -1 });

    const purchases = await query;
    
    // Client-side filter for assetType if requested
    if (req.query.assetType) {
      const filtered = purchases.filter(p => p.assetId && p.assetId.type === req.query.assetType);
      return res.status(200).json(filtered);
    }

    res.status(200).json(purchases);
  } catch (err) {
    console.error('getPurchases error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { assetId, baseId, quantity, purchaseDate, supplier, remarks } = req.body;
    
    if (!assetId || !baseId || !quantity || !supplier) {
      return res.status(400).json({ message: 'Asset, Base, Quantity, and Supplier are required' });
    }

    // RBAC check: Base Commander can only purchase for their assigned base
    if (req.user.role === 'BaseCommander' && req.user.baseId.toString() !== baseId) {
      return res.status(403).json({ message: 'Forbidden: You can only record purchases for your assigned base' });
    }

    // Find and update current stock or create inventory if not exists
    let inventory = await Inventory.findOne({ assetId, baseId });
    let oldStock = 0;
    if (inventory) {
      oldStock = inventory.currentStock;
      inventory.currentStock += Number(quantity);
      inventory.lastUpdated = new Date();
      await inventory.save();
    } else {
      inventory = new Inventory({
        assetId,
        baseId,
        openingBalance: 0,
        currentStock: Number(quantity),
        lastUpdated: new Date()
      });
      await inventory.save();
    }

    const purchase = new Purchase({
      assetId,
      baseId,
      quantity: Number(quantity),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      supplier,
      remarks,
      addedBy: req.user._id
    });
    await purchase.save();

    // Log transaction
    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Purchase',
      referenceId: purchase._id,
      description: `Purchased ${quantity} of asset (ID: ${assetId}) for base (ID: ${baseId}) from ${supplier}. Stock updated from ${oldStock} to ${inventory.currentStock}.`,
      newData: purchase
    });

    res.status(201).json(purchase);
  } catch (err) {
    console.error('createPurchase error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPurchases,
  createPurchase
};
