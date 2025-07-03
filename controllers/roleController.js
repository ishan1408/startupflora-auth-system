const Role = require('../models/Role');

exports.createRole = async (req, res) => {
  try {
    const { name, defaultPermissions } = req.body;
    const role = new Role({ name, defaultPermissions });
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: 'Error creating role', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndUpdate(id, req.body, { new: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(400).json({ message: 'Error updating role', error: err.message });
  }
};
