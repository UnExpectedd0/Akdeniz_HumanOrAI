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
    // If the Google Cloud Service Account credentials exist, try Vertex AI
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural. Question: ${questionText}`,
      });
      
      if (response && response.text) {
        return response.text;
      }
    }
  } catch (error) {
    console.error('Vertex AI Service Error (falling back to mock data):', error.message);
  }

  // FALLBACK FOR FRIENDS TESTING WITHOUT ACCOUNTS:
  // Give a slightly robotic, simulated response so the game still works!
  console.log("Using Mock AI Fallback!");
  const mockResponses = [
    "As an AI, based on my knowledge base, the answer to your query is quite straightforward. However, consulting a professional is always recommended.",
    "A fascinating question! I have analyzed thousands of similar cases and the consensus points towards this being a common occurrence.",
    "Beep boop- just kidding! Here's the information you requested. Let me know if you need anything else.",
    "That is an interesting topic. Research indicates that the primary factor here is mostly related to standard environmental variables.",
    "I'm sorry, but I cannot provide a definitive medical diagnosis. However, logically speaking, those symptoms often correlate with mild fatigue."
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

module.exports = { handleAIQuestion };
