const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    const dept = new Department({ name, description });
    await dept.save();
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ message: 'Error creating department', error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndUpdate(id, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(400).json({ message: 'Error updating department', error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting department', error: err.message });
  }
};
