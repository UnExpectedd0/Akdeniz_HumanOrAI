const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, username }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const doctorOnly = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required' });
  }
  next();
};

module.exports = { authMiddleware, doctorOnly };
