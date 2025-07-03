const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const users = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
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

      const user = users[0];
      if (!user || !allowedRoles.includes(user.role.name)) {
        return res.status(403).json({ message: 'Access denied. Role not permitted.' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Middleware error', error: err.message });
    }
  };
};

exports.checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const users = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
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
            role: 1,
            permissionOverrides: 1 
          }
        }
      ]);

      const user = users[0];
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const permissionMap = new Map();
      (user.role.defaultPermissions || []).forEach(p => permissionMap.set(p, true));

      (user.permissionOverrides || []).forEach(override => {
        permissionMap.set(override.permissionKey, override.allow);
      });


      const isAllowed = permissionMap.get(permissionKey);
      if (!isAllowed) {
        await AuditLog.create({
          userId: user._id,
          action: 'unauthorized_permission_access',
          performedBy: user._id,
          details: { permissionKey }
        });

        return res.status(403).json({
          message: `Access denied: Missing or denied permission '${permissionKey}'`
        });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Permission middleware error', error: err.message });
    }
  };
};
