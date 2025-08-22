const express = require('express');
const { makePayment, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, makePayment);
router.get('/', protect, getPayments);

module.exports = router;