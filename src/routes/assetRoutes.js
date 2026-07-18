const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, assetController.getAssets);
router.post('/', authenticate, authorize('Admin'), assetController.createAsset);

module.exports = router;
