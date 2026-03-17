const { Question, Answer, Guess, User } = require('../models');
const { handleAIQuestion } = require('../services/aiService');
const { getIo } = require('../services/socketService');

exports.askQuestion = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    // 50% chance for AI vs Doctor
    const isAiAssigned = Math.random() < 0.5;
    const status = isAiAssigned ? 'pending_ai' : 'pending_doctor';

    const question = await Question.create({
      text,
      user_id: userId,
      status
    });

    if (isAiAssigned) {
      // Background AI handling
      handleAIQuestion(question.id, text, userId);
    } else {
      // Emit to doctors
      const io = getIo();
      if (io) {
        io.to('doctors').emit('new_question', question);
      }
    }

    res.status(201).json({ message: 'Question submitted', question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPendingQuestionsForDoctors = async (req, res) => {
  try {
    const questions = await Question.findAll({
      where: { status: 'pending_doctor' },
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
    const doctorId = req.user.id;

    const question = await Question.findOne({ where: { id: questionId, status: 'pending_doctor' } });
    if (!question) {
      return res.status(404).json({ error: 'Question not found or already answered' });
    }

    const answer = await Answer.create({
      question_id: question.id,
      answerer_id: doctorId,
      text,
      is_ai: false
    });

    question.status = 'answered';
    await question.save();

    const io = getIo();
    if (io) {
      // Notify the specific user who asked
      io.to(`user_${question.user_id}`).emit('question_answered', {
        questionId: question.id,
        answerId: answer.id,
        text
      });
      // Notify other doctors that it's answered so it removes from their list
      io.to('doctors').emit('question_removed', { questionId: question.id });
    }

    res.json({ message: 'Answer submitted', answer });
  } catch (err) {
    console.error(err);
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
      user.score += 1; // User gains 1 point
      if (!answer.is_ai && answer.answerer_id) {
        const doc = await User.findByPk(answer.answerer_id);
        doc.score -= 1; // Doctor loses 1 point if guessed correctly (meaning they failed to fool the user into thinking they were AI, or vice versa)
        await doc.save();
      }
    } else {
      if (!answer.is_ai && answer.answerer_id) {
        const doc = await User.findByPk(answer.answerer_id);
        doc.score += 1; // Doctor fooled user! Gains 1 point.
        await doc.save();
      }
    }
    await user.save();

    res.json({ message: 'Guess recorded', correct: isCorrect, newScore: user.score, actual_was_ai: answer.is_ai });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getScoreboard = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'score'],
      order: [['score', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
