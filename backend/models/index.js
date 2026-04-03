const sequelize = require('../config/database');
const Group = require('./Group');
const User = require('./User');
const GroupMember = require('./GroupMember');
const Question = require('./Question');
const Answer = require('./Answer');
const Guess = require('./Guess');
const Prompt = require('./Prompt');

// Group <-> User
Group.hasMany(User, { foreignKey: 'group_id', as: 'users', onDelete: 'SET NULL' });
User.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// Group <-> GroupMember
Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'members', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User <-> GroupMember
User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'groupStats' });
GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Group (Creator)
User.hasMany(Group, { foreignKey: 'creator_id', as: 'createdGroups' });
Group.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

// Group <-> Question
Group.hasMany(Question, { foreignKey: 'group_id', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User <-> Question
User.hasMany(Question, { foreignKey: 'user_id', as: 'questions' });
Question.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Question <-> Doctor (Accepted by)
User.hasMany(Question, { foreignKey: 'accepted_by', as: 'accepted_questions' });
Question.belongsTo(User, { foreignKey: 'accepted_by', as: 'acceptor' });

// Question <-> Answer
Question.hasOne(Answer, { foreignKey: 'question_id', as: 'answer', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// User <-> Answer (Doctor who answered)
User.hasMany(Answer, { foreignKey: 'answerer_id', as: 'given_answers' });
Answer.belongsTo(User, { foreignKey: 'answerer_id', as: 'answerer' });

// User <-> Guess
User.hasMany(Guess, { foreignKey: 'user_id', as: 'guesses' });
Guess.belongsTo(User, { foreignKey: 'user_id', as: 'guesser' });

// Answer <-> Guess
Answer.hasMany(Guess, { foreignKey: 'answer_id', as: 'guesses', onDelete: 'CASCADE' });
Guess.belongsTo(Answer, { foreignKey: 'answer_id', as: 'answer' });

module.exports = {
  sequelize,
  Group,
  User,
  GroupMember,
  Question,
  Answer,
  Guess,
  Prompt,
};
