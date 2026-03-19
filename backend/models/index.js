const sequelize = require('../config/database');
const Group = require('./Group');
const User = require('./User');
const Question = require('./Question');
const Answer = require('./Answer');
const Guess = require('./Guess');

// Group <-> User
Group.hasMany(User, { foreignKey: 'group_id', as: 'users' });
User.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// Group <-> Question
Group.hasMany(Question, { foreignKey: 'group_id', as: 'questions' });
Question.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User <-> Question
User.hasMany(Question, { foreignKey: 'user_id', as: 'questions' });
Question.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Question <-> Answer (One-to-One mostly, but maybe a question can have multiple answers if needed. Let's do One-to-One as per logic)
Question.hasOne(Answer, { foreignKey: 'question_id', as: 'answer' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// User <-> Answer (Doctor who answered)
User.hasMany(Answer, { foreignKey: 'answerer_id', as: 'given_answers' });
Answer.belongsTo(User, { foreignKey: 'answerer_id', as: 'answerer' });

// User <-> Guess
User.hasMany(Guess, { foreignKey: 'user_id', as: 'guesses' });
Guess.belongsTo(User, { foreignKey: 'user_id', as: 'guesser' });

// Answer <-> Guess
Answer.hasMany(Guess, { foreignKey: 'answer_id', as: 'guesses' });
Guess.belongsTo(Answer, { foreignKey: 'answer_id', as: 'answer' });

module.exports = {
  sequelize,
  Group,
  User,
  Question,
  Answer,
  Guess,
};
