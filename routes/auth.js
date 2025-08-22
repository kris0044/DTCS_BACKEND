const express = require('express');
const { register, login, approveUser, getPendingUsers, rejectUser, updateUser, deleteUser, getAllUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/pending', protect, adminOnly, getPendingUsers);
router.get('/all', protect, adminOnly, getAllUsers);
router.put('/approve/:id', protect, adminOnly, approveUser);
router.put('/reject/:id', protect, adminOnly, rejectUser);
router.put('/update/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;