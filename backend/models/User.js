const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Made optional for guest users
  },
  role: {
    type: DataTypes.ENUM('user', 'doctor', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Guests who haven't joined a group
  }
});

module.exports = User;
