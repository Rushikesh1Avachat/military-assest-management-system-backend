const Expenditure = require('../models/Expenditure');
const Inventory = require('../models/Inventory');
const { logTransaction } = require('../middleware/logger');

const getExpenditures = async (req, res) => {
  try {
    let filter = {};

    // RBAC: Base Commanders are restricted to expenditures at their base
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

    if (req.query.startDate && req.query.endDate) {
      filter.expenditureDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const expenditures = await Expenditure.find(filter)
      .populate('assetId')
      .populate('baseId')
      .populate('expendedBy', 'name email role')
      .sort({ expenditureDate: -1 });

    // Client-side filter for assetType if requested
    if (req.query.assetType) {
      const filtered = expenditures.filter(e => e.assetId && e.assetId.type === req.query.assetType);
      return res.status(200).json(filtered);
    }

    res.status(200).json(expenditures);
  } catch (err) {
    console.error('getExpenditures error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createExpenditure = async (req, res) => {
  try {
    const { assetId, baseId, quantity, reason, expenditureDate, remarks } = req.body;

    if (!assetId || !baseId || !quantity || !reason) {
      return res.status(400).json({ message: 'Asset, Base, Quantity, and Reason are required' });
    }

    const expendQty = Number(quantity);
    if (expendQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    // RBAC: Base Commander can only record expenditures at their assigned base
    if (req.user.role === 'BaseCommander' && req.user.baseId.toString() !== baseId) {
      return res.status(403).json({ message: 'Forbidden: You can only record expenditures for your assigned base' });
    }

    // Verify stock in inventory
    const inventory = await Inventory.findOne({ assetId, baseId });
    if (!inventory || inventory.currentStock < expendQty) {
      return res.status(400).json({ 
        message: `Insufficient stock for expenditure. Available stock is ${inventory ? inventory.currentStock : 0}` 
      });
    }

    // Deduct stock
    const oldStock = inventory.currentStock;
    inventory.currentStock -= expendQty;
    inventory.lastUpdated = new Date();
    await inventory.save();

    const expenditure = new Expenditure({
      assetId,
      baseId,
      quantity: expendQty,
      reason,
      expendedBy: req.user._id,
      expenditureDate: expenditureDate ? new Date(expenditureDate) : new Date(),
      remarks
    });
    await expenditure.save();

    // Log transaction
    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Expenditure',
      referenceId: expenditure._id,
      description: `Recorded expenditure of ${expendQty} of asset (ID: ${assetId}) due to reason: ${reason} at base (ID: ${baseId}). Warehouse stock updated from ${oldStock} to ${inventory.currentStock}.`,
      newData: expenditure
    });

    res.status(201).json(expenditure);
  } catch (err) {
    console.error('createExpenditure error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getExpenditures,
  createExpenditure
};
