const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.post('/guest-login', authController.guestLogin);

// Protected routes for group actions
router.post('/create-group', authMiddleware, authController.createGroup);
router.post('/join-group', authMiddleware, authController.joinGroup);
router.post('/leave-group', authMiddleware, authController.leaveGroup);

module.exports = router;
