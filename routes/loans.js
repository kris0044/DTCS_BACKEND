// routes/loans.js
const express = require('express');
const { requestLoan, updateLoan, deleteLoan, getLoans, getLoanDetails } = require('../controllers/loanController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, requestLoan);
router.put('/:id', protect, adminOnly, updateLoan);
router.delete('/:id', protect, adminOnly, deleteLoan);
router.get('/', protect, getLoans);
router.get('/:id', protect, getLoanDetails);

module.exports = router;