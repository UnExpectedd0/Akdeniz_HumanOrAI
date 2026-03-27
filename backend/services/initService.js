const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('./logger');

const initAdmin = async () => {
  try {
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminUser) {
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        logger.warn('ADMIN_USERNAME or ADMIN_PASSWORD not set in .env. Admin creation skipped.');
        return;
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      
      await User.create({
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin'
      });
      
      logger.success('Default admin user created successfully.');
    }
  } catch (error) {
    logger.error('Error creating default admin:', error);
  }
};

module.exports = { initAdmin };
