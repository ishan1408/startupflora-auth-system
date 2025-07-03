const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.overridePermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { overrides } = req.body; 

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.permissionOverrides = overrides;
    await user.save();

    await AuditLog.create({
      userId,
      action: 'update_permissions',
      performedBy: req.user._id,
      details: overrides
    });

    res.json({ message: 'Permissions updated successfully', overrides });
  } catch (err) {
    res.status(500).json({ message: 'Error updating permissions', error: err.message });
  }
};
