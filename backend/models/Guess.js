const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guess = sequelize.define('Guess', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  guess_ai: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

module.exports = Guess;
