const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // role is 'user' or 'doctor'
    const userRole = role === 'doctor' ? 'doctor' : 'user';

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role: userRole });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, score: user.score } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
