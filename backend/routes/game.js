const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authMiddleware, doctorOnly } = require('../middlewares/auth');

// Protected routes (Both User and Doctor)
router.use(authMiddleware);

router.get('/scoreboard', gameController.getScoreboard);

// User specific routes
router.post('/ask', gameController.askQuestion);
router.post('/guess', gameController.submitGuess);

// Doctor specific routes
router.get('/pending-questions', doctorOnly, gameController.getPendingQuestionsForDoctors);
router.post('/answer', doctorOnly, gameController.doctorAnswer);

module.exports = router;
