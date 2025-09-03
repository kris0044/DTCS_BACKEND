const express = require('express');
const { makePayment, getPayments, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, makePayment);
router.get('/', protect, getPayments);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

module.exports = router;