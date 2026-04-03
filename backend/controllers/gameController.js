const { Question, Answer, Guess, User, GroupMember, Group } = require('../models');
const { handleAIQuestion, isAiRateLimited, recordAiRequest, getAvailableKeySlot, getAiStatus } = require('../services/aiService');
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

    // Turn-Based Check: Does this user already have an active question?
    const activeQuestion = await Question.findOne({
      where: {
        user_id: userId,
        status: ['pending_ai', 'pending_doctor', 'accepted']
      }
    });

    if (activeQuestion) {
      return res.status(400).json({ error: 'You already have an active question. Please wait for an answer.' });
    }

    // AI Limit Check: find an available API key slot
    const availableSlot = getAvailableKeySlot();

    let isAiAssigned = false;
    let chosenSlot = null;

    if (availableSlot === null) {
      isAiAssigned = false; // All keys exhausted — force to doctor
      logger.warn('AI Rate Limit reached (all keys exhausted). Falling back to human doctor.');
    } else {
      // 50% chance for AI, 50% chance for doctor
      isAiAssigned = Math.random() < 0.60;
      if (isAiAssigned) chosenSlot = availableSlot;
    }

    if (isAiAssigned) {
      recordAiRequest(chosenSlot);
    }

    const status = isAiAssigned ? 'pending_ai' : 'pending_doctor';

    const question = await Question.create({
      text,
      user_id: userId,
      status,
      group_id: groupId
    });

    if (isAiAssigned) {
      // Background AI handling — pass the chosen key slot
      handleAIQuestion(question.id, text, userId, chosenSlot);
      logger.milestone(`Question by '${user.username}' -> Assigned to: AI (slot: ${chosenSlot})`);
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
      where: {
        status: ['pending_doctor', 'accepted'],
        group_id: groupId
      },
      include: [
        { model: User, as: 'author', attributes: ['username'] },
        { model: User, as: 'acceptor', attributes: ['username'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.acceptQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    const doctorId = req.user.id;
    const docUser = await User.findByPk(doctorId);

    // Atomic Check: Is this doctor already answering something?
    const alreadyAnswering = await Question.findOne({
      where: { accepted_by: doctorId, status: 'accepted' }
    });

    if (alreadyAnswering) {
      return res.status(400).json({ error: 'You are already answering a question. Finish it first.' });
    }

    // Atomic Check: Is the question still available?
    const question = await Question.findOne({
      where: { id: questionId, status: 'pending_doctor', group_id: docUser.group_id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found or already taken' });
    }

    question.status = 'accepted';
    question.accepted_by = doctorId;
    await question.save();

    logger.milestone(`Doctor '${docUser.username}' accepted Question ID: ${question.id}`);

    const io = getIo();
    if (io) {
      io.to(`doctors_${docUser.group_id}`).emit('question_updated', {
        id: question.id,
        status: 'accepted',
        accepted_by: doctorId,
        acceptor: { username: docUser.username }
      });
    }

    res.json({ message: 'Question accepted', question });
  } catch (err) {
    logger.error('AcceptQuestion Error:', err);
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

    const question = await Question.findOne({
      where: {
        id: questionId,
        status: 'accepted',
        accepted_by: doctorId,
        group_id: docUser.group_id
      }
    });
    if (!question) {
      return res.status(404).json({ error: 'Question not found, not accepted by you, or already answered' });
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

    // Scoring logic (Group-based persistent stats)
    const user = await User.findByPk(userId);
    const member = await GroupMember.findOne({
      where: { user_id: userId, group_id: user.group_id }
    });

    if (member) {
      if (isCorrect) {
        member.correct_guesses += 1;
        user.score += 1; // Keeping global score for legacy/compatibility
      } else {
        member.incorrect_guesses += 1;
        if (answer.is_ai) {
          member.incorrect_ai += 1;
        } else {
          member.incorrect_human += 1;
        }
      }

      if (answer.is_ai) {
        member.ai_answers_encountered += 1;
      } else {
        member.human_answers_encountered += 1;
      }
      await member.save();
      await user.save();
    }

    // Doctor Stats
    if (!answer.is_ai && answer.answerer_id) {
      const docMember = await GroupMember.findOne({
        where: { user_id: answer.answerer_id, group_id: user.group_id }
      });
      const doctor = await User.findByPk(answer.answerer_id);

      if (docMember) {
        if (!isCorrect) {
          // User was tricked
          docMember.tricked_users += 1;
          if (doctor) {
            doctor.score += 1;
            await doctor.save();
          }
        } else {
          // User was NOT tricked
          docMember.failed_to_trick += 1;
        }
        await docMember.save();
      }
    }

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

    const members = await GroupMember.findAll({
      where: { group_id: groupId },
      include: [{ model: User, as: 'user', attributes: ['username'] }],
      order: [['correct_guesses', 'DESC'], ['tricked_users', 'DESC']]
    });

    // Format data for frontend
    const formatted = members.map(m => ({
      id: m.user_id,
      username: m.user?.username,
      role: m.role,
      correct_guesses: m.correct_guesses,
      incorrect_guesses: m.incorrect_guesses,
      incorrect_ai: m.incorrect_ai,
      incorrect_human: m.incorrect_human,
      ai_answers_encountered: m.ai_answers_encountered,
      human_answers_encountered: m.human_answers_encountered,
      tricked_users: m.tricked_users,
      failed_to_trick: m.failed_to_trick,
      score: m.role === 'doctor' ? m.tricked_users : m.correct_guesses // Compatible score field
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActiveQuestionForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const question = await Question.findOne({
      where: {
        user_id: userId,
        status: ['pending_ai', 'pending_doctor', 'accepted']
      },
      include: [
        {
          model: Answer,
          as: 'answer',
          include: [{ model: User, as: 'answerer', attributes: ['username'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(question);
  } catch (err) {
    logger.error('GetActiveQuestion Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(groups);
  } catch (err) {
    logger.error('GetGroups Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.creator_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the creator can delete this group' });
    }

    // Manual cleanup of related records (Extra safety for SQLite)
    await GroupMember.destroy({ where: { group_id: groupId } });
    await Question.destroy({ where: { group_id: groupId } });
    await User.update({ group_id: null }, { where: { group_id: groupId } });
    
    // Now delete the group
    await group.destroy();

    logger.milestone(`Group Deleted: ${group.name} (${group.code}) by ${req.user.username}`);

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    logger.error('DeleteGroup Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAiStatus = async (req, res) => {
  try {
    // Only Doctors or Admins should see the AI technical status
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const stats = getAiStatus();
    res.json(stats);
  } catch (err) {
    logger.error('GetAiStatus Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
