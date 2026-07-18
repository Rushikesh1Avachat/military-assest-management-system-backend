const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, inventoryController.getInventory);

module.exports = router;
