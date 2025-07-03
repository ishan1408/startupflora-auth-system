const express = require('express');
const router = express.Router();

const { extractUser, isAdmin, isHRorAdmin } = require('../middlewares/auth');
const { checkRole, checkPermission  } = require('../middlewares/accessControl');
const { overridePermissions } = require('../controllers/permissionController');
const { deleteUser } = require('../controllers/authController');

router.patch(
  '/:userId',
  extractUser,
  checkRole(['admin', 'hr']),
  overridePermissions
);

router.delete(
  '/users/:id',
  extractUser,
  checkPermission('delete_user'),
  deleteUser
);

module.exports = router;
