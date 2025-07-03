const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/auth');
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

router.post('/', isAdmin, createDepartment);
router.get('/', getDepartments);
router.patch('/:id', isAdmin, updateDepartment);
router.delete('/:id', isAdmin, deleteDepartment);

module.exports = router;
