const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, purchaseController.getPurchases);
router.post('/', authenticate, authorize('Admin', 'LogisticsOfficer', 'BaseCommander'), purchaseController.createPurchase);

module.exports = router;
