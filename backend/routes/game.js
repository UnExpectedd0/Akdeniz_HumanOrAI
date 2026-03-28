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
router.get('/active-question', gameController.getActiveQuestionForUser);

// Doctor specific routes
router.get('/pending-questions', doctorOnly, gameController.getPendingQuestionsForDoctors);
router.post('/accept-question', doctorOnly, gameController.acceptQuestion);
router.post('/answer', doctorOnly, gameController.doctorAnswer);
router.get('/ai-status', gameController.getAiStatus);

module.exports = router;
