const { Prompt } = require('../models');
const { getAIResponse } = require('../services/aiService');

const DEFAULT_PROMPT_NAME = 'layout_prompt';

exports.getPrompt = async (req, res) => {
  try {
    const prompt = await Prompt.findOne({ where: { name: DEFAULT_PROMPT_NAME } });
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePrompt = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    const prompt = await Prompt.findOne({ where: { name: DEFAULT_PROMPT_NAME } });
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    prompt.content = content.trim();
    prompt.updated_by = req.user.username;
    await prompt.save();

    res.json({ message: 'Prompt updated successfully', prompt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.testPrompt = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }
    const answer = await getAIResponse(question.trim());
    const isMock = answer.startsWith('[MOCK FALLBACK]');
    res.json({ answer, isMock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
};
