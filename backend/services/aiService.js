const { Answer, Question } = require('../models');
const { getIo } = require('./socketService');

const { GoogleGenAI } = require('@google/genai');

// Initialize the GoogleGenAI SDK. This will automatically use the 
// GOOGLE_APPLICATION_CREDENTIALS variable we set in your .env file
const ai = new GoogleGenAI({
  // We use the vertexai backend since you are using a Google Cloud Service Account
  vertexai: {
    project: 'humanorai-490512', // Extracted from your JSON filename
    location: 'us-central1' // Standard region for Gemini Vertex AI
  }
});

const getAIResponse = async (questionText) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural. Question: ${questionText}`,
    });
    
    if (response && response.text) {
      return response.text;
    }
    throw new Error('Invalid response from AI model');
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
