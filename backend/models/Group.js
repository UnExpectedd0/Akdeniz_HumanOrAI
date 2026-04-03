const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  creator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Group;
