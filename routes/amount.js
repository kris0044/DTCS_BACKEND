const express = require('express');
const { getAmounts, getCurrentAmount, addAmount, updateAmount, deleteAmount } = require('../controllers/amountController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getAmounts);
router.get('/current', protect, getCurrentAmount);
router.post('/', protect, addAmount);
router.put('/:id', protect, updateAmount);
router.delete('/:id', protect, deleteAmount);

module.exports = router;