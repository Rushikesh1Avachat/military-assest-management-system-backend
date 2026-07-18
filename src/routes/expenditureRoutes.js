const express = require('express');
const router = express.Router();
const expenditureController = require('../controllers/expenditureController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('Admin', 'BaseCommander'), expenditureController.getExpenditures);
router.post('/', authenticate, authorize('Admin', 'BaseCommander'), expenditureController.createExpenditure);

module.exports = router;
