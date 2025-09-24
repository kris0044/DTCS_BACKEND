const express = require('express');
const { register, login, approveUser, getPendingUsers, rejectUser,getCurrentUser, updateUser, deleteUser, getAllUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/register', upload.single('photo'), register);
router.put('/update/:id', protect, adminOnly, upload.single('photo'),updateUser);
router.post('/login', login);
router.get('/pending', protect, adminOnly, getPendingUsers);
router.get('/all', protect, adminOnly, getAllUsers);
router.put('/approve/:id', protect, adminOnly, approveUser);
router.put('/reject/:id', protect, adminOnly, rejectUser);
router.put('/update/:id', protect, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.get('/me', protect, getCurrentUser);
router.put('/update', protect, upload.single('photo'), updateUser); // Self-update route
module.exports = router;