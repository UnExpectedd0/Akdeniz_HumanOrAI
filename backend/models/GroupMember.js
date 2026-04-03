const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'user_group_unique',
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'user_group_unique',
  },
  role: {
    type: DataTypes.ENUM('user', 'doctor'),
    allowNull: false,
  },
  // User Stats
  correct_guesses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  incorrect_guesses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  incorrect_ai: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  incorrect_human: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ai_answers_encountered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  human_answers_encountered: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Doctor Stats
  tricked_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_to_trick: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = GroupMember;
