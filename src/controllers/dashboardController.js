const Base = require('../models/Base');
const Asset = require('../models/Asset');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const Expenditure = require('../models/Expenditure');

const getDashboardData = async (req, res) => {
  try {
    let baseId = req.query.baseId;
    const assetType = req.query.assetType;
    
    // Default date range: last 30 days if not specified
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // RBAC: Base Commanders are locked to their own base
    if (req.user.role === 'BaseCommander') {
      if (!req.user.baseId) {
        return res.status(403).json({ message: 'Forbidden: No base assigned to this commander' });
      }
      baseId = req.user.baseId.toString();
    }

    // 1. Find assets matching assetType
    let assetFilter = {};
    if (assetType) {
      assetFilter.type = assetType;
    }
    const assets = await Asset.find(assetFilter);
    const assetIds = assets.map(a => a._id);

    // Helper to calculate stock at any specific point in time
    const getStockAtTime = async (targetTime) => {
      // Get current stock
      let invFilter = { assetId: { $in: assetIds } };
      if (baseId) {
        invFilter.baseId = baseId;
      }
      const inventories = await Inventory.find(invFilter);
      let stock = inventories.reduce((sum, item) => sum + item.currentStock, 0);

      // Revert purchases after targetTime
      let purchaseFilter = { assetId: { $in: assetIds }, purchaseDate: { $gt: targetTime } };
      if (baseId) purchaseFilter.baseId = baseId;
      const purchasesAfter = await Purchase.find(purchaseFilter);
      const purchaseQty = purchasesAfter.reduce((sum, item) => sum + item.quantity, 0);
      stock -= purchaseQty;

      // Revert transfers after targetTime
      let transferFilter = { assetId: { $in: assetIds }, transferDate: { $gt: targetTime } };
      if (baseId) {
        transferFilter.$or = [
          { fromBaseId: baseId },
          { toBaseId: baseId }
        ];
      }
      const transfersAfter = await Transfer.find(transferFilter);
      transfersAfter.forEach(tr => {
        if (baseId) {
          if (tr.fromBaseId.toString() === baseId) {
            stock += tr.quantity; // added back to source
          }
          if (tr.toBaseId.toString() === baseId) {
            stock -= tr.quantity; // subtracted from destination
          }
        }
      });

      // Revert assignments after targetTime
      let assignFilter = { assetId: { $in: assetIds }, assignmentDate: { $gt: targetTime } };
      if (baseId) assignFilter.baseId = baseId;
      const assignmentsAfter = await Assignment.find(assignFilter);
      const assignQty = assignmentsAfter.reduce((sum, item) => sum + item.quantity, 0);
      stock += assignQty;

      // Revert expenditures after targetTime
      let expendFilter = { assetId: { $in: assetIds }, expenditureDate: { $gt: targetTime } };
      if (baseId) expendFilter.baseId = baseId;
      const expendituresAfter = await Expenditure.find(expendFilter);
      const expendQty = expendituresAfter.reduce((sum, item) => sum + item.quantity, 0);
      stock += expendQty;

      return stock;
    };

    // Calculate balances
    const openingBalance = await getStockAtTime(startDate);
    const closingBalance = await getStockAtTime(endDate);

    // 2. Gather transactions within [startDate, endDate]
    // Purchases
    let purchasePeriodFilter = {
      assetId: { $in: assetIds },
      purchaseDate: { $gte: startDate, $lte: endDate }
    };
    if (baseId) purchasePeriodFilter.baseId = baseId;
    const purchasesPeriod = await Purchase.find(purchasePeriodFilter)
      .populate('assetId')
      .populate('baseId')
      .populate('addedBy', 'name');
    const purchasesTotal = purchasesPeriod.reduce((sum, p) => sum + p.quantity, 0);

    // Transfers
    let transfersInPeriod = [];
    let transfersOutPeriod = [];
    let transfersPeriod = [];

    let transferPeriodFilter = {
      assetId: { $in: assetIds },
      transferDate: { $gte: startDate, $lte: endDate }
    };

    if (baseId) {
      // Transfers In
      transfersInPeriod = await Transfer.find({
        ...transferPeriodFilter,
        toBaseId: baseId
      }).populate('assetId').populate('fromBaseId').populate('toBaseId');

      // Transfers Out
      transfersOutPeriod = await Transfer.find({
        ...transferPeriodFilter,
        fromBaseId: baseId
      }).populate('assetId').populate('fromBaseId').populate('toBaseId');
    } else {
      // For Admin/Logistics without base filter, transfers are shown in aggregate
      transfersPeriod = await Transfer.find(transferPeriodFilter)
        .populate('assetId')
        .populate('fromBaseId')
        .populate('toBaseId');
    }

    const transfersInTotal = baseId 
      ? transfersInPeriod.reduce((sum, t) => sum + t.quantity, 0)
      : transfersPeriod.reduce((sum, t) => sum + t.quantity, 0); // show all for aggregate

    const transfersOutTotal = baseId
      ? transfersOutPeriod.reduce((sum, t) => sum + t.quantity, 0)
      : transfersPeriod.reduce((sum, t) => sum + t.quantity, 0); // show all for aggregate

    const netMovement = baseId
      ? (purchasesTotal + transfersInTotal - transfersOutTotal)
      : (purchasesTotal + transfersInTotal - transfersOutTotal); // in aggregate, transfers cancel out if they are within bases, but let's count total Purchases as net movement since aggregate transfer is internal movement.

    // Assignments
    let assignPeriodFilter = {
      assetId: { $in: assetIds },
      assignmentDate: { $gte: startDate, $lte: endDate }
    };
    if (baseId) assignPeriodFilter.baseId = baseId;
    const assignmentsPeriod = await Assignment.find(assignPeriodFilter)
      .populate('assetId')
      .populate('baseId');
    const assignedTotal = assignmentsPeriod.reduce((sum, a) => sum + a.quantity, 0);

    // Expenditures
    let expendPeriodFilter = {
      assetId: { $in: assetIds },
      expenditureDate: { $gte: startDate, $lte: endDate }
    };
    if (baseId) expendPeriodFilter.baseId = baseId;
    const expendituresPeriod = await Expenditure.find(expendPeriodFilter)
      .populate('assetId')
      .populate('baseId');
    const expendedTotal = expendituresPeriod.reduce((sum, e) => sum + e.quantity, 0);

    // 3. Current Stock per Asset for listing
    let stockFilter = { assetId: { $in: assetIds } };
    if (baseId) stockFilter.baseId = baseId;
    const currentStockList = await Inventory.find(stockFilter)
      .populate('assetId')
      .populate('baseId');

    res.status(200).json({
      metrics: {
        openingBalance,
        closingBalance,
        netMovement,
        assigned: assignedTotal,
        expended: expendedTotal,
        purchasesTotal,
        transfersInTotal,
        transfersOutTotal
      },
      details: {
        purchasesList: purchasesPeriod,
        transfersInList: baseId ? transfersInPeriod : transfersPeriod,
        transfersOutList: baseId ? transfersOutPeriod : transfersPeriod
      },
      currentStockList,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (err) {
    console.error('getDashboardData error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardData
};
