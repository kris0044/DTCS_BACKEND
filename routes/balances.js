const express = require('express');
const { createBalanceEntry, updateBalanceEntry, deleteBalanceEntry, getBalanceEntries } = require('../controllers/balanceController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, adminOnly, createBalanceEntry);
router.put('/:id', protect, adminOnly, updateBalanceEntry);
router.delete('/:id', protect, adminOnly, deleteBalanceEntry);
router.get('/', protect, adminOnly, getBalanceEntries);

module.exports = router;