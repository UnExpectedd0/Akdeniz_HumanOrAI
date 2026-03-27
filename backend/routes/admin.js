const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// Both routes require a valid token AND admin role
router.get('/prompt', authMiddleware, adminOnly, adminController.getPrompt);
router.put('/prompt', authMiddleware, adminOnly, adminController.updatePrompt);
router.post('/test', authMiddleware, adminOnly, adminController.testPrompt);
router.get('/config', authMiddleware, adminOnly, adminController.getConfig);

module.exports = router;
