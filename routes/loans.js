const express = require('express');
const { requestLoan, updateLoan, getLoans } = require('../controllers/loanController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, requestLoan);
router.put('/:id', protect, adminOnly, updateLoan);
router.get('/', protect, getLoans);

module.exports = router;