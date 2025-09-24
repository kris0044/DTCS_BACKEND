// routes/resignation.js
const express = require('express');
const router = express.Router();
const resignationController = require('../controllers/resignation');
const { protect, adminOnly } = require('../middleware/auth'); // Destructure auth middleware

// Request resignation (staff only)
router.post('/', protect, resignationController.requestResignation);

// Update resignation (admin only)
router.put('/:id', protect, adminOnly, resignationController.updateResignation);

// Delete resignation (admin only)
router.delete('/:id', protect, adminOnly, resignationController.deleteResignation);

// Get all/my resignations
router.get('/', protect, resignationController.getResignations);

// Get resignation details
router.get('/:id', protect, resignationController.getResignationDetails);

module.exports = router;