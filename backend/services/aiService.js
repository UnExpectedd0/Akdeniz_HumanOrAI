const { Answer, Question } = require('../models');
const { getIo } = require('./socketService');
const { GoogleGenAI } = require('@google/genai');

const requestTimestamps = [];
const AI_RPM_LIMIT = 14; // Safely below 15 to prevent accidental 429 errors

const isAiRateLimited = () => {
  const now = Date.now();
  // Remove timestamps older than exactly 1 minute
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length >= AI_RPM_LIMIT;
};

const recordAiRequest = () => {
  requestTimestamps.push(Date.now());
};

const getAIResponse = async (questionText) => {
  try {
    let ai;
    let modelName = 'gemini-2.5-flash';

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      ai = new GoogleGenAI({
        vertexai: { project: 'humanorai-490512', location: 'us-central1' },
        project: 'humanorai-490512',
        location: 'us-central1'
      });
    }

    if (ai) {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural. Question: ${questionText}`,
      });
      
      if (response && response.text) {
        return response.text;
      }
    }
  } catch (error) {
    console.error('AI Service Error (falling back to mock data):', error.message);
  }

  // FALLBACK FOR FRIENDS TESTING WITHOUT ACCOUNTS:
  // Give a slightly robotic, simulated response so the game still works!
  console.log("Using Mock AI Fallback!");
  const mockResponses = [
    "[MOCK FALLBACK] As an AI, based on my knowledge base, the answer to your query is quite straightforward. However, consulting a professional is always recommended.",
    "[MOCK FALLBACK] A fascinating question! I have analyzed thousands of similar cases and the consensus points towards this being a common occurrence.",
    "[MOCK FALLBACK] Beep boop- just kidding! Here's the information you requested. Let me know if you need anything else.",
    "[MOCK FALLBACK] That is an interesting topic. Research indicates that the primary factor here is mostly related to standard environmental variables.",
    "[MOCK FALLBACK] I'm sorry, but I cannot provide a definitive medical diagnosis. However, logically speaking, those symptoms often correlate with mild fatigue."
  ];
  
  // Wait 1.5 seconds to simulate "thinking" time
  await new Promise(r => setTimeout(r, 1500));
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
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

module.exports = { handleAIQuestion, isAiRateLimited, recordAiRequest };
