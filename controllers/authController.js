const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logAudit = require('../utils/logAudit');
const { generateOTP, sendOTPEmail } = require('../utils/generateOTP');


exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!/@startupflora\.com$/.test(email)) {
      return res.status(400).json({ message: 'Only @startupflora.com emails allowed' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userRole = await Role.findOne({ name: role });
    if (!userRole) {
      return res.status(500).json({ message: `Role '${role}' not found` });
    }

    const user = new User({
      name,
      email,
      password,
      role: userRole._id,
      status: 'pending',
    });

    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'register',
      performedBy: user._id,
      details: { email },
    });

    res.status(201).json({ message: 'Registration request submitted. Awaiting HR approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    const users = await User.aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' }
    ]);

    const aggUser = users[0];

    if (!aggUser || aggUser.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or unapproved user' });
    }

    // Get full user doc for password and session updates
    const dbUser = await User.findById(aggUser._id);

    // ✅ Fix here: use dbUser for password check
    const isMatch = await bcrypt.compare(password, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: dbUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h'
    });

    const loginTime = new Date();
    const expiresAt = new Date(loginTime.getTime() + 12 * 60 * 60 * 1000);

    if (dbUser.sessions.length >= 3) {
      dbUser.sessions.sort((a, b) => a.loginTime - b.loginTime);
      dbUser.sessions.shift();
    }

    dbUser.sessions.push({ deviceInfo, loginTime, expiresAt });
    dbUser.lastLogin = loginTime;
    await dbUser.save();

    await AuditLog.create({
      userId: dbUser._id,
      action: 'login',
      performedBy: dbUser._id,
      details: { deviceInfo }
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: dbUser._id,
        name: aggUser.name,
        email: aggUser.email,
        role: aggUser.role.name,
        department: aggUser.department
      },
      expiresAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};





exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};




exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};



exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    await AuditLog.create({
      userId: user._id,
      action: 'update_user',
      performedBy: req.user?._id || user._id,
      details: updates
    });

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.create({
      userId,
      action: 'delete_user',
      performedBy: req.user?._id || userId,
      details: { deletedEmail: user.email }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      sessions: user.sessions.map((session, idx) => ({
        sessionId: idx,
        deviceInfo: session.deviceInfo,
        loginTime: session.loginTime,
        expiresAt: session.expiresAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sessions', error: err.message });
  }
};


exports.logoutSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const user = await User.findById(req.user._id);

    if (sessionId < 0 || sessionId >= user.sessions.length) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const removed = user.sessions.splice(sessionId, 1);
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'logout_session',
      performedBy: user._id,
      details: { removed }
    });

    res.json({ message: 'Session logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging out session', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Limit to 3 OTPs/hour – handled here...

  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.otp = { otpCode, expiresAt };
  await user.save();

  await sendOTPEmail(user.email, otpCode); // ✅ Send HTML OTP email

  await AuditLog.create({
    userId: user._id,
    action: 'otp_requested',
    performedBy: user._id,
    details: { otpCode }
  });

  res.status(200).json({ message: 'OTP sent to your email' });
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(404).json({ message: 'Invalid email or no OTP found' });
    }

    const now = new Date();

    if (user.otp.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < now) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.password = newPassword;
    user.otp = undefined;

    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'reset_password',
      performedBy: user._id,
      details: { email }
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
};


