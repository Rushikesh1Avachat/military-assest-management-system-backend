const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, transferController.getTransfers);
router.post('/', authenticate, authorize('Admin', 'LogisticsOfficer', 'BaseCommander'), transferController.createTransfer);

module.exports = router;
