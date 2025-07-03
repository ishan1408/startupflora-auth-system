require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const AuditLog = require('../models/AuditLog');

console.log('🔍 MONGO_URI:', process.env.MONGO_URI);

const clearLogs = async () => {
  try {
    await connectDB();
    const result = await AuditLog.deleteMany({});
    console.log(`✅ Cleared ${result.deletedCount} audit logs.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing audit logs:', err);
    process.exit(1);
  }
};

clearLogs();
