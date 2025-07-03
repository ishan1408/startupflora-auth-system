const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema({
  deviceInfo: String,
  loginTime: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
}, { _id: false });

const otpSchema = new mongoose.Schema({
  otpCode: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const permissionOverrideSchema = new mongoose.Schema({
  permissionKey: String,
  allow: Boolean,
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[\w-\.]+@startupflora\.com$/, 'Only @startupflora.com emails allowed']
  },
  password: { type: String, required: true, minlength: 6 },
  role: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Role',
},
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

  otp: otpSchema,
  sessions: [sessionSchema],
  permissionOverrides: [permissionOverrideSchema],
  
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
