const Transfer = require('../models/Transfer');
const Inventory = require('../models/Inventory');
const { logTransaction } = require('../middleware/logger');

const getTransfers = async (req, res) => {
  try {
    let filter = {};

    // RBAC: Base Commanders see transfers related to their base (incoming or outgoing)
    if (req.user.role === 'BaseCommander') {
      if (!req.user.baseId) {
        return res.status(403).json({ message: 'Forbidden: No base assigned' });
      }
      filter.$or = [
        { fromBaseId: req.user.baseId },
        { toBaseId: req.user.baseId }
      ];
    } else {
      if (req.query.baseId) {
        // Filter by baseId as source or destination
        filter.$or = [
          { fromBaseId: req.query.baseId },
          { toBaseId: req.query.baseId }
        ];
      }
    }

    if (req.query.startDate && req.query.endDate) {
      filter.transferDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const transfers = await Transfer.find(filter)
      .populate('assetId')
      .populate('fromBaseId')
      .populate('toBaseId')
      .populate('initiatedBy', 'name email role')
      .sort({ transferDate: -1 });

    // Client-side filter for assetType if requested
    if (req.query.assetType) {
      const filtered = transfers.filter(t => t.assetId && t.assetId.type === req.query.assetType);
      return res.status(200).json(filtered);
    }

    res.status(200).json(transfers);
  } catch (err) {
    console.error('getTransfers error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTransfer = async (req, res) => {
  try {
    const { assetId, fromBaseId, toBaseId, quantity, transferDate, remarks } = req.body;

    if (!assetId || !fromBaseId || !toBaseId || !quantity) {
      return res.status(400).json({ message: 'Asset, From Base, To Base, and Quantity are required' });
    }

    if (fromBaseId === toBaseId) {
      return res.status(400).json({ message: 'Source and destination bases must be different' });
    }

    const transferQty = Number(quantity);
    if (transferQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    // RBAC: Base Commander can only initiate transfers *from* their own base
    if (req.user.role === 'BaseCommander' && req.user.baseId.toString() !== fromBaseId) {
      return res.status(403).json({ message: 'Forbidden: You can only transfer assets from your own assigned base' });
    }

    // Verify source inventory stock
    const sourceInv = await Inventory.findOne({ assetId, baseId: fromBaseId });
    if (!sourceInv || sourceInv.currentStock < transferQty) {
      return res.status(400).json({ 
        message: `Insufficient stock at source base. Available stock is ${sourceInv ? sourceInv.currentStock : 0}` 
      });
    }

    // Perform updates
    // 1. Deduct from source
    const oldSourceStock = sourceInv.currentStock;
    sourceInv.currentStock -= transferQty;
    sourceInv.lastUpdated = new Date();
    await sourceInv.save();

    // 2. Add to destination
    let destInv = await Inventory.findOne({ assetId, baseId: toBaseId });
    let oldDestStock = 0;
    if (destInv) {
      oldDestStock = destInv.currentStock;
      destInv.currentStock += transferQty;
      destInv.lastUpdated = new Date();
      await destInv.save();
    } else {
      destInv = new Inventory({
        assetId,
        baseId: toBaseId,
        openingBalance: 0,
        currentStock: transferQty,
        lastUpdated: new Date()
      });
      await destInv.save();
    }

    const transfer = new Transfer({
      assetId,
      fromBaseId,
      toBaseId,
      quantity: transferQty,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      remarks,
      initiatedBy: req.user._id
    });
    await transfer.save();

    // Log transaction
    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Transfer',
      referenceId: transfer._id,
      description: `Transferred ${transferQty} of asset (ID: ${assetId}) from base (ID: ${fromBaseId}) to base (ID: ${toBaseId}). Source stock updated from ${oldSourceStock} to ${sourceInv.currentStock}. Dest stock updated from ${oldDestStock} to ${destInv.currentStock}.`,
      newData: transfer
    });

    res.status(201).json(transfer);
  } catch (err) {
    console.error('createTransfer error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransfers,
  createTransfer
};
