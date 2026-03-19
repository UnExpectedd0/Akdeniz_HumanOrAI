const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Group } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const DOCTOR_SECRET = process.env.DOCTOR_SECRET || 'MEDIC2026'; // Default secret key

exports.register = async (req, res) => {
  try {
    const { username, password, secretKey } = req.body;
    
    // Only allow signups if they know the secret key
    if (secretKey !== DOCTOR_SECRET) {
      return res.status(403).json({ error: 'Invalid Doctor Invite Code.' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    // Force role to doctor
    const user = await User.create({ username, password: hashedPassword, role: 'doctor' });

    res.status(201).json({ message: 'Doctor account created successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(400).json({ error: 'Guest accounts cannot use password login' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username, group_id: user.group_id }, JWT_SECRET, { expiresIn: '1d' });

    let groupCode = null;
    if (user.group_id) {
      const group = await Group.findByPk(user.group_id);
      if (group) groupCode = group.code;
    }

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, score: user.score, group_id: user.group_id, groupCode } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.guestLogin = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    let user = await User.findOne({ where: { username } });
    if (user && user.role === 'doctor') {
      return res.status(400).json({ error: 'Username taken by a doctor. Please log in.' });
    }
    
    if (!user) {
      user = await User.create({ username, role: 'user' }); // No password for guests
    }

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username, group_id: user.group_id }, JWT_SECRET, { expiresIn: '1d' });

    let groupCode = null;
    if (user.group_id) {
      const group = await Group.findByPk(user.group_id);
      if (group) groupCode = group.code;
    }

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, score: user.score, group_id: user.group_id, groupCode } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate a random 6 char alphanumeric code
const generateGroupCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateGroupCode();
      const existing = await Group.findOne({ where: { code } });
      if (!existing) isUnique = true;
    }

    const group = await Group.create({ code });
    
    // Reset score to 0 and Update user group_id
    await User.update({ group_id: group.id, score: 0 }, { where: { id: userId } });

    res.status(201).json({ message: 'Group created', groupCode: group.code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) return res.status(400).json({ error: 'Group code is required' });

    const group = await Group.findOne({ where: { code: code.toUpperCase() } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Reset score to 0 for the new session
    await User.update({ group_id: group.id, score: 0 }, { where: { id: userId } });

    res.json({ message: 'Joined group successfully', groupCode: group.code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.update({ group_id: null }, { where: { id: userId } });
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
