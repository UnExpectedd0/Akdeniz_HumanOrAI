const { Answer, Question, Prompt } = require('../models');
const { getIo } = require('./socketService');
const { GoogleGenAI } = require('@google/genai');
const logger = require('./logger');

const AI_RPM_LIMIT = 14; // Safely below 15 to prevent accidental 429 errors

// Per-key rate limit tracking
const keyTimestamps = {
  primary: [],
  secondary: []
};

// Tracks hard blocks (like 429 Resource Exhausted)
const keyExhaustedUntil = {
  primary: 0,
  secondary: 0
};

const DEFAULT_PROMPT =
  'Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural.';

// Returns which key slot is available ('primary', 'secondary', or null if all limited)
const getAvailableKeySlot = () => {
  const now = Date.now();
  for (const slot of ['primary', 'secondary']) {
    const ts = keyTimestamps[slot];
    while (ts.length > 0 && now - ts[0] > 60000) ts.shift();
    if (ts.length < AI_RPM_LIMIT) return slot;
  }
  return null; // All keys exhausted
};

// Legacy: checks if ALL keys are rate limited (used in gameController)
const isAiRateLimited = () => getAvailableKeySlot() === null;

const recordAiRequest = (slot) => {
  const target = slot || 'primary';
  keyTimestamps[target].push(Date.now());
};

const getLayoutPrompt = async () => {
  try {
    const row = await Prompt.findOne({ where: { name: 'layout_prompt' } });
    if (row && row.content) return row.content;
  } catch (err) {
    logger.error('Could not load layout prompt from DB, using default:', err);
  }
  return DEFAULT_PROMPT;
};

const getAIResponse = async (questionText, preferredSlot) => {
  const layoutPrompt = await getLayoutPrompt();
  const fullPrompt = `${layoutPrompt} Question: ${questionText}`;
  const modelName = 'gemini-2.5-flash';

  // Build API key candidates in preference order
  const keyCandidates = [];
  if (preferredSlot === 'secondary') {
    if (process.env.GEMINI_API_KEY_2) keyCandidates.push({ slot: 'secondary', key: process.env.GEMINI_API_KEY_2 });
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') keyCandidates.push({ slot: 'primary', key: process.env.GEMINI_API_KEY });
  } else {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') keyCandidates.push({ slot: 'primary', key: process.env.GEMINI_API_KEY });
    if (process.env.GEMINI_API_KEY_2) keyCandidates.push({ slot: 'secondary', key: process.env.GEMINI_API_KEY_2 });
  }

  for (const candidate of keyCandidates) {
    // Skip if this key is explicitly blocked
    if (Date.now() < keyExhaustedUntil[candidate.slot]) continue;

    try {
      const ai = new GoogleGenAI({ apiKey: candidate.key });
      const response = await ai.models.generateContent({ model: modelName, contents: fullPrompt });
      if (response && response.text) {
        logger.milestone(`AI response via ${candidate.slot} key`);
        return response.text;
      }
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
        logger.error(`AI Quota Exhausted for ${candidate.slot} key! Blocking for 1 hour.`);
        keyExhaustedUntil[candidate.slot] = Date.now() + (60 * 60 * 1000); // 1 hour block
      } else {
        logger.error(`AI Service Error with ${candidate.slot} key:`, error.message);
      }
    }
  }

  // Vertex AI fallback
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const ai = new GoogleGenAI({
        vertexai: { project: 'humanorai-490512', location: 'us-central1' },
        project: 'humanorai-490512',
        location: 'us-central1'
      });
      const response = await ai.models.generateContent({ model: modelName, contents: fullPrompt });
      if (response && response.text) return response.text;
    } catch (error) {
      logger.error('AI Service Error with Vertex AI:', error.message);
    }
  }

  // FALLBACK FOR FRIENDS TESTING WITHOUT ACCOUNTS:
  // Give a slightly robotic, simulated response so the game still works!
  logger.warn("Using Mock AI Fallback!");
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


const handleAIQuestion = async (questionId, questionText, userId, preferredSlot) => {
  try {
    const aiText = await getAIResponse(questionText, preferredSlot);
    
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
    logger.error('Error handling AI question', err);
  }
};

const getAiStatus = () => {
  const now = Date.now();
  const stats = {};

  ['primary', 'secondary'].forEach(slot => {
    // Clean up old timestamps
    const ts = keyTimestamps[slot];
    while (ts.length > 0 && now - ts[0] > 60000) ts.shift();

    const isExhausted = now < keyExhaustedUntil[slot];
    let waitSeconds = 0;

    if (isExhausted) {
      waitSeconds = Math.ceil((keyExhaustedUntil[slot] - now) / 1000);
    } else if (ts.length >= AI_RPM_LIMIT) {
      // If at RPM limit, wait is time until oldest timestamp expires
      waitSeconds = Math.ceil((60000 - (now - ts[0])) / 1000);
    }

    stats[slot] = {
      used: ts.length,
      limit: AI_RPM_LIMIT,
      isExhausted,
      waitSeconds: Math.max(0, waitSeconds)
    };
  });

  return stats;
};

module.exports = { 
  handleAIQuestion, 
  getAIResponse, 
  isAiRateLimited, 
  recordAiRequest, 
  getAvailableKeySlot,
  getAiStatus
};
