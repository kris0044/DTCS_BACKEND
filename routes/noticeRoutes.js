const express = require('express');
const { createNotice, getNotices, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, createNotice);
router.get('/', protect, getNotices);
router.put('/:id', protect, updateNotice);
router.delete('/:id', protect, deleteNotice);

module.exports = router;