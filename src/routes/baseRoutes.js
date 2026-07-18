const express = require('express');
const router = express.Router();
const baseController = require('../controllers/baseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, baseController.getBases);
router.post('/', authenticate, authorize('Admin'), baseController.createBase);

module.exports = router;
