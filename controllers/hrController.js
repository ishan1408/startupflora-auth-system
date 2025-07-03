const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Role = require('../models/Role');
const Department = require('../models/Department');
const mongoose = require('mongoose');

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { status: 'pending' } },
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
    res.status(500).json({ message: 'Error fetching pending users', error: err.message });
  }
};


exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { departmentId, roleId } = req.body || {};

    const user = await User.findById(userId);
    if (!user || user.status !== 'pending') {
      return res.status(404).json({ message: 'Pending user not found' });
    }

    if (departmentId) {
      const departmentExists = await Department.findById(departmentId);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      user.department = departmentId;
    }

    if (roleId) {
      const roleExists = await Role.findById(roleId);
      if (!roleExists) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }
      user.role = roleId;
    }

    user.status = 'active';
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'approve_user',
      performedBy: req.user?._id || null,
      details: { departmentId, roleId }
    });

    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Error approving user', error: err.message });
  }
};



exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.status !== 'pending') {
      return res.status(404).json({ message: 'Pending user not found' });
    }

    await User.findByIdAndDelete(userId);

    await AuditLog.create({
      userId,
      action: 'reject_user',
      performedBy: req.user ? req.user._id : null,
      details: { email: user.email },
    });

    res.json({ message: 'User rejected and deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting user', error: err.message });
  }
};
