const Assignment = require('../models/Assignment');
const Inventory = require('../models/Inventory');
const { logTransaction } = require('../middleware/logger');

const getAssignments = async (req, res) => {
  try {
    let filter = {};

    // RBAC: Base Commanders are restricted to assignments from their base
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
      filter.assignmentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const assignments = await Assignment.find(filter)
      .populate('assetId')
      .populate('baseId')
      .populate('assignedBy', 'name email role')
      .sort({ assignmentDate: -1 });

    // Client-side filter for assetType if requested
    if (req.query.assetType) {
      const filtered = assignments.filter(a => a.assetId && a.assetId.type === req.query.assetType);
      return res.status(200).json(filtered);
    }

    res.status(200).json(assignments);
  } catch (err) {
    console.error('getAssignments error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { assetId, baseId, quantity, assignedTo, assignmentDate, remarks } = req.body;

    if (!assetId || !baseId || !quantity || !assignedTo) {
      return res.status(400).json({ message: 'Asset, Base, Quantity, and Assigned To are required' });
    }

    const assignQty = Number(quantity);
    if (assignQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    // RBAC: Base Commander can only assign from their assigned base
    if (req.user.role === 'BaseCommander' && req.user.baseId.toString() !== baseId) {
      return res.status(403).json({ message: 'Forbidden: You can only assign assets from your assigned base' });
    }

    // Verify stock in inventory
    const inventory = await Inventory.findOne({ assetId, baseId });
    if (!inventory || inventory.currentStock < assignQty) {
      return res.status(400).json({ 
        message: `Insufficient stock for assignment. Available stock is ${inventory ? inventory.currentStock : 0}` 
      });
    }

    // Deduct stock
    const oldStock = inventory.currentStock;
    inventory.currentStock -= assignQty;
    inventory.lastUpdated = new Date();
    await inventory.save();

    const assignment = new Assignment({
      assetId,
      baseId,
      quantity: assignQty,
      assignedTo,
      assignedBy: req.user._id,
      assignmentDate: assignmentDate ? new Date(assignmentDate) : new Date(),
      remarks
    });
    await assignment.save();

    // Log transaction
    await logTransaction({
      userId: req.user._id,
      action: 'CREATE',
      module: 'Assignment',
      referenceId: assignment._id,
      description: `Assigned ${assignQty} of asset (ID: ${assetId}) to ${assignedTo} at base (ID: ${baseId}). Warehouse stock updated from ${oldStock} to ${inventory.currentStock}.`,
      newData: assignment
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error('createAssignment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAssignments,
  createAssignment
};
