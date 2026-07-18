const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('Admin', 'BaseCommander'), assignmentController.getAssignments);
router.post('/', authenticate, authorize('Admin', 'BaseCommander'), assignmentController.createAssignment);

module.exports = router;
