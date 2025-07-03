const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const extractUser = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(decoded.id) } },
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
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: {
            _id: 1,
            name: 1,
            defaultPermissions: 1
          },
          permissionOverrides: 1
        }
      }
    ]);

    const user = users[0];

    if (!user) return res.status(401).json({ message: 'Invalid token or user not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

const isAdmin = async (req, res, next) => {
  await extractUser(req, res, async () => {
    if (!req.user || req.user.role.name !== 'admin') {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'unauthorized_access',
        performedBy: req.user?._id,
        details: { message: 'Admin-only route access attempt' }
      });
      return res.status(403).json({ message: 'Admins only' });
    }
    next();
  });
};

const isHRorAdmin = async (req, res, next) => {
  await extractUser(req, res, async () => {
    if (!req.user || !['admin', 'hr'].includes(req.user.role.name)) {
      await AuditLog.create({
        userId: req.user?._id,
        action: 'unauthorized_access',
        performedBy: req.user?._id,
        details: { message: 'HR/Admin-only route access attempt' }
      });
      return res.status(403).json({ message: 'HR or Admin only' });
    }
    next();
  });
};



module.exports = {isAdmin, isHRorAdmin, extractUser  };
