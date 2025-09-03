const express = require('express');
const router = express.Router();
const {
  getAllInterestRates,
  addInterestRate,
  updateInterestRate,
  deleteInterestRate,
} = require('../controllers/interestRateController');
const { protect } = require('../middleware/auth');

router.post('/', protect, addInterestRate);
router.get('/', protect, getAllInterestRates);
router.put('/:id', protect, updateInterestRate);
router.delete('/:id', protect, deleteInterestRate);

module.exports = router;