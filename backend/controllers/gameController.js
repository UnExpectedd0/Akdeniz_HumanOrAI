const { Question, Answer, Guess, User } = require('../models');
const { handleAIQuestion, isAiRateLimited, recordAiRequest } = require('../services/aiService');
const { getIo } = require('../services/socketService');
const logger = require('../services/logger');

exports.askQuestion = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Question text is required' });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Question must be 500 characters or fewer' });
    }
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const groupId = user.group_id;

    if (!groupId) {
      return res.status(400).json({ error: 'You must join a group first' });
    }

    // Check if there's any doctor in this group
    const doctorCount = await User.count({ where: { group_id: groupId, role: 'doctor' } });

    if (doctorCount === 0) {
      return res.status(400).json({ error: 'There must be at least 1 doctor in the group' });
    }

    // AI Limit Check
    const aiLimited = isAiRateLimited();

    let isAiAssigned = false;

    if (aiLimited) {
      isAiAssigned = false; // Force strictly to doctor
    } else {
      isAiAssigned = Math.random() < 0.5; // Random choice
    }

    if (isAiAssigned) {
      recordAiRequest();
    }

    const status = isAiAssigned ? 'pending_ai' : 'pending_doctor';

    const question = await Question.create({
      text,
      user_id: userId,
      status,
      group_id: groupId
    });

    if (isAiAssigned) {
      // Background AI handling
      handleAIQuestion(question.id, text, userId);
      logger.milestone(`Question by '${user.username}' -> Assigned to: AI`);
    } else {
      // Emit to doctors in this specific group
      const io = getIo();
      if (io) {
        io.to(`doctors_${groupId}`).emit('new_question', question);
      }
      logger.milestone(`Question by '${user.username}' -> Assigned to: Doctor`);
    }

    res.status(201).json({ message: 'Question submitted', question });
  } catch (err) {
    logger.error('AskQuestion Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPendingQuestionsForDoctors = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const groupId = user.group_id;

    const questions = await Question.findAll({
      where: { status: 'pending_doctor', group_id: groupId },
      include: [{ model: User, as: 'author', attributes: ['username'] }]
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.doctorAnswer = async (req, res) => {
  try {
    const { questionId, text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Answer text is required' });
    }
    if (text.trim().length > 2000) {
      return res.status(400).json({ error: 'Answer must be 2000 characters or fewer' });
    }
    const doctorId = req.user.id;
    const docUser = await User.findByPk(doctorId);

    const question = await Question.findOne({ where: { id: questionId, status: 'pending_doctor', group_id: docUser.group_id } });
    if (!question) {
      return res.status(404).json({ error: 'Question not found, not in your group, or already answered' });
    }

    const answer = await Answer.create({
      question_id: question.id,
      answerer_id: doctorId,
      text,
      is_ai: false
    });

    question.status = 'answered';
    await question.save();

    logger.milestone(`Doctor '${docUser.username}' answered Question ID: ${question.id}`);

    const io = getIo();
    if (io) {
      // Notify the specific user who asked
      io.to(`user_${question.user_id}`).emit('question_answered', {
        questionId: question.id,
        answerId: answer.id,
        text
      });
      // Notify other doctors in the group that it's answered
      io.to(`doctors_${docUser.group_id}`).emit('question_removed', { questionId: question.id });
    }

    res.json({ message: 'Answer submitted', answer });
  } catch (err) {
    logger.error('DoctorAnswer Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitGuess = async (req, res) => {
  try {
    const { answerId, guess_ai } = req.body;
    const userId = req.user.id;

    const answer = await Answer.findByPk(answerId, {
      include: [{ model: Question, as: 'question' }]
    });

    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    if (answer.question.user_id !== userId) {
      return res.status(403).json({ error: 'You did not ask this question' });
    }

    // Check if already guessed
    const existing = await Guess.findOne({ where: { answer_id: answerId } });
    if (existing) {
      return res.status(400).json({ error: 'Already guessed for this answer' });
    }

    const isCorrect = answer.is_ai === guess_ai;

    await Guess.create({
      user_id: userId,
      answer_id: answerId,
      guess_ai,
      correct: isCorrect
    });

    // Scoring logic
    const user = await User.findByPk(userId);
    if (isCorrect) {
      user.score += 1;
      // No longer deducting points from doctors when caught
    } else {
      if (!answer.is_ai && answer.answerer_id) {
        const doc = await User.findByPk(answer.answerer_id);
        doc.score += 1;
        await doc.save();
      }
    }
    await user.save();

    logger.milestone(`Guess by '${user.username}' -> Result: ${isCorrect ? 'CORRECT' : 'FOOLED'} (Actual: ${answer.is_ai ? 'AI' : 'Human'})`);

    res.json({ message: 'Guess recorded', correct: isCorrect, newScore: user.score, actual_was_ai: answer.is_ai });
  } catch (err) {
    logger.error('SubmitGuess Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getScoreboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const groupId = user.group_id;

    if (!groupId) {
      return res.json([]);
    }

    const users = await User.findAll({
      where: { group_id: groupId },
      attributes: ['id', 'username', 'role', 'score'],
      order: [['score', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
