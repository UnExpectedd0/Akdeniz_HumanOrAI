const { Answer, Question } = require('../models');
const { getIo } = require('./socketService');

const getAIResponse = async (questionText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in environment');
    return "I am an AI, but my API key is missing!";
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: `Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural. Question: ${questionText}` }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid response from Gemini');
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I'm having trouble connecting to my brain right now.";
  }
};

const handleAIQuestion = async (questionId, questionText, userId) => {
  try {
    const aiText = await getAIResponse(questionText);
    
    // Save to DB
    const answer = await Answer.create({
      question_id: questionId,
      text: aiText,
      is_ai: true,
      answerer_id: null
    });

    await Question.update({ status: 'answered' }, { where: { id: questionId } });

    // Emit to user
    const io = getIo();
    if (io) {
      io.to(`user_${userId}`).emit('question_answered', {
        questionId: questionId,
        answerId: answer.id,
        text: aiText
      });
    }
  } catch(err) {
    console.error('Error handling AI question', err);
  }
};

module.exports = { handleAIQuestion };
